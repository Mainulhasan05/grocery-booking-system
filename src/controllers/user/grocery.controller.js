'use strict';

/**
 * src/controllers/user/grocery.controller.js
 *
 * User-facing grocery browsing controller.
 */

const groceryService = require('../../services/user/grocery.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');

const getAll = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { search } = req.query;

  const { rows, count } = await groceryService.getAvailableItems({ page, limit, offset, search });
  const meta = getPaginationMeta(count, page, limit);

  success(res, 'Available grocery items retrieved successfully', { items: rows }, 200, meta);
});

module.exports = {
  getAll,
};
