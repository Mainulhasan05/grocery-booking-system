'use strict';

/**
 * src/controllers/auth.controller.js
 *
 * Thin controller layer — delegates to auth.service and formats responses.
 */

const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const user = await authService.register({ name, email, password });

  success(res, 'User registered successfully', { user }, HTTP_STATUS.CREATED);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const data = await authService.login({ email, password });

  success(res, 'Login successful', data);
});

module.exports = {
  register,
  login,
};
