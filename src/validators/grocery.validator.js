'use strict';

/**
 * src/validators/grocery.validator.js
 *
 * Express-validator chains for grocery item endpoints.
 */

const { body } = require('express-validator');

const createGroceryValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Name must be between 2 and 200 characters'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),

  body('quantity')
    .optional()
    .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),

  body('description')
    .optional()
    .trim(),
];

const updateGroceryValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 200 }).withMessage('Name must be between 2 and 200 characters'),

  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),

  body('quantity')
    .optional()
    .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),

  body('description')
    .optional()
    .trim(),

  // Custom: at least one field must be provided
  body().custom((value, { req }) => {
    const fields = ['name', 'price', 'quantity', 'description'];
    const hasAtLeastOne = fields.some((f) => req.body[f] !== undefined);
    if (!hasAtLeastOne) {
      throw new Error('At least one field (name, price, quantity, or description) must be provided');
    }
    return true;
  }),
];

const updateInventoryValidator = [
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
];

module.exports = {
  createGroceryValidator,
  updateGroceryValidator,
  updateInventoryValidator,
};
