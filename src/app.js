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

// ─── Rate Limiting on Auth Routes ─────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    error(res, 'Too many requests, please try again later', HTTP_STATUS.TOO_MANY_REQUESTS);
  },
});
app.use('/api/v1/auth', authLimiter);

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

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  error(res, 'Route not found', HTTP_STATUS.NOT_FOUND);
});

// ─── Global Error Handler (must be last) ──────────────────────
app.use(errorHandler);

module.exports = app;
