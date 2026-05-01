'use strict';

/**
 * src/utils/response.js — Standard API Response Formatter
 *
 * Every API response MUST go through these helpers to ensure
 * the exact JSON shape defined in CLAUDE.md:
 *
 * Success: { success: true,  message, data, meta? }
 * Error:   { success: false, message, errors? }
 */

/**
 * Send a success response.
 *
 * @param {import('express').Response} res
 * @param {string} message - Human-readable success message
 * @param {*} data - Response payload
 * @param {number} [statusCode=200] - HTTP status code
 * @param {object|null} [meta=null] - Pagination metadata (page, limit, total)
 */
const success = (res, message, data, statusCode = 200, meta = null) => {
  const body = {
    success: true,
    message,
    data,
  };

  if (meta) {
    body.meta = meta;
  }

  return res.status(statusCode).json(body);
};

/**
 * Send an error response.
 *
 * @param {import('express').Response} res
 * @param {string} message - Human-readable error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {Array} [errors=[]] - Optional array of detailed errors
 */
const error = (res, message, statusCode = 500, errors = []) => {
  const body = {
    success: false,
    message,
  };

  if (errors.length > 0) {
    body.errors = errors;
  }

  return res.status(statusCode).json(body);
};

module.exports = { success, error };
