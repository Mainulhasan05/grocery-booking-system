'use strict';

/**
 * src/services/user/grocery.service.js
 *
 * User-facing grocery browsing — only active, in-stock items.
 */

const { Op } = require('sequelize');
const { GroceryItem } = require('../../models');

/**
 * Get available grocery items (active + in stock).
 */
const getAvailableItems = async ({ page, limit, offset, search }) => {
  const where = {
    is_active: true,
    quantity: { [Op.gt]: 0 },
  };

  if (search && typeof search === 'string') {
    const sanitizedSearch = search.trim().substring(0, 200);
    if (sanitizedSearch.length > 0) {
      where.name = { [Op.iLike]: `%${sanitizedSearch}%` };
    }
  }

  const { rows, count } = await GroceryItem.findAndCountAll({
    where,
    attributes: { exclude: ['is_active'] },
    limit,
    offset,
    order: [['name', 'ASC']],
  });

  return { rows, count };
};

module.exports = {
  getAvailableItems,
};
