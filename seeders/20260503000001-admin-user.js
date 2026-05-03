'use strict';

/**
 * seeders/20260503000001-admin-user.js
 *
 * Seeds the default admin account.
 * Password is bcrypt-hashed with 12 rounds.
 *
 * Run:   npx sequelize-cli db:seed:all
 * Undo:  npx sequelize-cli db:seed:undo --seed 20260503000001-admin-user.js
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const hashedPassword = await bcrypt.hash('Admin@123', 12);

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        name: 'Admin',
        email: 'admin@grocery.com',
        password: hashedPassword,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@grocery.com' });
  },
};
