const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let cachedTransporter = null;

/**
 * Checks whether an HTTP-based email provider (Resend, Brevo, SendGrid) is configured
 */
const getHttpApiProvider = () => {
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
    return 'resend';
  }
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim()) {
    return 'brevo';
  }
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim()) {
    return 'sendgrid';
  }
  return null;
};

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
 * Checks whether any email service (HTTP API or SMTP) is configured
 */
const isEmailConfigured = () => {
  return Boolean(getHttpApiProvider() || isSmtpConfigured());
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
 * Resolves the sender display name and email address safely
 */
const getFromAddress = () => {
  const user = (process.env.SMTP_USER || '').trim();
  const rawFrom = (process.env.SMTP_FROM || process.env.RESEND_FROM || '').trim();

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
 * Extracts pure email address without display name brackets
 */
const getPureFromEmail = () => {
  const fullFrom = getFromAddress();
  const match = fullFrom.match(/<([^>]+)>/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return fullFrom.replace(/"/g, '').trim();
};

/**
 * Builds transporter configuration options for SMTP with defensive sanitization
 */
const buildTransporterConfig = (useAlternateGmailPort = false) => {
  const rawUser = (process.env.SMTP_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || '').trim();
  const rawHost = (process.env.SMTP_HOST || '').trim();
  const rawPort = (process.env.SMTP_PORT || '').trim();
  const isGmail = isGmailService();

  const pass = isGmail ? rawPass.replace(/\s+/g, '') : rawPass;
  const user = rawUser;

  let cleanHost = rawHost;
  if (cleanHost.includes('@')) {
    console.warn(`[SMTP WARN] SMTP_HOST contains "@" (${cleanHost}) which is an email address, not a valid hostname. Disregarding invalid hostname and defaulting to smtp.gmail.com.`);
    cleanHost = '';
  }

  if (isGmail) {
    const specifiedPort = parseInt(rawPort, 10);
    const usePort587 = useAlternateGmailPort ? specifiedPort !== 587 : specifiedPort === 587;

    if (usePort587) {
      console.log('[SMTP] Initializing Gmail Transporter via smtp.gmail.com:587 (STARTTLS)...');
      return {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user, pass },
        connectionTimeout: 5000,
        greetingTimeout: 4000,
        socketTimeout: 10000,
        tls: {
          rejectUnauthorized: false
        }
      };
    }

    console.log('[SMTP] Initializing Gmail Transporter via direct Gmail service (port 465 SSL)...');
    return {
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 5000,
      greetingTimeout: 4000,
      socketTimeout: 10000
    };
  }

  const port = parseInt(rawPort, 10) || 587;
  const isSecure = port === 465 || process.env.SMTP_SECURE === 'true';
  const host = cleanHost || 'smtp.gmail.com';

  console.log(`[SMTP] Initializing Custom SMTP Transporter (${host}:${port}, secure=${isSecure})...`);
  return {
    host,
    port,
    secure: isSecure,
    auth: { user, pass },
    connectionTimeout: 5000,
    greetingTimeout: 4000,
    socketTimeout: 10000,
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
 * Dispatches email using Resend REST API (HTTPS port 443, never blocked by Render)
 */
const sendViaResend = async ({ to, subject, html, text }) => {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  let from = (process.env.RESEND_FROM || process.env.SMTP_FROM || '').trim();

  // If from is empty or set to personal gmail, Resend requires onboarding@resend.dev unless domain is verified
  if (!from) {
    from = 'Intervexa AI <onboarding@resend.dev>';
  } else if (!from.includes('<') && from.includes('@')) {
    from = `"Intervexa AI" <${from}>`;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.message || `Resend API error (${response.status})`;
    throw new Error(errorMsg);
  }

  return { success: true, messageId: data.id || 'resend-sent' };
};

/**
 * Dispatches email using Brevo REST API (HTTPS port 443, 300 free emails/day)
 */
const sendViaBrevo = async ({ to, subject, html, text }) => {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  const fromEmail = getPureFromEmail();

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'Intervexa AI', email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.message || `Brevo API error (${response.status})`;
    throw new Error(errorMsg);
  }

  return { success: true, messageId: data.messageId || 'brevo-sent' };
};

/**
 * Dispatches email using SendGrid v3 API (HTTPS port 443)
 */
const sendViaSendGrid = async ({ to, subject, html, text }) => {
  const apiKey = (process.env.SENDGRID_API_KEY || '').trim();
  const fromEmail = getPureFromEmail();

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: 'Intervexa AI' },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`SendGrid API error (${response.status}): ${errorText}`);
  }

  return { success: true, messageId: 'sendgrid-sent' };
};

/**
 * Verifies active transporter connection without exposing credentials
 */
const verifyTransporterConnection = async () => {
  const apiProvider = getHttpApiProvider();
  if (apiProvider) {
    lastVerificationResult = {
      configured: true,
      connected: true,
      provider: apiProvider,
      message: `HTTP Email API (${apiProvider}) ready for outbound requests via HTTPS port 443.`,
      timestamp: new Date().toISOString()
    };
    return lastVerificationResult;
  }

  if (!isSmtpConfigured()) {
    lastVerificationResult = {
      configured: false,
      connected: false,
      message: 'SMTP credentials not configured',
      timestamp: new Date().toISOString()
    };
    return lastVerificationResult;
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    lastVerificationResult = {
      configured: true,
      connected: true,
      provider: isGmailService() ? 'gmail' : 'custom_smtp',
      message: 'SMTP connection verified successfully',
      timestamp: new Date().toISOString()
    };
    return lastVerificationResult;
  } catch (err) {
    resetTransporterCache();
    const isTimeout = err.code === 'ETIMEDOUT' || (err.message && err.message.toLowerCase().includes('timeout'));
    const notice = isTimeout
      ? 'Render free tier web services block outbound SMTP ports (25, 465, 587). To send emails reliably on Render, set RESEND_API_KEY or BREVO_API_KEY (HTTP API over port 443), or upgrade to a Render paid plan.'
      : undefined;

    const safeError = {
      name: err.name,
      code: err.code,
      command: err.command,
      responseCode: err.responseCode,
      message: err.message,
      notice
    };
    console.error('[SMTP DIAGNOSTIC ERROR] Transporter verification failed:', safeError);
    lastVerificationResult = {
      configured: true,
      connected: false,
      provider: isGmailService() ? 'gmail' : 'custom_smtp',
      message: err.message,
      code: err.code,
      responseCode: err.responseCode,
      notice,
      timestamp: new Date().toISOString()
    };
    return lastVerificationResult;
  }
};

/**
 * Returns safe environment diagnostic status without secret values
 */
const getSafeStatus = () => {
  const apiProvider = getHttpApiProvider();
  const configured = isEmailConfigured();
  const rawUser = (process.env.SMTP_USER || '').trim();
  const rawHost = (process.env.SMTP_HOST || '').trim();
  const isGmail = isGmailService();

  let providerName = 'not_configured';
  if (apiProvider) {
    providerName = apiProvider;
  } else if (isGmail) {
    providerName = 'gmail';
  } else if (rawHost) {
    providerName = 'custom_smtp';
  } else if (configured) {
    providerName = 'smtp';
  }

  return {
    configured,
    provider: providerName,
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()),
    hasBrevoApiKey: Boolean(process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim()),
    hasSendGridApiKey: Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim()),
    resolvedHost: isGmail ? 'smtp.gmail.com' : (rawHost && !rawHost.includes('@') ? rawHost : 'smtp.gmail.com'),
    hasUser: !!(rawUser && rawUser !== 'mock_user' && rawUser !== 'your_smtp_user'),
    hasPass: !!(process.env.SMTP_PASS && process.env.SMTP_PASS !== 'mock_pass' && process.env.SMTP_PASS !== 'your_smtp_password'),
    hasHost: !!rawHost,
    hostContainsEmail: rawHost.includes('@'),
    hasPort: !!process.env.SMTP_PORT,
    fromAddress: getFromAddress(),
    lastVerification: lastVerificationResult,
    lastSendResult: lastSendResult,
    platformNotice: 'Render free tier web services block outbound SMTP ports (25, 465, 587). Use RESEND_API_KEY or BREVO_API_KEY for HTTP API delivery, or upgrade Render plan.'
  };
};

