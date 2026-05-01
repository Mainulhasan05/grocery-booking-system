'use strict';

/**
 * src/models/OrderItem.js
 *
 * Order line item — belongs to an Order and references a GroceryItem.
 * unit_price is a snapshot of the price at order time (immutable record).
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrderItem = sequelize.define(
    'OrderItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
      },
      grocery_item_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'grocery_items',
          key: 'id',
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: { msg: 'Quantity must be an integer' },
          min: { args: [1], msg: 'Quantity must be at least 1' },
        },
      },
      unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Unit price must be a valid decimal' },
          min: { args: [0], msg: 'Unit price cannot be negative' },
        },
      },
    },
    {
      tableName: 'order_items',
      underscored: true,
      timestamps: true,
    }
  );

  // ─── Associations (called from models/index.js) ────────────
  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order',
    });
    OrderItem.belongsTo(models.GroceryItem, {
      foreignKey: 'grocery_item_id',
      as: 'groceryItem',
    });
  };

  return OrderItem;
};
