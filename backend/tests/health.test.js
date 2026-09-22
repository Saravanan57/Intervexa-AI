const request = require('supertest');
const express = require('express');
const errorHandler = require('../middlewares/errorHandler');

// Create a small mock express app to avoid starting the full MongoDB database connections during simple unit tests
const testApp = express();
testApp.use(express.json());

testApp.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'Healthy' });
});

testApp.get('/error', (req, res, next) => {
  const err = new Error('Test Error Exception');
  err.statusCode = 400;
  next(err);
});

testApp.use(errorHandler);

describe('Backend System Unit Tests', () => {
  it('should respond with 200 Healthy for GET /health', async () => {
    const res = await request(testApp).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toEqual('Healthy');
  });

  it('should route errors through standard errorHandler middleware', async () => {
    const res = await request(testApp).get('/error');
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toEqual('Test Error Exception');
  });

  it('should return 401 Unauthorized when accessing protected routes without Bearer token', async () => {
    jest.mock('../config/redis', () => ({
      getClient: () => ({ get: async () => null }),
      isConnected: () => false
    }));

    const { protect } = require('../middlewares/auth');
    const protectedApp = express();
    protectedApp.use(express.json());
    protectedApp.get('/api/protected', protect, (req, res) => res.json({ success: true }));

    const res = await request(protectedApp).get('/api/protected');
    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Not authorized');
  });
});
