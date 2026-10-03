jest.mock('../models/Interview');
jest.mock('../models/Feedback');
jest.mock('../models/Resume');
jest.mock('../models/User');
jest.mock('../models/Role');
jest.mock('../config/redis', () => ({
  getClient: () => ({ get: async () => null, set: async () => 'OK', del: async () => 1 }),
  isConnected: () => false
}));

const Interview = require('../models/Interview');
const Feedback = require('../models/Feedback');
const Resume = require('../models/Resume');
const interviewController = require('../controllers/interview.controller');
const { protect } = require('../middlewares/auth');
const jwt = require('jsonwebtoken');

describe('Interview Controller - Download Report', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn()
    };
    next = jest.fn();
  });

  it('should return HTML report with attachment header and proper filename', async () => {
    const mockInterview = {
      _id: 'mock-interview-555',
      score: 92,
      domain: 'Full Stack',
      type: 'Technical',
      createdAt: new Date(),
      user: { name: 'John Doe', email: 'john@example.com' },
      answers: [
        {
          questionText: 'What is event-driven architecture?',
          feedbackScore: 90
        }
      ]
    };

    Interview.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockInterview)
    });
    Feedback.findOne = jest.fn().mockResolvedValue({
      technicalScore: 95,
      communicationScore: 88,
      grammarScore: 92,
      problemSolvingScore: 90,
      confidenceScore: 85,
      leadershipScore: 80,
      learningResources: ['Read architecture patterns'],
      careerSuggestions: ['Staff Engineer'],
      strengths: ['Great technical depth'],
      weaknesses: [],
      recommendations: []
    });
    Resume.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue({ score: 85 })
    });

    req = {
      params: { id: 'mock-interview-555' },
      user: { _id: 'user-123' }
    };

    await interviewController.downloadReportHtml(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html; charset=utf-8');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="interview-report-mock-interview-555.html"');
    expect(res.send).toHaveBeenCalled();
    const html = res.send.mock.calls[0][0];
    expect(html).toContain('Intervexa AI Performance Scorecard');
    expect(html).toContain('John Doe');
    expect(html).toContain('92%');
  });

  it('should return 404 if interview is not found', async () => {
    Interview.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(null)
    });

    req = {
      params: { id: 'nonexistent-id' },
      user: { _id: 'user-123' }
    };

    await interviewController.downloadReportHtml(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Report not found');
  });
});

describe('Auth Middleware - Download Token Handling', () => {
  let req, res, next;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  it('should authenticate request using query token when header is absent', async () => {
    const validToken = jwt.sign({ id: 'user-123' }, 'test-secret');
    const User = require('../models/User');
    User.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'user-123',
        status: 'active',
        role: { name: 'user' }
      })
    });

    req = {
      headers: {},
      query: { token: validToken }
    };

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.token).toBe(validToken);
  });
});
