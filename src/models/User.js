'use strict';

/**
 * src/models/User.js
 *
 * User model — supports admin and regular user roles.
 * Password is bcrypt-hashed via beforeCreate/beforeUpdate hooks.
 * toJSON() strips the password field from all serialized output.
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/constants');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name cannot be empty' },
          len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters' },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: 'Email already exists' },
        validate: {
          isEmail: { msg: 'Must be a valid email address' },
          notEmpty: { msg: 'Email cannot be empty' },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Password cannot be empty' },
          len: { args: [6, 255], msg: 'Password must be at least 6 characters' },
        },
      },
      role: {
        type: DataTypes.ENUM(ROLES.ADMIN, ROLES.USER),
        allowNull: false,
        defaultValue: ROLES.USER,
        validate: {
          isIn: {
            args: [[ROLES.ADMIN, ROLES.USER]],
            msg: 'Role must be admin or user',
          },
        },
      },
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true,
    }
  );

  // ─── Hooks ──────────────────────────────────────────────────
  User.beforeCreate(async (user) => {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 12);
    }
  });

  User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, 12);
    }
  });

  // ─── Instance Methods ──────────────────────────────────────
  User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  // ─── Associations (called from models/index.js) ────────────
  User.associate = (models) => {
    User.hasMany(models.Order, {
      foreignKey: 'user_id',
      as: 'orders',
    });
  };

  return User;
};
