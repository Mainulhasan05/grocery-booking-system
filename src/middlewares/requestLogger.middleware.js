'use strict';

/**
 * src/middlewares/requestLogger.middleware.js — HTTP Request Logger
 *
 * Morgan HTTP logger that pipes output through the Winston logger stream.
 * Uses 'dev' format in development, 'combined' in production.
 */

const morgan = require('morgan');
const config = require('../config/env');
const logger = require('../config/logger');

const requestLogger = morgan(
  config.isDevelopment ? 'dev' : 'combined',
  { stream: logger.stream }
);

module.exports = requestLogger;
