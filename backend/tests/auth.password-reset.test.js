const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Mock User and ActivityLog models and email.service before loading auth.controller
jest.mock('../models/User');
jest.mock('../models/Role');
jest.mock('../models/ActivityLog');
jest.mock('../services/email.service');
jest.mock('../config/redis', () => ({
  getClient: () => ({ get: async () => null, set: async () => 'OK', del: async () => 1 }),
  isConnected: () => false
}));

const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { sendEmail } = require('../services/email.service');
const authController = require('../controllers/auth.controller');

describe('Auth Controller - Password Reset Flow Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = 'https://intervexa-ai-sooty.vercel.app';
    process.env.NODE_ENV = 'production';

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('forgotPassword', () => {
    it('1. invalid email/request handling: should return 400 when email is missing or empty', async () => {
      req = { body: {} };
      await authController.forgotPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Please provide a valid email address.'
      }));
    });

    it('2. invalid email/request handling: should return 400 when email format is invalid', async () => {
      req = { body: { email: 'invalid-email-format' } };
      await authController.forgotPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Please provide a valid email address.'
      }));
    });

    it('3. non-existent user handling: should return 200 without sending email to prevent user enumeration', async () => {
      req = { body: { email: 'nonexistent@example.com' } };
      User.findOne.mockResolvedValue(null);

      await authController.forgotPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'If an account exists with this email address, password reset instructions have been sent.'
      }));
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('4. forgot-password request & reset token generation: should generate secure token, store SHA-256 hash, and dispatch email with production reset URL', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'registered@intervexa.ai',
        resetPasswordToken: '',
        resetPasswordExpires: null,
        save: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockResolvedValue(mockUser);
      sendEmail.mockResolvedValue({ success: true, messageId: 'msg-abc-123' });

      req = {
        body: { email: 'registered@intervexa.ai' },
        headers: { origin: 'https://intervexa-ai-sooty.vercel.app' }
      };

      await authController.forgotPassword(req, res, next);

      // Verify token generated and securely hashed
      expect(mockUser.resetPasswordToken).toBeDefined();
      expect(mockUser.resetPasswordToken).toHaveLength(64); // 32 bytes hex SHA-256 hash
      expect(mockUser.resetPasswordExpires).toBeGreaterThan(Date.now());
      expect(mockUser.save).toHaveBeenCalled();

      // Verify email dispatched
      expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'registered@intervexa.ai',
        subject: 'Intervexa AI - Password Reset Request'
      }));

      // Verify reset URL in email points to production frontend and NOT localhost
      const emailCallArgs = sendEmail.mock.calls[0][0];
      expect(emailCallArgs.text).toContain('https://intervexa-ai-sooty.vercel.app/auth/reset-password?token=');
      expect(emailCallArgs.text).not.toContain('localhost');

      // Verify safe 200 response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'If an account exists with this email address, password reset instructions have been sent.'
      }));
    });

    it('5. email dispatch failure: should detect failure, clear token from db, log error, and return 503', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'registered@intervexa.ai',
        resetPasswordToken: '',
        resetPasswordExpires: null,
        save: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockResolvedValue(mockUser);
      sendEmail.mockResolvedValue({ success: false, error: 'Connection timeout' });

      req = {
        body: { email: 'registered@intervexa.ai' }
      };

      await authController.forgotPassword(req, res, next);

      // Verify token was cleared upon delivery failure
      expect(mockUser.resetPasswordToken).toBe('');
      expect(mockUser.resetPasswordExpires).toBeNull();
      expect(mockUser.save).toHaveBeenCalledTimes(2); // Initial save + clear save

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Unable to send password reset email at this time. Please try again later or contact support.'
      }));
    });
  });

  describe('resetPassword', () => {
    it('6. invalid token: should return 400 when token is not found in database', async () => {
      req = {
        body: {
          token: 'invalid_or_unknown_token_12345',
          password: 'newValidPassword123'
        }
      };
      User.findOne.mockResolvedValue(null);

      await authController.resetPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Invalid or expired password reset token'
      }));
    });

    it('7. expired token: should query with resetPasswordExpires > Date.now() and return 400 if expired', async () => {
      req = {
        body: {
          token: 'expired_token_123',
          password: 'newValidPassword123'
        }
      };
      // When token is expired, Mongoose query with { $gt: Date.now() } returns null
      User.findOne.mockResolvedValue(null);

      await authController.resetPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Invalid or expired password reset token'
      }));
    });

    it('8. password validation: should return 400 when new password is too short (< 6 chars)', async () => {
      req = {
        body: {
          token: 'valid_token_123',
          password: '123'
        }
      };

      await authController.resetPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Password must be at least 6 characters long'
      }));
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('9. successful password reset: validates token, hashes new password with bcrypt, marks user verified, and returns 200', async () => {
      const rawToken = 'plain_reset_token_secret_32bytes_value';
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      const mockUser = {
        _id: 'user-123',
        email: 'user@example.com',
        password: 'old_hashed_password',
        resetPasswordToken: hashedToken,
        resetPasswordExpires: Date.now() + 3600000,
        isVerified: false,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);
      ActivityLog.create.mockResolvedValue({});

      req = {
        body: {
          token: rawToken,
          password: 'BrandNewSecurePassword#2026'
        },
        ip: '127.0.0.1'
      };

      await authController.resetPassword(req, res, next);

      // Verify token lookup included SHA-256 hash
      expect(User.findOne).toHaveBeenCalledWith(expect.objectContaining({
        resetPasswordToken: { $in: [hashedToken, rawToken] }
      }));

      // Verify password was hashed with bcrypt
      expect(mockUser.password).not.toBe('BrandNewSecurePassword#2026');
      const isBcryptMatch = await bcrypt.compare('BrandNewSecurePassword#2026', mockUser.password);
      expect(isBcryptMatch).toBe(true);

      // Verify token was invalidated
      expect(mockUser.resetPasswordToken).toBe('');
      expect(mockUser.resetPasswordExpires).toBeNull();
      expect(mockUser.isVerified).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();

      // Verify activity log
      expect(ActivityLog.create).toHaveBeenCalledWith(expect.objectContaining({
        user: 'user-123',
        action: 'USER_PASSWORD_RESET'
      }));

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Password updated successfully. You can now log in with your new password.'
      }));
    });

    it('10. token cannot be reused: second reset attempt with same token fails because token is cleared', async () => {
      req = {
        body: {
          token: 'already_used_token',
          password: 'AnotherPassword123'
        }
      };

      // Since token was cleared to '', findOne returns null
      User.findOne.mockResolvedValue(null);

      await authController.resetPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Invalid or expired password reset token'
      }));
    });
  });
});
