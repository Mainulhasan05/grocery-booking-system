'use strict';

/**
 * src/services/admin/grocery.service.js
 *
 * Business logic for admin grocery item management.
 * All queries use the withInactive scope so admins see soft-deleted items.
 */

const { Op } = require('sequelize');
const { GroceryItem } = require('../../models');
const AppError = require('../../utils/AppError');
const { HTTP_STATUS } = require('../../utils/constants');
const logger = require('../../config/logger');

/**
 * Create a new grocery item.
 */
const createItem = async (data) => {
  // Check name uniqueness (including inactive items)
  const existing = await GroceryItem.scope('withInactive').findOne({
    where: { name: data.name },
  });

  if (existing) {
    throw new AppError('A grocery item with this name already exists', HTTP_STATUS.CONFLICT);
  }

  const item = await GroceryItem.create(data);
  logger.info(`Grocery item created: ${item.id} — ${item.name}`);

  return item;
};

/**
 * Get all grocery items with pagination and optional search.
 * Admins see inactive items too.
 */
const getAllItems = async ({ page, limit, offset, search }) => {
  const where = {};

  if (search && typeof search === 'string') {
    const sanitizedSearch = search.trim().substring(0, 200);
    if (sanitizedSearch.length > 0) {
      where.name = { [Op.iLike]: `%${sanitizedSearch}%` };
    }
  }

  const { rows, count } = await GroceryItem.scope('withInactive').findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });

  return { rows, count };
};

/**
 * Get a single grocery item by ID (including inactive).
 */
const getItemById = async (id) => {
  const item = await GroceryItem.scope('withInactive').findByPk(id);

  if (!item) {
    throw new AppError('Grocery item not found', HTTP_STATUS.NOT_FOUND);
  }

  return item;
};

/**
 * Update a grocery item. Only provided fields are updated.
 */
const updateItem = async (id, data) => {
  const item = await GroceryItem.scope('withInactive').findByPk(id);

  if (!item) {
    throw new AppError('Grocery item not found', HTTP_STATUS.NOT_FOUND);
  }

  // If name is changing, check uniqueness
  if (data.name && data.name !== item.name) {
    const duplicate = await GroceryItem.scope('withInactive').findOne({
      where: { name: data.name, id: { [Op.ne]: id } },
    });

    if (duplicate) {
      throw new AppError('A grocery item with this name already exists', HTTP_STATUS.CONFLICT);
    }
  }

  // Update only provided fields
  const allowedFields = ['name', 'price', 'quantity', 'description'];
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      item[field] = data[field];
    }
  });

  await item.save();
  logger.info(`Grocery item updated: ${item.id}`);

  return item;
};

/**
 * Soft delete a grocery item (set is_active = false).
 */
const deleteItem = async (id) => {
  const item = await GroceryItem.scope('withInactive').findByPk(id);

  if (!item) {
    throw new AppError('Grocery item not found', HTTP_STATUS.NOT_FOUND);
  }

  if (!item.is_active) {
    throw new AppError('Grocery item is already inactive', HTTP_STATUS.BAD_REQUEST);
  }

  item.is_active = false;
  await item.save();
  logger.info(`Grocery item soft-deleted: ${item.id}`);

  return item;
};

/**
 * Update inventory level for a grocery item.
 * Runs inside a transaction with row-level locking to prevent
 * race conditions with concurrent order placements.
 */
const updateInventory = async (id, quantity) => {
  const { sequelize } = require('../../models');
  const transaction = await sequelize.transaction();

  try {
    const item = await GroceryItem.scope('withInactive').findByPk(id, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!item) {
      throw new AppError('Grocery item not found', HTTP_STATUS.NOT_FOUND);
    }

    item.quantity = quantity;
    await item.save({ transaction });

    await transaction.commit();
    logger.info(`Inventory updated for ${item.id}: quantity = ${quantity}`);

    return item;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

module.exports = {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
  updateInventory,
};
