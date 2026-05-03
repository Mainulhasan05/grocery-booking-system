'use strict';

/**
 * server.js — Application Entry Point
 *
 * Connects to the database and starts the HTTP server.
 * Implements graceful shutdown for SIGTERM/SIGINT to ensure
 * in-flight requests complete and the DB pool is drained cleanly.
 * All Express configuration lives in src/app.js.
 */

const app = require('./src/app');
const config = require('./src/config/env');
const logger = require('./src/config/logger');
const { testConnection } = require('./src/config/database');
const { sequelize } = require('./src/models');

let server;

const start = async () => {
  try {
    // Verify database connectivity before accepting requests
    await testConnection();

    server = app.listen(config.port, () => {
      logger.info(`Grocery Backend running on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

// ─── Graceful Shutdown ────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed — no longer accepting connections');

      try {
        await sequelize.close();
        logger.info('Database connection pool closed');
      } catch (err) {
        logger.error('Error closing database connection:', err);
      }

      process.exit(0);
    });

    // Force shutdown after 10s if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10000);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled rejections — log and exit to avoid zombie state
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});

start();

