'use strict';

/**
 * src/services/auth.service.js
 *
 * Authentication business logic — registration, login, JWT signing.
 * No HTTP concerns here; only data operations and token generation.
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const { HTTP_STATUS, ROLES } = require('../utils/constants');
const logger = require('../config/logger');

/**
 * Register a new user.
 *
 * Public registration always creates a 'user' role account.
 * Admin accounts must be provisioned via database seeders
 * or a protected admin-only endpoint — never through public signup.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<object>} Created user (without password)
 */
const register = async ({ name, email, password }) => {
  // Check email uniqueness
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError('Email already registered', HTTP_STATUS.CONFLICT);
  }

  // Create user — role is hardcoded to 'user'; password hashing handled by model hook
  const user = await User.create({ name, email, password, role: ROLES.USER });

  logger.info(`New user registered: ${user.id} (${user.role})`);

  // toJSON() strips password automatically
  return user.toJSON();
};

/**
 * Authenticate a user and return a JWT.
 *
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{ user: object, token: string }>}
 */
const login = async ({ email, password }) => {
  // Find user — must explicitly select password since toJSON strips it
  const user = await User.findOne({ where: { email } });

  // Generic message to prevent email enumeration
  if (!user) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
  }

  // Compare password using model instance method
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
  }

  // Sign JWT
  const payload = { id: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  logger.info(`User logged in: ${user.id}`);

  return {
    user: user.toJSON(),
    token,
  };
};

module.exports = {
  register,
  login,
};
