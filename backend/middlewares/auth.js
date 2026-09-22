const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const redis = require('../config/redis');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length >= 2) {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    // 1. Check if token is blacklisted in Redis (for logged-out tokens)
    const redisClient = redis.getClient();
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ success: false, message: 'Token is invalid (logged out)' });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Find User
    const user = await User.findById(decoded.id).populate('role');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'User account is suspended' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Token verification failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, message: 'Access denied: Role verification failed' });
    }
    
    const userRoleName = req.user.role.name;
    if (!roles.includes(userRoleName)) {
      return res.status(403).json({ success: false, message: `Access denied: Role '${userRoleName}' not authorized` });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
