'use strict';

/**
 * src/validators/order.validator.js
 *
 * Validates the order placement request body.
 */

const { body } = require('express-validator');

const placeOrderValidator = [
  body('items')
    .isArray({ min: 1 }).withMessage('Items must be a non-empty array'),

  body('items.*.grocery_item_id')
    .notEmpty().withMessage('Grocery item ID is required')
    .isUUID(4).withMessage('Grocery item ID must be a valid UUID'),

  body('items.*.quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be an integer of at least 1'),
];

module.exports = {
  placeOrderValidator,
};
