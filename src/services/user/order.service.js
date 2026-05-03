'use strict';

/**
 * src/services/user/order.service.js
 *
 * Order placement and retrieval logic.
 * placeOrder is the most critical service — runs entirely inside a
 * Sequelize transaction to guarantee inventory consistency.
 */

const { Op } = require('sequelize');
const { sequelize, Order, OrderItem, GroceryItem } = require('../../models');
const AppError = require('../../utils/AppError');
const { HTTP_STATUS, ORDER_STATUS } = require('../../utils/constants');
const logger = require('../../config/logger');

/**
 * Place an order — transactional.
 *
 * Steps:
 * 1. Fetch all requested items (single query)
 * 2. Validate existence, active status, stock levels
 * 3. Calculate total
 * 4. Create Order + OrderItems
 * 5. Decrement inventory
 * 6. Commit
 *
 * @param {string} userId
 * @param {Array<{ grocery_item_id: string, quantity: number }>} items
 */
const placeOrder = async (userId, items) => {
  const transaction = await sequelize.transaction();

  try {
    // ─── 0. Merge duplicate item IDs (sum quantities) ───────
    const mergedMap = new Map();
    items.forEach((i) => {
      if (mergedMap.has(i.grocery_item_id)) {
        mergedMap.get(i.grocery_item_id).quantity += i.quantity;
      } else {
        mergedMap.set(i.grocery_item_id, { ...i });
      }
    });
    const mergedItems = Array.from(mergedMap.values());

    // ─── 1. Fetch all requested items in one query ──────────
    const itemIds = mergedItems.map((i) => i.grocery_item_id);

    const groceryItems = await GroceryItem.scope('withInactive').findAll({
      where: { id: { [Op.in]: itemIds } },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    // Build a lookup map for O(1) access
    const itemMap = new Map();
    groceryItems.forEach((gi) => itemMap.set(gi.id, gi));

    // ─── 2a. Validate existence ─────────────────────────────
    const missingIds = itemIds.filter((id) => !itemMap.has(id));
    if (missingIds.length > 0) {
      throw new AppError(
        'One or more grocery items not found',
        HTTP_STATUS.NOT_FOUND,
        missingIds.map((id) => ({ grocery_item_id: id, message: 'Item not found' }))
      );
    }

    // ─── 2b. Validate active status ─────────────────────────
    const inactiveItems = mergedItems.filter((i) => !itemMap.get(i.grocery_item_id).is_active);
    if (inactiveItems.length > 0) {
      throw new AppError(
        'One or more items are no longer available',
        HTTP_STATUS.BAD_REQUEST,
        inactiveItems.map((i) => ({
          grocery_item_id: i.grocery_item_id,
          message: 'Item is no longer available',
        }))
      );
    }

    // ─── 2c. Validate sufficient stock ──────────────────────
    const insufficientItems = mergedItems.filter((i) => {
      const gi = itemMap.get(i.grocery_item_id);
      return gi.quantity < i.quantity;
    });
    if (insufficientItems.length > 0) {
      throw new AppError(
        'Insufficient stock for one or more items',
        HTTP_STATUS.BAD_REQUEST,
        insufficientItems.map((i) => {
          const gi = itemMap.get(i.grocery_item_id);
          return {
            grocery_item_id: i.grocery_item_id,
            name: gi.name,
            requested: i.quantity,
            available: gi.quantity,
            message: `Only ${gi.quantity} units available`,
          };
        })
      );
    }

    // ─── 3. Calculate total amount ──────────────────────────
    let totalAmount = 0;
    const orderItemsData = mergedItems.map((i) => {
      const gi = itemMap.get(i.grocery_item_id);
      const unitPrice = parseFloat(gi.price);
      const lineTotal = unitPrice * i.quantity;
      totalAmount += lineTotal;

      return {
        grocery_item_id: i.grocery_item_id,
        quantity: i.quantity,
        unit_price: unitPrice,
      };
    });

    totalAmount = parseFloat(totalAmount.toFixed(2));

    // ─── 4. Create Order ────────────────────────────────────
    const order = await Order.create(
      {
        user_id: userId,
        total_amount: totalAmount,
        status: ORDER_STATUS.CONFIRMED,
      },
      { transaction }
    );

    // ─── 5. Create OrderItems (bulkCreate) ──────────────────
    const orderItems = await OrderItem.bulkCreate(
      orderItemsData.map((oi) => ({
        ...oi,
        order_id: order.id,
      })),
      { transaction }
    );

    // ─── 6. Decrement inventory ─────────────────────────────
    const decrementPromises = mergedItems.map((i) => {
      const gi = itemMap.get(i.grocery_item_id);
      return gi.decrement('quantity', {
        by: i.quantity,
        transaction,
      });
    });
    await Promise.all(decrementPromises);

    // ─── 7. Commit ──────────────────────────────────────────
    await transaction.commit();

    logger.info(`Order placed: ${order.id} by user ${userId} — total: ${totalAmount}`);

    // Return order with items
    const result = order.toJSON();
    result.items = orderItems.map((oi) => {
      const json = oi.toJSON();
      json.name = itemMap.get(oi.grocery_item_id).name;
      return json;
    });

    return result;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Get a user's order history with items and grocery item names.
 */
const getOrders = async (userId, { page, limit, offset }) => {
  const { rows, count } = await Order.findAndCountAll({
    where: { user_id: userId },
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: GroceryItem.scope('withInactive'),
            as: 'groceryItem',
            attributes: ['id', 'name'],
          },
        ],
      },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
    distinct: true,
  });

  return { rows, count };
};

/**
 * Get a single order by ID — must belong to the requesting user.
 * Returns 404 (not 403) to avoid leaking existence of other users' orders.
 */
const getOrderById = async (userId, orderId) => {
  const order = await Order.findOne({
    where: { id: orderId, user_id: userId },
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: GroceryItem.scope('withInactive'),
            as: 'groceryItem',
            attributes: ['id', 'name'],
          },
        ],
      },
    ],
  });

  if (!order) {
    throw new AppError('Order not found', HTTP_STATUS.NOT_FOUND);
  }

  return order;
};

module.exports = {
  placeOrder,
  getOrders,
  getOrderById,
};
