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

describe('Auth Controller - Facebook OAuth Flow Tests', () => {
  let req, res, next;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-jwt-secret-key-12345',
      JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-54321',
      FACEBOOK_APP_ID: 'mock-facebook-app-id-12345',
      FACEBOOK_APP_SECRET: 'mock-facebook-app-secret-abcde',
      FACEBOOK_CALLBACK_URL: 'https://intervexa-ai-backend-5w9c.onrender.com/api/auth/facebook/callback',
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

  describe('getFacebookAuthUrl', () => {
    it('1. should return direct Facebook OAuth URL to frontend without navigating through Render', () => {
      req = { protocol: 'https', get: () => 'intervexa-ai-backend-5w9c.onrender.com' };
      authController.getFacebookAuthUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        url: expect.stringContaining('https://www.facebook.com/v19.0/dialog/oauth?')
      }));

      const returnedUrl = res.json.mock.calls[0][0].url;
      expect(returnedUrl).toContain('client_id=mock-facebook-app-id-12345');
      expect(returnedUrl).toContain('redirect_uri=https%3A%2F%2Fintervexa-ai-backend-5w9c.onrender.com%2Fapi%2Fauth%2Ffacebook%2Fcallback');
      expect(returnedUrl).toContain('scope=email%2Cpublic_profile');
      expect(returnedUrl).toContain('response_type=code');
    });

    it('2. should return 503 when FACEBOOK_APP_ID is not configured', () => {
      delete process.env.FACEBOOK_APP_ID;
      req = {};
      authController.getFacebookAuthUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('configured')
      }));
    });
  });

  describe('facebookOAuthCallback', () => {
    it('3. failed/cancelled Facebook login: should redirect to frontend login with error message when access_denied', async () => {
      req = {
        query: { error: 'access_denied', error_reason: 'user_denied' }
      };

      await authController.facebookOAuthCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('https://intervexa-ai-sooty.vercel.app/auth/login?error=Facebook%20sign-in%20was%20cancelled.')
      );
    });

    it('4. missing code: should redirect to frontend login with error message', async () => {
      req = {
        query: {}
      };

      await authController.facebookOAuthCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('https://intervexa-ai-sooty.vercel.app/auth/login?error=')
      );
    });

    it('5. missing FACEBOOK credentials: should redirect with server configuration notice', async () => {
      delete process.env.FACEBOOK_APP_ID;
      req = {
        query: { code: 'some-fb-code' }
      };

      await authController.facebookOAuthCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('Facebook%20authentication%20is%20currently%20being%20configured')
      );
    });

    it('6. invalid OAuth token response: should redirect with error when Graph API returns error', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Invalid verification code format' } })
      });

      req = {
        query: { code: 'bad-code' }
      };

      await authController.facebookOAuthCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('https://intervexa-ai-sooty.vercel.app/auth/login?error=Unable%20to%20authenticate%20with%20Facebook')
      );
    });

    it('7. successful callback handling: exchanges code, links/creates user, generates short-lived exchange code, and redirects without exposing tokens in URL', async () => {
      // Mock Graph API token exchange
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'fb-access-token-xyz', token_type: 'bearer' })
        })
        // Mock Graph API /me profile endpoint
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'fb-user-id-555',
            name: 'Facebook Candidate',
            email: 'candidate-fb@example.com',
            picture: { data: { url: 'https://graph.facebook.com/photo.jpg' } }
          })
        });
      global.fetch = mockFetch;

      const mockRole = { _id: 'role-candidate-1', name: 'candidate' };
      const mockUser = {
        _id: 'user-facebook-1',
        email: 'candidate-fb@example.com',
        name: 'Facebook Candidate',
        role: mockRole,
        authProvider: 'facebook',
        facebookId: 'fb-user-id-555',
        status: 'active',
        isVerified: true
      };

      User.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });
      ActivityLog.create.mockResolvedValue({});

      req = {
        query: { code: 'valid-facebook-auth-code' },
        headers: { host: 'intervexa-ai-backend-5w9c.onrender.com' },
        protocol: 'https'
      };

      await authController.facebookOAuthCallback(req, res);

      expect(res.redirect).toHaveBeenCalled();
      const redirectUrl = res.redirect.mock.calls[0][0];

      // CRITICAL SECURITY CHECKS:
      // 1. Must redirect to production frontend
      expect(redirectUrl).toContain('https://intervexa-ai-sooty.vercel.app/auth/callback?code=');
      // 2. NO tokens in the URL!
      expect(redirectUrl).not.toContain('token=');
      expect(redirectUrl).not.toContain('refreshToken=');
      expect(redirectUrl).not.toContain('fb-access-token-xyz');
      // 3. NO localhost in URL
      expect(redirectUrl).not.toContain('localhost');

      // Extract the generated exchange code
      const urlObj = new URL(redirectUrl);
      const code = urlObj.searchParams.get('code');
      expect(code).toBeDefined();
      expect(code).toHaveLength(64); // 32 random bytes hex

      // 8. Test exchanging the code via exchangeAuthCode
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
          email: 'candidate-fb@example.com'
        })
      }));

      // 9. Replay prevention: Exchanging the same code again MUST fail
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
});
