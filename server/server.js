require('dotenv').config();
// Validate environment configurations on startup
const validateEnv = require('./utils/validateEnv');
validateEnv();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with Credentials for HTTP-Only Cookie JWT sharing and support null origin previews
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'null'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS blocked origin'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares
app.use(express.json({ limit: '10mb' })); // Support larger HTML uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Database Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/devforge';
mongoose.connect(mongoURI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch((err) => console.error('MongoDB database connection failure:', err.message));

// Import routes
const authRoutes = require('./routes/auth');
const githubRoutes = require('./routes/github');
const deployRoutes = require('./routes/deploy');
const portfolioRoutes = require('./routes/portfolios');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const { authLimiter, aiLimiter, adminLimiter } = require('./middleware/rateLimiter');

// Mount routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/deploy', deployRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Global Centralized Error Handler Middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`DevForge AI Server is running on port ${PORT}`);
});
// Nodemon configuration reload trigger - API Key configured
