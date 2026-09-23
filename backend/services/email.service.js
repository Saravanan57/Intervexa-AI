const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let cachedTransporter = null;

/**
 * Checks whether valid, non-mock SMTP credentials are provided
 */
const isSmtpConfigured = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return Boolean(
    user &&
    user.trim() !== '' &&
    user !== 'mock_user' &&
    user !== 'your_smtp_user' &&
    pass &&
    pass.trim() !== '' &&
    pass !== 'mock_pass' &&
    pass !== 'your_smtp_password'
  );
};

/**
 * Builds or retrieves the active nodemailer transporter
 */
const getTransporter = () => {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (cachedTransporter) {
    return cachedTransporter;
  }

  const user = process.env.SMTP_USER.trim();
  const pass = process.env.SMTP_PASS.trim();
  const host = (process.env.SMTP_HOST || '').trim();
  const service = (process.env.SMTP_SERVICE || '').trim().toLowerCase();

  const isGmail = service === 'gmail' || host === 'smtp.gmail.com' || user.toLowerCase().endsWith('@gmail.com');

  if (isGmail && (!host || host === 'smtp.gmail.com')) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
    console.log('[SMTP] Initialized Gmail Transporter.');
  } else {
    const port = parseInt(process.env.SMTP_PORT, 10) || 587;
    const isSecure = port === 465 || process.env.SMTP_SECURE === 'true';

    cachedTransporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: port,
      secure: isSecure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
    console.log(`[SMTP] Initialized Custom SMTP Transporter (${host}:${port}, secure=${isSecure}).`);
  }

  return cachedTransporter;
};

/**
 * Verifies active transporter connection without exposing credentials
 */
const verifyTransporterConnection = async () => {
  if (!isSmtpConfigured()) {
    return { configured: false, connected: false, message: 'SMTP credentials not configured' };
  }
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { configured: true, connected: true, message: 'SMTP connection verified successfully' };
  } catch (err) {
    return { configured: true, connected: false, message: err.message };
  }
};

/**
 * Returns safe environment diagnostic status without secret values
 */
const getSafeStatus = () => {
  const configured = isSmtpConfigured();
  const user = process.env.SMTP_USER || '';
  const host = process.env.SMTP_HOST || '';
  const isGmail = (process.env.SMTP_SERVICE || '').toLowerCase() === 'gmail' || host === 'smtp.gmail.com' || user.toLowerCase().endsWith('@gmail.com');

  return {
    configured,
    provider: isGmail ? 'gmail' : (host ? 'custom_smtp' : (configured ? 'smtp' : 'not_configured')),
    hasUser: !!(user && user !== 'mock_user' && user !== 'your_smtp_user'),
    hasPass: !!(process.env.SMTP_PASS && process.env.SMTP_PASS !== 'mock_pass' && process.env.SMTP_PASS !== 'your_smtp_password'),
    hasHost: !!host,
    hasPort: !!process.env.SMTP_PORT,
    fromAddress: process.env.SMTP_FROM || (user.includes('@') ? user : 'mamthasaravanan7@gmail.com')
  };
};

/**
 * Dispatches an email using the active Nodemailer transporter
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!isSmtpConfigured()) {
    console.warn(`[SMTP WARN] SMTP is not configured with active credentials on this server. Real email cannot be delivered to: ${to}`);
    return {
      success: false,
      error: 'SMTP service is not configured on this server.'
    };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return {
      success: false,
      error: 'Unable to initialize email transporter.'
    };
  }

  const user = (process.env.SMTP_USER || '').trim();
  const fromAddress = process.env.SMTP_FROM || 
    (user.includes('@')
      ? `"Intervexa AI" <${user}>`
      : '"Intervexa AI" <mamthasaravanan7@gmail.com>');

  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    html,
    text
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Email delivered to ${to} (Message ID: ${info.messageId})`);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (err) {
    logger.error('Nodemailer failed to send email to %s: %s', to, err.message);
    return {
      success: false,
      error: err.message
    };
  }
};

module.exports = {
  sendEmail,
  isSmtpConfigured,
  verifyTransporterConnection,
  getSafeStatus
};
