const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let cachedTransporter = null;

/**
 * Checks whether valid, non-mock SMTP credentials are provided
 */
const isSmtpConfigured = () => {
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  return Boolean(
    user &&
    user !== 'mock_user' &&
    user !== 'your_smtp_user' &&
    pass &&
    pass !== 'mock_pass' &&
    pass !== 'your_smtp_password'
  );
};

/**
 * Clears the cached transporter instance so subsequent calls establish a fresh connection pool
 */
const resetTransporterCache = () => {
  cachedTransporter = null;
};

/**
 * Helper to inspect environment and determine if Gmail is being used
 */
const isGmailService = () => {
  const user = (process.env.SMTP_USER || '').trim().toLowerCase();
  const host = (process.env.SMTP_HOST || '').trim().toLowerCase();
  const service = (process.env.SMTP_SERVICE || '').trim().toLowerCase();

  return (
    service === 'gmail' ||
    host === 'smtp.gmail.com' ||
    host.includes('gmail') ||
    user.endsWith('@gmail.com') ||
    user.endsWith('@googlemail.com')
  );
};

/**
 * Builds transporter configuration options, with defensive sanitization
 * for environment variables (such as email addresses entered into SMTP_HOST).
 */
const buildTransporterConfig = (useAlternateGmailPort = false) => {
  const rawUser = (process.env.SMTP_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || '').trim();
  const rawHost = (process.env.SMTP_HOST || '').trim();
  const rawPort = (process.env.SMTP_PORT || '').trim();
  const isGmail = isGmailService();

  // Strip internal whitespace from Google App Passwords if user pasted with spaces (e.g., 'xxxx xxxx xxxx xxxx')
  const pass = isGmail ? rawPass.replace(/\s+/g, '') : rawPass;
  const user = rawUser;

  // Sanitize host: an email address with '@' is NEVER a valid hostname
  let cleanHost = rawHost;
  if (cleanHost.includes('@')) {
    console.warn(`[SMTP WARN] SMTP_HOST contains "@" (${cleanHost}) which is an email address, not a valid hostname. Disregarding invalid hostname and defaulting to smtp.gmail.com.`);
    cleanHost = '';
  }

  if (isGmail) {
    const specifiedPort = parseInt(rawPort, 10);
    // If alternate port is requested on fallback retry:
    // If specifiedPort was 587, alternate is 465 (service: gmail), and vice-versa
    const usePort587 = useAlternateGmailPort ? specifiedPort !== 587 : specifiedPort === 587;

    if (usePort587) {
      console.log('[SMTP] Initializing Gmail Transporter via smtp.gmail.com:587 (STARTTLS)...');
      return {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // TLS
        requireTLS: true,
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 15000,
        tls: {
          rejectUnauthorized: false
        }
      };
    }

    console.log('[SMTP] Initializing Gmail Transporter via direct Gmail service (port 465 SSL)...');
    return {
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000
    };
  }

  // Custom SMTP provider
  const port = parseInt(rawPort, 10) || 587;
  const isSecure = port === 465 || process.env.SMTP_SECURE === 'true';
  const host = cleanHost || 'smtp.gmail.com';

  console.log(`[SMTP] Initializing Custom SMTP Transporter (${host}:${port}, secure=${isSecure})...`);
  return {
    host,
    port,
    secure: isSecure,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false
    }
  };
};

/**
 * Builds or retrieves the active nodemailer transporter
 */
const getTransporter = (forceRefresh = false) => {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (cachedTransporter && !forceRefresh) {
    return cachedTransporter;
  }

  const config = buildTransporterConfig(false);
  cachedTransporter = nodemailer.createTransport(config);
  return cachedTransporter;
};

let lastVerificationResult = null;
let lastSendResult = null;

/**
 * Verifies active transporter connection without exposing credentials
 */
const verifyTransporterConnection = async () => {
  if (!isSmtpConfigured()) {
    lastVerificationResult = { configured: false, connected: false, message: 'SMTP credentials not configured', timestamp: new Date().toISOString() };
    return lastVerificationResult;
  }
  try {
    const transporter = getTransporter();
    await transporter.verify();
    lastVerificationResult = { configured: true, connected: true, message: 'SMTP connection verified successfully', timestamp: new Date().toISOString() };
    return lastVerificationResult;
  } catch (err) {
    resetTransporterCache();
    const safeError = {
      name: err.name,
      code: err.code,
      command: err.command,
      responseCode: err.responseCode,
      message: err.message
    };
    console.error('[SMTP DIAGNOSTIC ERROR] Transporter verification failed:', safeError);
    lastVerificationResult = {
      configured: true,
      connected: false,
      message: err.message,
      code: err.code,
      responseCode: err.responseCode,
      timestamp: new Date().toISOString()
    };
    return lastVerificationResult;
  }
};