/**
 * Dispatches an email using the active email provider (HTTP API or Nodemailer SMTP with automatic fallback)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const apiProvider = getHttpApiProvider();

  // 1. Priority: HTTP API (Resend, Brevo, SendGrid) over HTTPS port 443 (immune to Render SMTP port block)
  if (apiProvider === 'resend') {
    try {
      console.log(`[EMAIL] Dispatching email to ${to} via Resend HTTP API...`);
      const result = await sendViaResend({ to, subject, html, text });
      console.log(`[EMAIL SUCCESS] Email delivered via Resend to ${to} (ID: ${result.messageId})`);
      lastSendResult = { success: true, to, provider: 'resend', timestamp: new Date().toISOString() };
      return result;
    } catch (err) {
      console.error('[EMAIL ERROR] Resend dispatch failed:', err.message);
      logger.error('Resend email dispatch failed to %s: %s', to, err.message);
      lastSendResult = { success: false, to, provider: 'resend', error: err.message, timestamp: new Date().toISOString() };
      return { success: false, error: err.message };
    }
  }

  if (apiProvider === 'brevo') {
    try {
      console.log(`[EMAIL] Dispatching email to ${to} via Brevo HTTP API...`);
      const result = await sendViaBrevo({ to, subject, html, text });
      console.log(`[EMAIL SUCCESS] Email delivered via Brevo to ${to} (ID: ${result.messageId})`);
      lastSendResult = { success: true, to, provider: 'brevo', timestamp: new Date().toISOString() };
      return result;
    } catch (err) {
      console.error('[EMAIL ERROR] Brevo dispatch failed:', err.message);
      logger.error('Brevo email dispatch failed to %s: %s', to, err.message);
      lastSendResult = { success: false, to, provider: 'brevo', error: err.message, timestamp: new Date().toISOString() };
      return { success: false, error: err.message };
    }
  }

  if (apiProvider === 'sendgrid') {
    try {
      console.log(`[EMAIL] Dispatching email to ${to} via SendGrid HTTP API...`);
      const result = await sendViaSendGrid({ to, subject, html, text });
      console.log(`[EMAIL SUCCESS] Email delivered via SendGrid to ${to}`);
      lastSendResult = { success: true, to, provider: 'sendgrid', timestamp: new Date().toISOString() };
      return result;
    } catch (err) {
      console.error('[EMAIL ERROR] SendGrid dispatch failed:', err.message);
      logger.error('SendGrid email dispatch failed to %s: %s', to, err.message);
      lastSendResult = { success: false, to, provider: 'sendgrid', error: err.message, timestamp: new Date().toISOString() };
      return { success: false, error: err.message };
    }
  }

  // 2. SMTP fallback
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

  // Primary SMTP attempt
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

    // If Gmail and port or connection failed, attempt alternate port fallback
    if (isGmail) {
      console.warn(`[SMTP WARN] Primary Gmail delivery to ${to} failed (${primaryErr.code || primaryErr.message}). Attempting alternate port fallback...`);
      try {
        const fallbackConfig = buildTransporterConfig(true);
        const fallbackTransporter = nodemailer.createTransport(fallbackConfig);
        const info = await fallbackTransporter.sendMail(mailOptions);
        
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

    const isTimeout = primaryErr.code === 'ETIMEDOUT' || (primaryErr.message && primaryErr.message.toLowerCase().includes('timeout'));
    const notice = isTimeout
      ? 'Render free tier blocks SMTP ports 25, 465, and 587. Configure RESEND_API_KEY or BREVO_API_KEY to send emails via HTTP API (port 443), or upgrade Render plan.'
      : undefined;

    const safeDiagnostic = {
      to,
      name: primaryErr.name,
      code: primaryErr.code,
      command: primaryErr.command,
      responseCode: primaryErr.responseCode,
      message: primaryErr.message,
      notice
    };

    console.error('[SMTP ERROR] Nodemailer failed to send email:', safeDiagnostic);
    logger.error('Nodemailer failed to send email to %s: %s (code: %s)', to, primaryErr.message, primaryErr.code || 'UNKNOWN');

    lastSendResult = {
      success: false,
      to,
      code: primaryErr.code,
      responseCode: primaryErr.responseCode,
      message: primaryErr.message,
      notice,
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
  isEmailConfigured,
  resetTransporterCache,
  verifyTransporterConnection,
  getSafeStatus,
  getFromAddress
};
