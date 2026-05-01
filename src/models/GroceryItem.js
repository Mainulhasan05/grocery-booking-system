'use strict';

/**
 * src/models/GroceryItem.js
 *
 * Grocery item model with soft-delete via is_active flag.
 * Default scope filters to active items only.
 * Price and quantity have minimum-value validations.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GroceryItem = sequelize.define(
    'GroceryItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: 'A grocery item with this name already exists' },
        validate: {
          notEmpty: { msg: 'Item name cannot be empty' },
          len: { args: [2, 200], msg: 'Item name must be between 2 and 200 characters' },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Price must be a valid decimal number' },
          min: { args: [0], msg: 'Price cannot be negative' },
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          isInt: { msg: 'Quantity must be an integer' },
          min: { args: [0], msg: 'Quantity cannot be negative' },
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'grocery_items',
      underscored: true,
      timestamps: true,
      // Default scope: only active items
      defaultScope: {
        where: { is_active: true },
      },
      scopes: {
        // Explicit scope to include soft-deleted items
        withInactive: {
          where: {},
        },
      },
    }
  );

  // ─── Associations (called from models/index.js) ────────────
  GroceryItem.associate = (models) => {
    GroceryItem.hasMany(models.OrderItem, {
      foreignKey: 'grocery_item_id',
      as: 'orderItems',
    });
  };

  return GroceryItem;
};
