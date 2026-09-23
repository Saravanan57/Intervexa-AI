require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const { initRedis } = require('./config/redis');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

const rateLimit = require('express-rate-limit');

// Load Mongoose models before connecting DB/seeding
require('./models/Role');
require('./models/User');
require('./models/Resume');
require('./models/Question');
require('./models/Interview');
require('./models/Feedback');
require('./models/Report');
require('./models/Notification');
require('./models/Settings');
require('./models/ActivityLog');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// Configure CORS domains
const defaultAllowedOrigins = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  'https://intervexa-ai-sooty.vercel.app',
  'https://intervexa-ai.vercel.app'
];

const envOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
if (process.env.FRONTEND_URL) {
  envOrigins.push(process.env.FRONTEND_URL.trim());
}

const configuredOrigins = Array.from(new Set([
  ...defaultAllowedOrigins,
  ...envOrigins
])).map(o => o.replace(/\/$/, ''));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    const isVercelDeploy = /^https:\/\/[a-z0-9-]+(\.vercel\.app)$/i.test(cleanOrigin);
    if (configuredOrigins.includes(cleanOrigin) || isVercelDeploy || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

// Socket.IO Setup
const io = new Server(server, {
  cors: corsOptions
});

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

app.use('/api', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes mapping
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/resumes', require('./routes/resume.routes'));
app.use('/api/resume', require('./routes/resume.routes'));
app.use('/api/interviews', require('./routes/interview.routes'));
app.use('/api/interview', require('./routes/interview.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/feedback', require('./routes/feedback.routes'));

// Health check endpoints
const healthCheckHandler = (req, res) => {
  const { getSafeStatus } = require('./services/email.service');
  res.status(200).json({ 
    success: true, 
    status: 'Healthy', 
    time: new Date(),
    emailService: getSafeStatus(),
    oauthService: {
      hasGoogleAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      hasFacebookAuth: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET)
    }
  });
};
app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// Socket.IO event handler for active real-time interview transcripts & updates
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // Join a specific interview session room
  socket.on('join-session', ({ interviewId }) => {
    socket.join(interviewId);
    console.log(`Socket ${socket.id} joined interview room: ${interviewId}`);
  });

  // Client speech answer chunk transmission (realtime visual updates)
  socket.on('speech-chunk', ({ interviewId, text }) => {
    // Broadcast back to the room if multiple observers are connected (e.g. mock proctoring dashboard)
    socket.to(interviewId).emit('speech-transcript-update', { text });
  });

  // Standard disconnect event
  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Global Error Handler
app.use(errorHandler);

// Bootstrap
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    // Initialize Redis
    await initRedis();
    
    // Connect Database
    await connectDB();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (err) {
    logger.error('App bootstrap failed: %s', err.message);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server }; // Export for automated Jest tests
