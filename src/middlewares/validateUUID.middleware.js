'use strict';

/**
 * src/middlewares/validateUUID.middleware.js
 *
 * Validates that a route parameter is a valid UUID v4 before
 * it reaches the service/DB layer. Prevents ugly Sequelize
 * DatabaseError responses for malformed IDs.
 */

const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../utils/constants');

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Create middleware that validates the given route param is a UUID.
 *
 * @param {string} paramName — The name of the route parameter (default: 'id')
 * @returns {Function} Express middleware
 */
const validateUUID = (paramName = 'id') => {
  return (req, _res, next) => {
    const value = req.params[paramName];

    if (!value || !UUID_V4_REGEX.test(value)) {
      return next(
        new AppError(
          `Invalid ${paramName} format — must be a valid UUID`,
          HTTP_STATUS.BAD_REQUEST
        )
      );
    }

    next();
  };
};

module.exports = validateUUID;
