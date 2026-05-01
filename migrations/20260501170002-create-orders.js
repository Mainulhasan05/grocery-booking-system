'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create order status ENUM type
    await queryInterface.sequelize.query(
      `CREATE TYPE "enum_orders_status" AS ENUM ('pending', 'confirmed', 'cancelled');`
    ).catch(() => {
      // Type may already exist
    });

    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
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

    // Index on user_id for user order lookups
    await queryInterface.addIndex('orders', ['user_id'], {
      name: 'orders_user_id',
    });

    // Index on status for filtering
    await queryInterface.addIndex('orders', ['status'], {
      name: 'orders_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('orders');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status";');
  },
};
