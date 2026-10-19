'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { sequelize } = require('./src/models');
const { User, Tenant } = require('./src/models');
const { ROLES } = require('./src/config/constants');

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require('./src/routes/auth.routes');
const moduleRoutes = require('./src/routes/module.routes');
const lessonRoutes = require('./src/routes/lesson.routes');
const evaluationRoutes = require('./src/routes/evaluation.routes');
const aiRoutes = require('./src/routes/ai.routes');
const progressRoutes = require('./src/routes/progress.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS - Allow frontend
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// General rate limiting (prevent brute force)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
});

app.use(globalLimiter);

// ─── Parsing Middleware ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'KDice English API is running! 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/progress', progressRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

// ─── Database & Server Startup ────────────────────────────────────────────────
async function startServer() {
  try {
    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');

    // Sync models (create tables if they don't exist)
    await sequelize.sync();
    console.log('✅ Database models synchronized');

    // Ensure super admin exists
    await ensureSuperAdmin();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log('\n🚀 KDice English API Server');
      console.log(`   📍 URL: http://localhost:${PORT}`);
      console.log(`   🌿 Environment: ${process.env.NODE_ENV}`);
      console.log(`   🏥 Health: http://localhost:${PORT}/health`);
      console.log(`   🤖 AI Limit: ${process.env.AI_DAILY_LIMIT || 20} interactions/user/day\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('\n💡 Make sure PostgreSQL is running and .env is configured correctly');
    process.exit(1);
  }
}

/**
 * Creates super admin account if it doesn't exist
 * Runs on every startup to ensure admin always exists
 */
async function ensureSuperAdmin() {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@kdice.com';
    const [admin, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        name: 'Super Admin',
        email,
        password: process.env.SUPER_ADMIN_PASSWORD || 'Admin123!',
        role: ROLES.SUPER_ADMIN,
        is_active: true,
        email_verified: true,
      },
    });

    if (created) {
      console.log(`✅ Super admin created: ${email}`);
    } else {
      console.log(`✅ Super admin verified: ${email}`);
    }
  } catch (error) {
    console.warn('⚠️  Could not ensure super admin:', error.message);
  }
}

startServer();

module.exports = app;
