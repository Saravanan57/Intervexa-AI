const request = require('supertest');
const express = require('express');

// Mock dependencies before loading controllers
jest.mock('../models/User');
jest.mock('../models/Role');
jest.mock('../models/ActivityLog');
jest.mock('../services/email.service');
jest.mock('../config/redis', () => ({
  getClient: () => ({ get: async () => null, set: async () => 'OK', del: async () => 1 }),
  isConnected: () => false
}));

const authController = require('../controllers/auth.controller');
const authRoutes = require('../routes/auth.routes');
const User = require('../models/User');

describe('Auth - Facebook Login Decommissioning & Regression Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  it('1. should verify Facebook OAuth routes are completely removed and return 404', async () => {
    const resGet = await request(app).get('/api/auth/facebook');
    expect(resGet.status).toBe(404);

    const resUrl = await request(app).get('/api/auth/facebook/url');
    expect(resUrl.status).toBe(404);

    const resCallback = await request(app).get('/api/auth/facebook/callback');
    expect(resCallback.status).toBe(404);

    const resPost = await request(app).post('/api/auth/facebook').send({});
    expect(resPost.status).toBe(404);
  });

  it('2. should verify Facebook OAuth handler methods are no longer exported by auth controller', () => {
    expect(authController.getFacebookAuthUrl).toBeUndefined();
    expect(authController.facebookOAuthRedirect).toBeUndefined();
    expect(authController.facebookOAuthCallback).toBeUndefined();
    expect(authController.facebookTokenLogin).toBeUndefined();
  });

  it('3. should guide legacy Facebook accounts without password to use Forgot Password', async () => {
    const mockUser = {
      _id: 'user-fb-1',
      email: 'legacy-fb@example.com',
      password: null,
      authProvider: 'facebook'
    };
    User.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockUser)
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'legacy-fb@example.com', password: 'AnyPassword123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Forgot Password');
    expect(res.body.message).toContain('Facebook sign-in has been removed');
  });
});
