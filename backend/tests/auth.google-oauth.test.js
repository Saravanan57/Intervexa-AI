const crypto = require('crypto');

// Mock User, Role, ActivityLog, and Redis before loading auth.controller
jest.mock('../models/User');
jest.mock('../models/Role');
jest.mock('../models/ActivityLog');
jest.mock('../services/email.service');
jest.mock('../config/redis', () => ({
  getClient: () => ({ get: async () => null, set: async () => 'OK', del: async () => 1 }),
  isConnected: () => false
}));

const User = require('../models/User');
const Role = require('../models/Role');
const ActivityLog = require('../models/ActivityLog');
const authController = require('../controllers/auth.controller');

describe('Auth Controller - Google OAuth Flow Tests', () => {
  let req, res, next;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-jwt-secret-key-12345',
      JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-54321',
      GOOGLE_CLIENT_ID: 'mock-google-client-id-12345.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: 'mock-google-client-secret-abcde',
      GOOGLE_CALLBACK_URL: 'https://intervexa-ai-backend-5w9c.onrender.com/api/auth/google/callback',
      FRONTEND_URL: 'https://intervexa-ai-sooty.vercel.app',
      NODE_ENV: 'production'
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn()
    };
    next = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getGoogleAuthUrl', () => {
    it('1. should return direct Google OAuth URL to frontend without navigating through Render', () => {
      req = { protocol: 'https', get: () => 'intervexa-ai-backend-5w9c.onrender.com' };
      authController.getGoogleAuthUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        url: expect.stringContaining('https://accounts.google.com/o/oauth2/v2/auth?')
      }));

      const returnedUrl = res.json.mock.calls[0][0].url;
      expect(returnedUrl).toContain('client_id=mock-google-client-id-12345.apps.googleusercontent.com');
      expect(returnedUrl).toContain('redirect_uri=https%3A%2F%2Fintervexa-ai-backend-5w9c.onrender.com%2Fapi%2Fauth%2Fgoogle%2Fcallback');
      expect(returnedUrl).toContain('scope=openid%20email%20profile');
    });

    it('2. should return 503 when GOOGLE_CLIENT_ID is not configured', () => {
      delete process.env.GOOGLE_CLIENT_ID;
      req = {};
      authController.getGoogleAuthUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('configured')
      }));
    });
  });

  describe('googleOAuthCallback', () => {
    it('3. failed/cancelled Google login: should redirect to frontend login with error message when access_denied', async () => {
      req = {
        query: { error: 'access_denied' }
      };

      await authController.googleOAuthCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('https://intervexa-ai-sooty.vercel.app/auth/login?error=Google%20sign-in%20was%20cancelled.')
      );
    });

    it('4. missing code: should redirect to frontend login with error message', async () => {
      req = {
        query: {}
      };

      await authController.googleOAuthCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('https://intervexa-ai-sooty.vercel.app/auth/login?error=')
      );
    });

    it('5. successful callback handling: exchanges code, creates/links user, generates short-lived exchange code, and redirects to frontend without exposing tokens in URL', async () => {
      // Mock Google token exchange
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'google-access-token-123', id_token: 'google-id-token-456' })
        })
        // Mock Google userinfo endpoint
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: 'google-user-id-999',
            email: 'candidate@example.com',
            name: 'Candidate User',
            picture: 'https://lh3.googleusercontent.com/photo.jpg',
            email_verified: true
          })
        });
      global.fetch = mockFetch;

      const mockRole = { _id: 'role-candidate-1', name: 'candidate' };
      const mockUser = {
        _id: 'user-google-1',
        email: 'candidate@example.com',
        name: 'Candidate User',
        role: mockRole,
        authProvider: 'google',
        googleId: 'google-user-id-999',
        status: 'active',
        isVerified: true
      };

      // Mock findOrCreateSocialUser behavior
      User.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });
      ActivityLog.create.mockResolvedValue({});

      req = {
        query: { code: 'google-auth-code-789' },
        headers: { host: 'intervexa-ai-backend-5w9c.onrender.com' },
        protocol: 'https'
      };

      await authController.googleOAuthCallback(req, res);

      // Verify redirect target
      expect(res.redirect).toHaveBeenCalled();
      const redirectUrl = res.redirect.mock.calls[0][0];

      // CRITICAL SECURITY CHECKS:
      // 1. Must redirect to production frontend
      expect(redirectUrl).toContain('https://intervexa-ai-sooty.vercel.app/auth/callback?code=');
      // 2. NO tokens in the URL!
      expect(redirectUrl).not.toContain('token=');
      expect(redirectUrl).not.toContain('refreshToken=');
      // 3. NO localhost in URL
      expect(redirectUrl).not.toContain('localhost');

      // Extract the generated exchange code
      const urlObj = new URL(redirectUrl);
      const code = urlObj.searchParams.get('code');
      expect(code).toBeDefined();
      expect(code).toHaveLength(64); // 32 random bytes hex

      // 6. Test exchanging the code via exchangeAuthCode
      const exchangeReq = { body: { code } };
      const exchangeRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      await authController.exchangeAuthCode(exchangeReq, exchangeRes, next);

      expect(exchangeRes.status).toHaveBeenCalledWith(200);
      expect(exchangeRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({
          email: 'candidate@example.com'
        })
      }));

      // 7. Token single-use check: Trying to exchange the same code again MUST fail
      const replayRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      await authController.exchangeAuthCode(exchangeReq, replayRes, next);

      expect(replayRes.status).toHaveBeenCalledWith(400);
      expect(replayRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Invalid or expired authorization code. Please sign in again.'
      }));
    });
  });

  describe('exchangeAuthCode input validation', () => {
    it('8. should reject empty or missing code with 400', async () => {
      req = { body: {} };
      await authController.exchangeAuthCode(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Authorization code is required'
      }));
    });

    it('9. should reject unknown/tampered code with 400', async () => {
      req = { body: { code: 'nonexistent-code-12345' } };
      await authController.exchangeAuthCode(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Invalid or expired authorization code. Please sign in again.'
      }));
    });
  });
});
