'use strict';

/**
 * src/controllers/admin/grocery.controller.js
 *
 * Thin controller for admin grocery endpoints.
 * Extracts params, delegates to service, formats response.
 */

const groceryService = require('../../services/admin/grocery.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const { HTTP_STATUS } = require('../../utils/constants');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');

const create = asyncHandler(async (req, res) => {
  const { name, price, quantity, description } = req.body;

  const item = await groceryService.createItem({ name, price, quantity, description });

  success(res, 'Grocery item created successfully', { item }, HTTP_STATUS.CREATED);
});

const getAll = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { search } = req.query;

  const { rows, count } = await groceryService.getAllItems({ page, limit, offset, search });
  const meta = getPaginationMeta(count, page, limit);

  success(res, 'Grocery items retrieved successfully', { items: rows }, HTTP_STATUS.OK, meta);
});

const getOne = asyncHandler(async (req, res) => {
  const item = await groceryService.getItemById(req.params.id);

  success(res, 'Grocery item retrieved successfully', { item });
});

const update = asyncHandler(async (req, res) => {
  const { name, price, quantity, description } = req.body;

  const item = await groceryService.updateItem(req.params.id, { name, price, quantity, description });

  success(res, 'Grocery item updated successfully', { item });
});

const remove = asyncHandler(async (req, res) => {
  const item = await groceryService.deleteItem(req.params.id);

  success(res, 'Grocery item deleted successfully', { item });
});

const updateInventory = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  const item = await groceryService.updateInventory(req.params.id, quantity);

  success(res, 'Inventory updated successfully', { item });
});

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
  updateInventory,
};
