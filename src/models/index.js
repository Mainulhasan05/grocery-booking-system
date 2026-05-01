'use strict';

/**
 * src/models/index.js — Model Loader & Association Setup
 *
 * Imports all models, initializes them with the Sequelize instance,
 * and wires up all associations. Every other file imports models from here.
 */

const sequelize = require('../config/database');
const logger = require('../config/logger');

// ─── Import model definitions ────────────────────────────────
const UserFactory = require('./User');
const GroceryItemFactory = require('./GroceryItem');
const OrderFactory = require('./Order');
const OrderItemFactory = require('./OrderItem');

// ─── Initialize models ──────────────────────────────────────
const User = UserFactory(sequelize);
const GroceryItem = GroceryItemFactory(sequelize);
const Order = OrderFactory(sequelize);
const OrderItem = OrderItemFactory(sequelize);

// ─── Collect all models ──────────────────────────────────────
const models = { User, GroceryItem, Order, OrderItem };

// ─── Set up associations ─────────────────────────────────────
Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

logger.debug('All models loaded and associations established');

module.exports = {
  sequelize,
  ...models,
};
