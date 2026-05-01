'use strict';

/**
 * src/models/Order.js
 *
 * Order model — belongs to a User, has many OrderItems.
 * Status tracks the order lifecycle: pending → confirmed → cancelled.
 */

const { DataTypes } = require('sequelize');
const { ORDER_STATUS } = require('../utils/constants');

module.exports = (sequelize) => {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Total amount must be a valid decimal' },
          min: { args: [0], msg: 'Total amount cannot be negative' },
        },
      },
      status: {
        type: DataTypes.ENUM(
          ORDER_STATUS.PENDING,
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.CANCELLED
        ),
        allowNull: false,
        defaultValue: ORDER_STATUS.PENDING,
      },
    },
    {
      tableName: 'orders',
      underscored: true,
      timestamps: true,
    }
  );

  // ─── Associations (called from models/index.js) ────────────
  Order.associate = (models) => {
    Order.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    Order.hasMany(models.OrderItem, {
      foreignKey: 'order_id',
      as: 'items',
    });
  };

  return Order;
};
