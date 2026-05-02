'use strict';

/**
 * server.js — Application Entry Point
 *
 * Connects to the database and starts the HTTP server.
 * All Express configuration lives in src/app.js.
 */

require('dotenv').config();

const app = require('./src/app');
const config = require('./src/config/env');
const logger = require('./src/config/logger');
const { testConnection } = require('./src/config/database');

const start = async () => {
  try {
    // Verify database connectivity before accepting requests
    await testConnection();

    app.listen(config.port, () => {
      logger.info(`Grocery Backend running on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
