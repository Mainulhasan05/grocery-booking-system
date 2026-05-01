'use strict';

/**
 * src/utils/asyncHandler.js — Async Controller Wrapper
 *
 * Wraps an async Express route handler so that any rejected promise
 * is automatically caught and forwarded to the global error handler
 * via next(). Eliminates repetitive try/catch in every controller.
 *
 * Usage:
 *   router.get('/items', asyncHandler(async (req, res) => { ... }));
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
