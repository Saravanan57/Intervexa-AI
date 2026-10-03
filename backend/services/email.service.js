const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let cachedTransporter = null;

/**
 * Categorized error constants for clear diagnostics
 */
const EMAIL_ERROR_CATEGORIES = {
  MISSING_EMAIL_PROVIDER: 'MISSING_EMAIL_PROVIDER',
  INVALID_PROVIDER_CONFIGURATION: 'INVALID_PROVIDER_CONFIGURATION',
  INVALID_SENDER_CONFIGURATION: 'INVALID_SENDER_CONFIGURATION',
  PROVIDER_API_REJECTED: 'PROVIDER_API_REJECTED',
  SMTP_PORT_BLOCKED_BY_HOST: 'SMTP_PORT_BLOCKED_BY_HOST',
  SMTP_AUTHENTICATION_FAILED: 'SMTP_AUTHENTICATION_FAILED',
  NETWORK_OR_API_ERROR: 'NETWORK_OR_API_ERROR'
};

/**
 * Checks whether an HTTP-based email provider is configured
 */
const getHttpApiProvider = () => {
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
    return 'resend';
  }
  if ((process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim()) || 
      (process.env.SENDINBLUE_API_KEY && process.env.SENDINBLUE_API_KEY.trim())) {
    return 'brevo';
  }
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim()) {
    return 'sendgrid';
  }
  if ((process.env.POSTMARK_SERVER_TOKEN && process.env.POSTMARK_SERVER_TOKEN.trim()) ||
      (process.env.POSTMARK_API_KEY && process.env.POSTMARK_API_KEY.trim())) {
    return 'postmark';
  }
  return null;
};

/**
 * Checks whether the service is running on Render
 */
