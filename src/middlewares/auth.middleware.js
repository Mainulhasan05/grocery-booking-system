'use strict';

/**
 * src/middlewares/auth.middleware.js
 *
 * JWT authentication middleware.
 * Extracts Bearer token from Authorization header, verifies it,
 * then confirms the user still exists in the database and their
 * role has not changed since the token was issued.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../utils/constants');

const authenticate = async (req, _res, next) => {
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

    // Verify token signature and expiration
    const decoded = jwt.verify(token, config.jwt.secret);

    // Verify user still exists and role has not changed
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'role'],
    });

    if (!user) {
      throw new AppError('The user belonging to this token no longer exists', HTTP_STATUS.UNAUTHORIZED);
    }

    if (user.role !== decoded.role) {
      throw new AppError('User role has changed. Please log in again', HTTP_STATUS.UNAUTHORIZED);
    }

    // Attach verified user payload to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
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
