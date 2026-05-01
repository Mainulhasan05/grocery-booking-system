'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      grocery_item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'grocery_items',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // Index on order_id for fetching order line items
    await queryInterface.addIndex('order_items', ['order_id'], {
      name: 'order_items_order_id',
    });

    // Index on grocery_item_id for reverse lookups
    await queryInterface.addIndex('order_items', ['grocery_item_id'], {
      name: 'order_items_grocery_item_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('order_items');
  },
};
