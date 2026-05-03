'use strict';

/**
 * src/app.js — Express Application Setup
 *
 * Configures the complete Express middleware stack and mounts route handlers.
 * Does NOT call app.listen() — that responsibility belongs to server.js.
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const config = require('./config/env');
const requestLogger = require('./middlewares/requestLogger.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');
const routes = require('./routes');
const { error } = require('./utils/response');
const { HTTP_STATUS } = require('./utils/constants');

const app = express();

// ─── Security Middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors());

// ─── Rate Limiting ────────────────────────────────────────────
// Disabled in test environment to avoid false 429 responses during integration tests
if (config.nodeEnv !== 'test') {
  // Global API limiter — applies to all /api routes
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                  // 100 requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      error(res, 'Too many requests, please try again later', HTTP_STATUS.TOO_MANY_REQUESTS);
    },
  });
  app.use('/api', globalLimiter);

  // Strict limiter for auth routes (login / register)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                   // 20 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      error(res, 'Too many authentication attempts, please try again later', HTTP_STATUS.TOO_MANY_REQUESTS);
    },
  });
  app.use('/api/v1/auth', authLimiter);

  // Strict limiter for order placement — prevents inventory locking abuse
  const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // 10 order attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      error(res, 'Too many order attempts, please try again later', HTTP_STATUS.TOO_MANY_REQUESTS);
    },
  });
  app.use('/api/v1/user/orders', orderLimiter);
}

// ─── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── HTTP Request Logging ─────────────────────────────────────
app.use(requestLogger);

// ─── Health Check (no auth required) ──────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Grocery Backend is healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── Swagger API Docs ─────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Grocery API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));
// Serve raw OpenAPI JSON
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  error(res, 'Route not found', HTTP_STATUS.NOT_FOUND);
});

// ─── Global Error Handler (must be last) ──────────────────────
app.use(errorHandler);

module.exports = app;

