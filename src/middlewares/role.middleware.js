'use strict';

/**
 * src/middlewares/role.middleware.js
 *
 * Role-based access control middleware.
 * Must be used AFTER authenticate middleware (depends on req.user).
 */

const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Creates middleware that restricts access to specified roles.
 *
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'user')
 * @returns {Function} Express middleware
 */
const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(
        new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED)
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action',
          HTTP_STATUS.FORBIDDEN
        )
      );
    }

    next();
  };
};

module.exports = { authorize };
