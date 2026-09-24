const nodemailer = require('nodemailer');
const {
  isSmtpConfigured,
  isEmailConfigured,
  getSafeStatus,
  resetTransporterCache,
  verifyTransporterConnection,
  getFromAddress,
  sendEmail
} = require('../services/email.service');

describe('Email Service Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetTransporterCache();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
    resetTransporterCache();
  });

  it('isSmtpConfigured should return false when credentials are mock or missing', () => {
    process.env.SMTP_USER = 'mock_user';
    process.env.SMTP_PASS = 'mock_pass';
    expect(isSmtpConfigured()).toBe(false);

    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    expect(isSmtpConfigured()).toBe(false);
  });

  it('isSmtpConfigured should return true when valid credentials are present', () => {
    process.env.SMTP_USER = 'mamthasaravanan7@gmail.com';
    process.env.SMTP_PASS = 'abcd efgh ijkl mnop';
    expect(isSmtpConfigured()).toBe(true);
  });

  it('isEmailConfigured should return true when RESEND_API_KEY is present', () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    process.env.RESEND_API_KEY = 're_1234567890';
    expect(isEmailConfigured()).toBe(true);
    expect(getSafeStatus().provider).toBe('resend');
    expect(getSafeStatus().hasResendApiKey).toBe(true);
  });

  it('isEmailConfigured should return true when BREVO_API_KEY is present', () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    process.env.BREVO_API_KEY = 'xkeysib-12345';
    expect(isEmailConfigured()).toBe(true);
    expect(getSafeStatus().provider).toBe('brevo');
    expect(getSafeStatus().hasBrevoApiKey).toBe(true);
  });

  it('should sanitize invalid hostname when SMTP_HOST is set to an email address', () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.BREVO_API_KEY;
    process.env.SMTP_USER = 'mamthasaravanan7@gmail.com';
    process.env.SMTP_PASS = 'abcd efgh ijkl mnop';
    process.env.SMTP_HOST = 'mamthasaravanan7@gmail.com'; // The exact production configuration bug
    process.env.SMTP_PORT = '587';

    const status = getSafeStatus();
    expect(status.configured).toBe(true);
    expect(status.provider).toBe('gmail');
    expect(status.resolvedHost).toBe('smtp.gmail.com');
    expect(status.hostContainsEmail).toBe(true);
  });

  it('getFromAddress should format display name correctly', () => {
    process.env.SMTP_USER = 'mamthasaravanan7@gmail.com';
    process.env.SMTP_FROM = 'mamthasaravanan7@gmail.com';
    expect(getFromAddress()).toBe('"Intervexa AI" <mamthasaravanan7@gmail.com>');

    process.env.SMTP_FROM = '"Custom Team" <custom@intervexa.ai>';
    expect(getFromAddress()).toBe('"Custom Team" <custom@intervexa.ai>');
  });

  it('verifyTransporterConnection should report safe error without crashing on rejection', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.BREVO_API_KEY;
    process.env.SMTP_USER = 'test@gmail.com';
    process.env.SMTP_PASS = 'invalidpass';
    process.env.SMTP_HOST = 'smtp.gmail.com';

    const spy = jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      verify: jest.fn().mockRejectedValue(new Error('Invalid login: 535-5.7.8 BadCredentials'))
    });

    const result = await verifyTransporterConnection();
    expect(result.configured).toBe(true);
    expect(result.connected).toBe(false);
    expect(result.message).toContain('BadCredentials');
    spy.mockRestore();
  });

  it('sendEmail should dispatch via Resend REST API when RESEND_API_KEY is configured', async () => {
    process.env.RESEND_API_KEY = 're_test_key_123';
    process.env.RESEND_FROM = 'Intervexa AI <onboarding@resend.dev>';

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'resend-msg-123' })
    });
    global.fetch = mockFetch;

    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'Reset Password',
      text: 'Click here: https://intervexa-ai-sooty.vercel.app/auth/reset-password?token=123',
      html: '<p>Reset link</p>'
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('resend-msg-123');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer re_test_key_123',
          'Content-Type': 'application/json'
        })
      })
    );
  });

  it('sendEmail should handle Resend REST API errors safely without exposing secrets', async () => {
    process.env.RESEND_API_KEY = 're_invalid_key';

    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid API key' })
    });
    global.fetch = mockFetch;

    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'Reset Password',
      text: 'Test body'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid API key');
  });

  it('sendEmail should handle delivery error and return safe diagnostic error object via SMTP', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.BREVO_API_KEY;
    process.env.SMTP_USER = 'test@gmail.com';
    process.env.SMTP_PASS = 'somepass';

    const spy = jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: jest.fn().mockRejectedValue(new Error('Connection timeout'))
    });

    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'Test Subject',
      text: 'Test Body'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Connection timeout');
    spy.mockRestore();
  });

  it('sendEmail should succeed when SMTP transporter delivers message', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.BREVO_API_KEY;
    process.env.SMTP_USER = 'test@gmail.com';
    process.env.SMTP_PASS = 'somepass';

    const spy = jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'msg-12345' })
    });

    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'Test Subject',
      text: 'Test Body'
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-12345');
    spy.mockRestore();
  });
});