/**
 * Resolves the sender display name and email address safely
 */
const getFromAddress = () => {
  const user = (process.env.SMTP_USER || '').trim();
  const rawFrom = (process.env.SMTP_FROM || '').trim();

  if (rawFrom) {
    if (rawFrom.includes('<') && rawFrom.includes('>')) {
      return rawFrom;
    }
    return `"Intervexa AI" <${rawFrom}>`;
  }

  if (user && user.includes('@')) {
    return `"Intervexa AI" <${user}>`;
  }

  return '"Intervexa AI" <mamthasaravanan7@gmail.com>';
};

/**
 * Returns safe environment diagnostic status without secret values
 */
const getSafeStatus = () => {
  const configured = isSmtpConfigured();
  const rawUser = (process.env.SMTP_USER || '').trim();
  const rawHost = (process.env.SMTP_HOST || '').trim();
  const isGmail = isGmailService();

  return {
    configured,
    provider: isGmail ? 'gmail' : (rawHost ? 'custom_smtp' : (configured ? 'smtp' : 'not_configured')),
    resolvedHost: isGmail ? 'smtp.gmail.com' : (rawHost && !rawHost.includes('@') ? rawHost : 'smtp.gmail.com'),
    hasUser: !!(rawUser && rawUser !== 'mock_user' && rawUser !== 'your_smtp_user'),
    hasPass: !!(process.env.SMTP_PASS && process.env.SMTP_PASS !== 'mock_pass' && process.env.SMTP_PASS !== 'your_smtp_password'),
    hasHost: !!rawHost,
    hostContainsEmail: rawHost.includes('@'),
    hasPort: !!process.env.SMTP_PORT,
    fromAddress: getFromAddress(),
    lastVerification: lastVerificationResult,
    lastSendResult: lastSendResult
  };
};

/**
 * Dispatches an email using the active Nodemailer transporter with automatic fallback for Gmail
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!isSmtpConfigured()) {
    console.warn(`[SMTP WARN] SMTP is not configured with active credentials on this server. Real email cannot be delivered to: ${to}`);
    return {
      success: false,
      error: 'SMTP service is not configured on this server.'
    };
  }

  const fromAddress = getFromAddress();
  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    html,
    text
  };

  const isGmail = isGmailService();

  // Primary attempt
  try {
    const transporter = getTransporter();
    if (!transporter) {
      return {
        success: false,
        error: 'Unable to initialize email transporter.'
      };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Email delivered to ${to} (Message ID: ${info.messageId})`);
    lastSendResult = { success: true, to, timestamp: new Date().toISOString() };
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (primaryErr) {
    resetTransporterCache();

    // If Gmail and port or connection failed, attempt automatic fallback between 587 and 465
    if (isGmail) {
      console.warn(`[SMTP WARN] Primary Gmail delivery to ${to} failed (${primaryErr.code || primaryErr.message}). Attempting alternate port fallback...`);
      try {
        const fallbackConfig = buildTransporterConfig(true);
        const fallbackTransporter = nodemailer.createTransport(fallbackConfig);
        const info = await fallbackTransporter.sendMail(mailOptions);
        
        // Cache the successful fallback transporter
        cachedTransporter = fallbackTransporter;
        console.log(`[SMTP SUCCESS] Email delivered via alternate Gmail configuration to ${to} (Message ID: ${info.messageId})`);
        lastSendResult = { success: true, to, fallbackUsed: true, timestamp: new Date().toISOString() };
        return {
          success: true,
          messageId: info.messageId
        };
      } catch (fallbackErr) {
        resetTransporterCache();
        console.error('[SMTP ERROR] Fallback delivery also failed:', {
          code: fallbackErr.code,
          command: fallbackErr.command,
          responseCode: fallbackErr.responseCode,
          message: fallbackErr.message
        });
      }
    }

    // Safe production diagnostics - NEVER log passwords/secrets
    const safeDiagnostic = {
      to,
      name: primaryErr.name,
      code: primaryErr.code,
      command: primaryErr.command,
      responseCode: primaryErr.responseCode,
      response: primaryErr.response,
      message: primaryErr.message
    };

    console.error('[SMTP ERROR] Nodemailer failed to send email:', safeDiagnostic);
    logger.error('Nodemailer failed to send email to %s: %s (code: %s)', to, primaryErr.message, primaryErr.code || 'UNKNOWN');

    lastSendResult = {
      success: false,
      to,
      code: primaryErr.code,
      responseCode: primaryErr.responseCode,
      message: primaryErr.message,
      timestamp: new Date().toISOString()
    };

    return {
      success: false,
      error: primaryErr.message,
      code: primaryErr.code
    };
  }
};

module.exports = {
  sendEmail,
  isSmtpConfigured,
  resetTransporterCache,
  verifyTransporterConnection,
  getSafeStatus,
  getFromAddress
};
