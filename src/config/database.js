'use strict';

/**
 * src/config/database.js — Sequelize Instance
 *
 * Creates and exports the Sequelize connection instance.
 * Also exports a testConnection() helper for startup health checks.
 *
 * This file doubles as the Sequelize CLI config (referenced by .sequelizerc).
 */

const { Sequelize } = require('sequelize');
const config = require('./env');
const logger = require('./logger');

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: config.isDevelopment ? (msg) => logger.debug(msg) : false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,       // snake_case column names
      timestamps: true,        // created_at, updated_at
      freezeTableName: true,   // don't pluralize table names
    },
  }
);

/**
 * Test the database connection at startup.
 * Logs success or throws on failure.
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
  } catch (err) {
    logger.error('Unable to connect to database:', err);
    throw err;
  }
};

// ─── Sequelize CLI config export ─────────────────────────────
// .sequelizerc points here; CLI expects environment-keyed config
module.exports = sequelize;
module.exports.sequelize = sequelize;
module.exports.testConnection = testConnection;
module.exports.development = {
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
};
module.exports.production = {
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  logging: false,
};
