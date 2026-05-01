'use strict';

/**
 * src/config/env.js — Environment Configuration
 *
 * Single source of truth for all environment variables.
 * Validates required vars at startup and exports a frozen config object.
 * No other file should ever read process.env directly.
 */

require('dotenv').config();

const requiredVars = [
  'NODE_ENV',
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
];

const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `[env] Missing required environment variables:\n  ${missing.join('\n  ')}\n` +
    'Copy .env.example to .env and fill in all values.'
  );
}

const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10),
  db: Object.freeze({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }),
  jwt: Object.freeze({
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  }),
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
});

module.exports = config;
