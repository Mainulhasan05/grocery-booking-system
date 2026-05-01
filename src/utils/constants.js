'use strict';

/**
 * src/utils/constants.js — Application Constants
 *
 * Centralized enums and named constants. Every file must import
 * from here rather than using magic strings or numbers.
 */

const ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
});

const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
});

const HTTP_STATUS = Object.freeze({
  // 2xx Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // 4xx Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
});

module.exports = {
  ROLES,
  ORDER_STATUS,
  HTTP_STATUS,
};
