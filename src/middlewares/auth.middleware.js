'use strict';

/**
 * src/middlewares/auth.middleware.js
 *
 * JWT authentication middleware.
 * Extracts Bearer token from Authorization header, verifies it,
 * and attaches the decoded payload to req.user.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../utils/constants');

const authenticate = (req, _res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please provide a valid token', HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Authentication required. Please provide a valid token', HTTP_STATUS.UNAUTHORIZED);
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Attach user payload to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    // Re-throw AppError as-is
    if (err.isOperational) {
      return next(err);
    }

    // JWT-specific errors are handled by the global error handler
    next(err);
  }
};

module.exports = { authenticate };
