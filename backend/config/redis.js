const redis = require('redis');

let redisClient;
let isRedisConnected = false;

// Mock cache implementation for fallback
const mockCache = {};
const mockRedisClient = {
  connect: async () => {
    console.log('Using in-memory caching system (Redis is offline).');
    isRedisConnected = false;
    return true;
  },
  get: async (key) => mockCache[key] || null,
  set: async (key, value, options) => {
    mockCache[key] = value;
    if (options && options.EX) {
      setTimeout(() => {
        delete mockCache[key];
      }, options.EX * 1000);
    }
    return 'OK';
  },
  del: async (key) => {
    delete mockCache[key];
    return 1;
  },
  quit: async () => true,
  on: () => {}
};

const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.log('No REDIS_URL environment variable set. Using in-memory caching system.');
    redisClient = mockRedisClient;
    isRedisConnected = false;
    return;
  }

  redisClient = redis.createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: () => false
    }
  });

  redisClient.on('error', (err) => {
    console.warn('Redis client error, falling back to local memory cache:', err.message);
    redisClient = mockRedisClient;
    isRedisConnected = false;
  });

  try {
    // Attempt connection
    await redisClient.connect();
    console.log('Redis client connected successfully.');
    isRedisConnected = true;
  } catch (err) {
    console.warn('Redis connection failed, falling back to local memory cache.');
    redisClient = mockRedisClient;
    await redisClient.connect();
  }
};

module.exports = {
  initRedis,
  getClient: () => redisClient,
  isConnected: () => isRedisConnected
};
