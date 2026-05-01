'use strict';

/**
 * server.js — Application Entry Point
 *
 * This file is responsible ONLY for starting the HTTP server.
 * All Express configuration lives in src/app.js.
 */

require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  // Using console here intentionally — logger may not be configured yet at boot
  // Once logger.js is implemented, this will switch to logger.info
  console.log(`[server] Grocery Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
