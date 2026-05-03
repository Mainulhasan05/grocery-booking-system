'use strict';

/**
 * tests/helpers.js — Shared Test Helpers
 *
 * Creates test users and provides JWT tokens for authenticated requests.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, GroceryItem } = require('../src/models');
const config = require('../src/config/env');

/**
 * Create a test user and return the user + JWT token.
 */
const createTestUser = async (overrides = {}) => {
  const defaults = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: await bcrypt.hash('TestPass1', 12),
    role: 'user',
  };

  const userData = { ...defaults, ...overrides };
  const user = await User.create(userData);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  return { user, token };
};

/**
 * Create a test admin and return the admin + JWT token.
 */
const createTestAdmin = async (overrides = {}) => {
  const defaults = {
    name: 'Test Admin',
    email: 'testadmin@example.com',
    password: await bcrypt.hash('AdminPass1', 12),
    role: 'admin',
  };

  const adminData = { ...defaults, ...overrides };
  const admin = await User.create(adminData);

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  return { user: admin, token };
};

/**
 * Create a test grocery item.
 */
const createTestGroceryItem = async (overrides = {}) => {
  const defaults = {
    name: 'Test Bananas',
    description: 'Fresh test bananas',
    price: 3.99,
    quantity: 100,
    is_active: true,
  };

  return GroceryItem.create({ ...defaults, ...overrides });
};

module.exports = {
  createTestUser,
  createTestAdmin,
  createTestGroceryItem,
};
