'use strict';

/**
 * src/utils/AppError.js — Custom Application Error
 *
 * Distinguishes operational errors (expected, handled) from
 * programmer errors (bugs). The global error handler uses
 * isOperational to decide whether to expose the message to clients.
 */

class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {Array} errors - Optional array of validation/detail errors
   */
  constructor(message, statusCode, errors = []) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    // Capture stack trace, excluding the constructor from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
