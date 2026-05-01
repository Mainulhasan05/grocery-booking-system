'use strict';

/**
 * src/middlewares/errorHandler.middleware.js — Global Error Handler
 *
 * Final middleware in the Express chain. Catches all errors:
 *   - AppError (operational): sends the error message to the client
 *   - Unexpected errors: logs full details, sends generic message
 *
 * In production, stack traces are NEVER exposed to clients.
 */

const logger = require('../config/logger');
const { error: sendError } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Default to 500 if no statusCode set
  err.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  err.message = err.message || 'Internal Server Error';

  // Log the error
  logger.error({
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // ─── Operational errors (AppError): safe to expose ─────────
  if (err.isOperational) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  // ─── Sequelize validation errors ───────────────────────────
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors ? err.errors.map((e) => ({ field: e.path, message: e.message })) : [];
    return sendError(res, 'Validation error', HTTP_STATUS.BAD_REQUEST, errors);
  }

  // ─── JWT errors ────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', HTTP_STATUS.UNAUTHORIZED);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token has expired', HTTP_STATUS.UNAUTHORIZED);
  }

  // ─── Unexpected errors: never leak internals ───────────────
  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong'
    : err.message;

  return sendError(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

module.exports = errorHandler;
