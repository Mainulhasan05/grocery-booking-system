'use strict';

/**
 * src/controllers/user/order.controller.js
 *
 * Thin controller for user order endpoints.
 */

const orderService = require('../../services/user/order.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const { HTTP_STATUS } = require('../../utils/constants');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');

const placeOrder = asyncHandler(async (req, res) => {
  const { items } = req.body;

  const order = await orderService.placeOrder(req.user.id, items);

  success(res, 'Order placed successfully', { order }, HTTP_STATUS.CREATED);
});

const getOrders = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);

  const { rows, count } = await orderService.getOrders(req.user.id, { page, limit, offset });
  const meta = getPaginationMeta(count, page, limit);

  success(res, 'Orders retrieved successfully', { orders: rows }, HTTP_STATUS.OK, meta);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.user.id, req.params.id);

  success(res, 'Order retrieved successfully', { order });
});

module.exports = {
  placeOrder,
  getOrders,
  getOrderById,
};
