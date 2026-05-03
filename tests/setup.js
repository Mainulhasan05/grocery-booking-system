'use strict';

/**
 * tests/setup.js — Global Test Setup
 *
 * Handles database sync before all tests and cleanup after.
 * Creates a test admin and test user with JWT tokens for reuse.
 */

const { sequelize } = require('../src/models');

/**
 * Sync DB (force: true recreates tables — test DB only).
 */
const setupDatabase = async () => {
  await sequelize.sync({ force: true });
};

/**
 * Close DB connection after all tests.
 */
const teardownDatabase = async () => {
  await sequelize.close();
};

module.exports = {
  setupDatabase,
  teardownDatabase,
};
