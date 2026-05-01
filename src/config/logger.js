'use strict';

/**
 * src/config/logger.js — Winston Logger Configuration
 *
 * Application-wide logger. Every file must use this instead of console.log.
 * Transports:
 *   - Console: colorized output (development only)
 *   - File: logs/app.log (all levels) + logs/error.log (errors only)
 */

const path = require('path');
const { createLogger, format, transports } = require('winston');
const config = require('./env');

const { combine, timestamp, printf, colorize, errors, json } = format;

// ─── Custom log format for console ───────────────────────────
const consoleFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const msg = stack || message;
  return `${ts} [${level}]: ${msg}${metaStr}`;
});

// ─── Log directory ───────────────────────────────────────────
const LOG_DIR = path.resolve(__dirname, '..', '..', 'logs');

// ─── Transports ──────────────────────────────────────────────
const logTransports = [
  // All logs → logs/app.log
  new transports.File({
    filename: path.join(LOG_DIR, 'app.log'),
    level: 'info',
    maxsize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
    format: combine(timestamp(), errors({ stack: true }), json()),
  }),

  // Error logs → logs/error.log
  new transports.File({
    filename: path.join(LOG_DIR, 'error.log'),
    level: 'error',
    maxsize: 5 * 1024 * 1024,
    maxFiles: 5,
    format: combine(timestamp(), errors({ stack: true }), json()),
  }),
];

// Console transport only in development
if (config.isDevelopment) {
  logTransports.push(
    new transports.Console({
      level: 'debug',
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      ),
    })
  );
}

// ─── Logger Instance ─────────────────────────────────────────
const logger = createLogger({
  level: config.isDevelopment ? 'debug' : 'info',
  defaultMeta: { service: 'grocery-backend' },
  transports: logTransports,
  exitOnError: false,
});

// ─── Stream for Morgan integration ───────────────────────────
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
