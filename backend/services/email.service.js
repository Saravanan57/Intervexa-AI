const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

try {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_USER || 'mock_user',
      pass: process.env.SMTP_PASS || 'mock_pass'
    }
  });
  console.log('Nodemailer SMTP Transporter configured.');
} catch (err) {
  logger.error('Nodemailer configuration error: %s', err.message);
}

const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Intervexa AI" <mamthasaravanan7@gmail.com>',
    to,
    subject,
    html,
    text
  };

  try {
    if (transporter && process.env.SMTP_USER !== 'mock_user') {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully: ${info.messageId}`);
      return info;
    } else {
      // Log the email instead of sending (Mock SMTP)
      console.log('--- MOCK EMAIL SENT ---');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content Summary: ${text || html.slice(0, 100)}...`);
      console.log('-----------------------');
      return { messageId: 'mock-id-' + Date.now() };
    }
  } catch (err) {
    logger.error('Nodemailer failed to send email to %s: %s', to, err.message);
    // Silent fail so API doesn't crash on email errors
    return { error: err.message };
  }
};

module.exports = {
  sendEmail
};
