'use strict';

/**
 * src/app.js — Express Application Setup
 *
 * Configures Express middleware stack and mounts route handlers.
 * Does NOT call app.listen() — that responsibility belongs to server.js.
 */

const express = require('express');

const app = express();

// ─── Health Check (no auth required) ──────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Grocery Backend is healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = app;