const isRenderEnvironment = () => {
  return Boolean(
    process.env.RENDER ||
    process.env.RENDER_SERVICE_ID ||
    (process.env.BACKEND_URL && process.env.BACKEND_URL.includes('onrender.com'))
  );
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
 * Checks if an email address belongs to a free consumer webmail service
 */
const isWebmailAddress = (emailStr) => {
  if (!emailStr || typeof emailStr !== 'string') return false;
  const lower = emailStr.toLowerCase();
  return (
    lower.includes('@gmail.com') ||
    lower.includes('@googlemail.com') ||
    lower.includes('@yahoo.com') ||
    lower.includes('@hotmail.com') ||
    lower.includes('@outlook.com') ||
    lower.includes('@live.com') ||
    lower.includes('@icloud.com')
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
 * Extracts safe recipient domain for logging without exposing PII
 */
const getSafeRecipientDomain = (to) => {
  if (Array.isArray(to)) to = to[0];
  if (!to || typeof to !== 'string' || !to.includes('@')) return 'unknown';
  return to.split('@')[1] || 'unknown';
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
  let from = (process.env.RESEND_FROM || '').trim();

  // If no explicit RESEND_FROM is set, check SMTP_FROM
  if (!from) {
    const smtpFrom = (process.env.SMTP_FROM || '').trim();
    // Resend rejects free webmail domains like @gmail.com with 403 unless verified
    if (smtpFrom && !isWebmailAddress(smtpFrom)) {
      from = smtpFrom;
    } else {
      from = 'Intervexa AI <onboarding@resend.dev>';
    }
  } else if (isWebmailAddress(from)) {
    console.warn(`[EMAIL WARN] RESEND_FROM uses an unverified consumer webmail domain (${from}). Defaulting to "Intervexa AI <onboarding@resend.dev>" to prevent Resend rejection.`);
    from = 'Intervexa AI <onboarding@resend.dev>';
  }

  if (!from.includes('<') && from.includes('@')) {
    from = `"Intervexa AI" <${from}>`;
  }

  let response;
  try {
    response = await fetch('https://api.resend.com/emails', {
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
  } catch (netErr) {
    const err = new Error(netErr.message || 'Network connection to Resend API failed');
    err.category = EMAIL_ERROR_CATEGORIES.NETWORK_OR_API_ERROR;
    throw err;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    let category = EMAIL_ERROR_CATEGORIES.PROVIDER_API_REJECTED;
    if (response.status === 401 || response.status === 403) {
      category = EMAIL_ERROR_CATEGORIES.INVALID_PROVIDER_CONFIGURATION;
    } else if (response.status === 422) {
      category = EMAIL_ERROR_CATEGORIES.INVALID_SENDER_CONFIGURATION;
    }
    const errorMsg = data.message || `Resend API rejected with HTTP ${response.status}`;
    const err = new Error(errorMsg);
    err.category = category;
    err.statusCode = response.status;
    throw err;
  }

  return { success: true, messageId: data.id || 'resend-sent', provider: 'resend' };
};

/**
 * Dispatches email using Brevo REST API (HTTPS port 443, 300 free emails/day)
 */
const sendViaBrevo = async ({ to, subject, html, text }) => {
  const apiKey = (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || '').trim();
  let fromEmail = (process.env.BREVO_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();
  
  if (fromEmail.includes('<') && fromEmail.includes('>')) {
    const match = fromEmail.match(/<([^>]+)>/);
    if (match && match[1]) fromEmail = match[1].trim();
  }
  if (!fromEmail || !fromEmail.includes('@')) {
    fromEmail = 'mamthasaravanan7@gmail.com';
  }

  let response;
  try {
    response = await fetch('https://api.brevo.com/v3/smtp/email', {
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
  } catch (netErr) {
    const err = new Error(netErr.message || 'Network connection to Brevo API failed');
    err.category = EMAIL_ERROR_CATEGORIES.NETWORK_OR_API_ERROR;
    throw err;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    let category = EMAIL_ERROR_CATEGORIES.PROVIDER_API_REJECTED;
    if (response.status === 401 || response.status === 403) {
      category = EMAIL_ERROR_CATEGORIES.INVALID_PROVIDER_CONFIGURATION;
    } else if (response.status === 400) {
      category = EMAIL_ERROR_CATEGORIES.INVALID_SENDER_CONFIGURATION;
    }
    const errorMsg = data.message || `Brevo API rejected with HTTP ${response.status}`;
    const err = new Error(errorMsg);
    err.category = category;
    err.statusCode = response.status;
    throw err;
  }

  return { success: true, messageId: data.messageId || 'brevo-sent', provider: 'brevo' };
};

/**
 * Dispatches email using SendGrid v3 API (HTTPS port 443)
 */
const sendViaSendGrid = async ({ to, subject, html, text }) => {
  const apiKey = (process.env.SENDGRID_API_KEY || '').trim();
  let fromEmail = (process.env.SENDGRID_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();

  if (fromEmail.includes('<') && fromEmail.includes('>')) {
    const match = fromEmail.match(/<([^>]+)>/);
    if (match && match[1]) fromEmail = match[1].trim();
  }
  if (!fromEmail || !fromEmail.includes('@')) {
    fromEmail = 'mamthasaravanan7@gmail.com';
  }

  let response;
  try {
    response = await fetch('https://api.sendgrid.com/v3/mail/send', {
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
  } catch (netErr) {
    const err = new Error(netErr.message || 'Network connection to SendGrid API failed');
    err.category = EMAIL_ERROR_CATEGORIES.NETWORK_OR_API_ERROR;
    throw err;
  }

  if (!response.ok) {
    let category = EMAIL_ERROR_CATEGORIES.PROVIDER_API_REJECTED;
    if (response.status === 401 || response.status === 403) {
      category = EMAIL_ERROR_CATEGORIES.INVALID_PROVIDER_CONFIGURATION;
    }
    const errorText = await response.text().catch(() => '');
    let parsedMsg;
    try {
      const parsed = JSON.parse(errorText);
      parsedMsg = parsed.errors?.map(e => e.message).join('; ');
    } catch (_) {
      parsedMsg = errorText;
    }
    const errorMsg = parsedMsg || `SendGrid API rejected with HTTP ${response.status}`;
    const err = new Error(errorMsg);
    err.category = category;
    err.statusCode = response.status;
    throw err;
  }

  return { success: true, messageId: 'sendgrid-sent', provider: 'sendgrid' };
};

/**
 * Dispatches email using Postmark REST API (HTTPS port 443)
 */
const sendViaPostmark = async ({ to, subject, html, text }) => {
  const token = (process.env.POSTMARK_SERVER_TOKEN || process.env.POSTMARK_API_KEY || '').trim();
  const fromEmail = getPureFromEmail();

  let response;
  try {
    response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        From: fromEmail,
        To: to,
        Subject: subject,
        HtmlBody: html,
        TextBody: text
      })
    });
  } catch (netErr) {
    const err = new Error(netErr.message || 'Network connection to Postmark API failed');
    err.category = EMAIL_ERROR_CATEGORIES.NETWORK_OR_API_ERROR;
    throw err;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    let category = EMAIL_ERROR_CATEGORIES.PROVIDER_API_REJECTED;
    if (response.status === 401 || response.status === 422) {
      category = EMAIL_ERROR_CATEGORIES.INVALID_PROVIDER_CONFIGURATION;
    }
    const errorMsg = data.Message || `Postmark API rejected with HTTP ${response.status}`;
    const err = new Error(errorMsg);
    err.category = category;
    err.statusCode = response.status;
    throw err;
  }

  return { success: true, messageId: data.MessageID || 'postmark-sent', provider: 'postmark' };
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
      category: EMAIL_ERROR_CATEGORIES.MISSING_EMAIL_PROVIDER,
      message: 'Email provider credentials not configured',
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
    const isAuthFail = err.responseCode === 535 || (err.message && err.message.toLowerCase().includes('badcredentials'));
    
    let category = EMAIL_ERROR_CATEGORIES.NETWORK_OR_API_ERROR;
    let notice;

    if (isTimeout) {
      category = EMAIL_ERROR_CATEGORIES.SMTP_PORT_BLOCKED_BY_HOST;
      notice = 'Render free tier web services block outbound SMTP ports (25, 465, 587). Configure RESEND_API_KEY or BREVO_API_KEY (HTTP API over port 443) in Render environment variables.';
    } else if (isAuthFail) {
      category = EMAIL_ERROR_CATEGORIES.SMTP_AUTHENTICATION_FAILED;
      notice = 'SMTP authentication failed. Check SMTP_USER and SMTP_PASS (Gmail requires a 16-character App Password).';
    }

    const safeError = {
      category,
      code: err.code,
      responseCode: err.responseCode,
      message: err.message,
      notice
    };
    console.error('[SMTP DIAGNOSTIC ERROR] Transporter verification failed:', safeError);
    lastVerificationResult = {
      configured: true,
      connected: false,
      category,
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
  const onRender = isRenderEnvironment();

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
    isRenderHost: onRender,
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()),
    hasBrevoApiKey: Boolean((process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim()) || (process.env.SENDINBLUE_API_KEY && process.env.SENDINBLUE_API_KEY.trim())),
    hasSendGridApiKey: Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim()),
    hasPostmarkApiKey: Boolean((process.env.POSTMARK_SERVER_TOKEN && process.env.POSTMARK_SERVER_TOKEN.trim()) || (process.env.POSTMARK_API_KEY && process.env.POSTMARK_API_KEY.trim())),
    resolvedHost: isGmail ? 'smtp.gmail.com' : (rawHost && !rawHost.includes('@') ? rawHost : 'smtp.gmail.com'),
    hasUser: !!(rawUser && rawUser !== 'mock_user' && rawUser !== 'your_smtp_user'),
    hasPass: !!(process.env.SMTP_PASS && process.env.SMTP_PASS !== 'mock_pass' && process.env.SMTP_PASS !== 'your_smtp_password'),
    hasHost: !!rawHost,
    hostContainsEmail: rawHost.includes('@'),
    hasPort: !!process.env.SMTP_PORT,
    fromAddress: getFromAddress(),
    lastVerification: lastVerificationResult,
    lastSendResult: lastSendResult,
    outboundSmtpBlockedNotice: (onRender && !apiProvider)
      ? 'Render free tier web services block outbound SMTP ports (25, 465, 587). Please configure RESEND_API_KEY or BREVO_API_KEY in Render environment variables to send emails via HTTP API (HTTPS port 443).'
      : null
  };
};

/**
 * Dispatches an email using the active email provider (HTTP API or Nodemailer SMTP with automatic fallback)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const apiProvider = getHttpApiProvider();
  const safeRecipientDomain = getSafeRecipientDomain(to);

  // 1. Priority: HTTP API (Resend, Brevo, SendGrid, Postmark) over HTTPS port 443 (immune to Render SMTP port block)
  if (apiProvider === 'resend') {
    try {
      console.log(`[EMAIL] Dispatching email to @${safeRecipientDomain} via Resend HTTP API...`);
      const result = await sendViaResend({ to, subject, html, text });
      console.log(`[EMAIL SUCCESS] Email delivered via Resend to @${safeRecipientDomain} (ID: ${result.messageId})`);
      lastSendResult = { success: true, provider: 'resend', timestamp: new Date().toISOString() };
      return result;
    } catch (err) {
      const category = err.category || EMAIL_ERROR_CATEGORIES.PROVIDER_API_REJECTED;
      console.error(`[EMAIL ERROR] Category: ${category} | Provider: resend | Domain: @${safeRecipientDomain} | Error: ${err.message}`);
      logger.error('Resend email dispatch failed to domain @%s: %s (Category: %s)', safeRecipientDomain, err.message, category);
      lastSendResult = { success: false, category, provider: 'resend', error: err.message, timestamp: new Date().toISOString() };
      return { success: false, category, provider: 'resend', error: err.message };
    }
  }

  if (apiProvider === 'brevo') {
    try {
      console.log(`[EMAIL] Dispatching email to @${safeRecipientDomain} via Brevo HTTP API...`);
      const result = await sendViaBrevo({ to, subject, html, text });
      console.log(`[EMAIL SUCCESS] Email delivered via Brevo to @${safeRecipientDomain} (ID: ${result.messageId})`);
      lastSendResult = { success: true, provider: 'brevo', timestamp: new Date().toISOString() };
      return result;
    } catch (err) {
      const category = err.category || EMAIL_ERROR_CATEGORIES.PROVIDER_API_REJECTED;
      console.error(`[EMAIL ERROR] Category: ${category} | Provider: brevo | Domain: @${safeRecipientDomain} | Error: ${err.message}`);
      logger.error('Brevo email dispatch failed to domain @%s: %s (Category: %s)', safeRecipientDomain, err.message, category);
      lastSendResult = { success: false, category, provider: 'brevo', error: err.message, timestamp: new Date().toISOString() };
      return { success: false, category, provider: 'brevo', error: err.message };
    }
  }

  if (apiProvider === 'sendgrid') {
    try {
      console.log(`[EMAIL] Dispatching email to @${safeRecipientDomain} via SendGrid HTTP API...`);
      const result = await sendViaSendGrid({ to, subject, html, text });
      console.log(`[EMAIL SUCCESS] Email delivered via SendGrid to @${safeRecipientDomain}`);
      lastSendResult = { success: true, provider: 'sendgrid', timestamp: new Date().toISOString() };
      return result;
    } catch (err) {
      const category = err.category || EMAIL_ERROR_CATEGORIES.PROVIDER_API_REJECTED;
      console.error(`[EMAIL ERROR] Category: ${category} | Provider: sendgrid | Domain: @${safeRecipientDomain} | Error: ${err.message}`);
      logger.error('SendGrid email dispatch failed to domain @%s: %s (Category: %s)', safeRecipientDomain, err.message, category);
      lastSendResult = { success: false, category, provider: 'sendgrid', error: err.message, timestamp: new Date().toISOString() };
      return { success: false, category, provider: 'sendgrid', error: err.message };
    }
  }

  if (apiProvider === 'postmark') {
    try {
      console.log(`[EMAIL] Dispatching email to @${safeRecipientDomain} via Postmark HTTP API...`);
      const result = await sendViaPostmark({ to, subject, html, text });
      console.log(`[EMAIL SUCCESS] Email delivered via Postmark to @${safeRecipientDomain}`);
      lastSendResult = { success: true, provider: 'postmark', timestamp: new Date().toISOString() };
      return result;
    } catch (err) {
      const category = err.category || EMAIL_ERROR_CATEGORIES.PROVIDER_API_REJECTED;
      console.error(`[EMAIL ERROR] Category: ${category} | Provider: postmark | Domain: @${safeRecipientDomain} | Error: ${err.message}`);
      logger.error('Postmark email dispatch failed to domain @%s: %s (Category: %s)', safeRecipientDomain, err.message, category);
      lastSendResult = { success: false, category, provider: 'postmark', error: err.message, timestamp: new Date().toISOString() };
      return { success: false, category, provider: 'postmark', error: err.message };
    }
  }

  // 2. SMTP fallback
  if (!isSmtpConfigured()) {
    const category = EMAIL_ERROR_CATEGORIES.MISSING_EMAIL_PROVIDER;
    const errorMsg = isRenderEnvironment()
      ? 'No email API provider configured. Render free tier blocks outbound SMTP ports (25, 465, 587). Please configure RESEND_API_KEY or BREVO_API_KEY in Render environment variables.'
      : 'Email delivery service is not configured on this server.';

    console.warn(`[EMAIL WARN] Category: ${category} | ${errorMsg}`);
    logger.warn('Email send aborted: %s (Category: %s)', errorMsg, category);
    return {
      success: false,
      category,
      provider: 'none',
      error: errorMsg
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
  const activeSmtpProvider = isGmail ? 'gmail' : 'custom_smtp';

  // Primary SMTP attempt
  try {
    const transporter = getTransporter();
    if (!transporter) {
      const category = EMAIL_ERROR_CATEGORIES.INVALID_PROVIDER_CONFIGURATION;
      return {
        success: false,
        category,
        provider: activeSmtpProvider,
        error: 'Unable to initialize email transporter.'
      };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Email delivered to @${safeRecipientDomain} (Message ID: ${info.messageId})`);
    lastSendResult = { success: true, provider: activeSmtpProvider, timestamp: new Date().toISOString() };
    return {
      success: true,
      provider: activeSmtpProvider,
      messageId: info.messageId
    };
  } catch (primaryErr) {
    resetTransporterCache();

    // If Gmail and connection failed, attempt alternate port fallback
    if (isGmail) {
      console.warn(`[SMTP WARN] Primary Gmail delivery to @${safeRecipientDomain} failed (${primaryErr.code || primaryErr.message}). Attempting alternate port fallback...`);
      try {
        const fallbackConfig = buildTransporterConfig(true);
        const fallbackTransporter = nodemailer.createTransport(fallbackConfig);
        const info = await fallbackTransporter.sendMail(mailOptions);
        
        cachedTransporter = fallbackTransporter;
        console.log(`[SMTP SUCCESS] Email delivered via alternate Gmail configuration to @${safeRecipientDomain} (Message ID: ${info.messageId})`);
        lastSendResult = { success: true, provider: 'gmail_fallback', timestamp: new Date().toISOString() };
        return {
          success: true,
          provider: 'gmail_fallback',
          messageId: info.messageId
        };
      } catch (fallbackErr) {
        resetTransporterCache();
        console.error('[SMTP ERROR] Alternate Gmail port fallback delivery also failed:', {
          code: fallbackErr.code,
          command: fallbackErr.command,
          responseCode: fallbackErr.responseCode,
          message: fallbackErr.message
        });
      }
    }

    const isTimeout = primaryErr.code === 'ETIMEDOUT' || (primaryErr.message && primaryErr.message.toLowerCase().includes('timeout'));
    const isAuthFail = primaryErr.responseCode === 535 || (primaryErr.message && primaryErr.message.toLowerCase().includes('badcredentials'));

    let category = EMAIL_ERROR_CATEGORIES.NETWORK_OR_API_ERROR;
    let notice;

    if (isTimeout) {
      category = EMAIL_ERROR_CATEGORIES.SMTP_PORT_BLOCKED_BY_HOST;
      notice = 'Render free tier web services block outbound SMTP ports (25, 465, 587). Configure RESEND_API_KEY or BREVO_API_KEY in Render dashboard environment variables to send emails via HTTP API (HTTPS port 443).';
    } else if (isAuthFail) {
      category = EMAIL_ERROR_CATEGORIES.SMTP_AUTHENTICATION_FAILED;
      notice = 'SMTP authentication failed. Verify SMTP_USER and SMTP_PASS.';
    }

    const safeDiagnostic = {
      category,
      provider: activeSmtpProvider,
      recipientDomain: `@${safeRecipientDomain}`,
      code: primaryErr.code,
      responseCode: primaryErr.responseCode,
      message: primaryErr.message,
      notice
    };

    console.error('[SMTP ERROR] Failed to send email:', safeDiagnostic);
    logger.error('Nodemailer delivery failed for @%s: %s (Category: %s, code: %s)', safeRecipientDomain, primaryErr.message, category, primaryErr.code || 'UNKNOWN');

    lastSendResult = {
      success: false,
      category,
      provider: activeSmtpProvider,
      code: primaryErr.code,
      responseCode: primaryErr.responseCode,
      message: primaryErr.message,
      notice,
      timestamp: new Date().toISOString()
    };

    return {
      success: false,
      category,
      provider: activeSmtpProvider,
      error: primaryErr.message,
      code: primaryErr.code,
      notice
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
  getFromAddress,
  EMAIL_ERROR_CATEGORIES
};
