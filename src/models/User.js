'use strict';

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { ROLES, LEVELS } = require('../config/constants');

/**
 * User Model
 * Supports: super_admin (you), tenant_admin, student
 * Password is hashed automatically before save
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: true,  // null = super_admin (global)
    references: { model: 'tenants', key: 'id' },
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { len: [2, 100] },
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM(...Object.values(ROLES)),
    defaultValue: ROLES.STUDENT,
  },
  current_level: {
    type: DataTypes.ENUM(...Object.values(LEVELS)),
    defaultValue: LEVELS.A1,
    comment: 'Current CEFR level of the student',
  },
  avatar_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  native_language: {
    type: DataTypes.STRING(10),
    defaultValue: 'es',
    comment: 'ISO language code of student native language',
  },
  streak_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Consecutive days of practice',
  },
  last_activity_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  total_xp: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Experience points for gamification',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'users',
  hooks: {
    // Hash password before saving
    beforeCreate: async (user) => {
      if (user.password) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        user.password = await bcrypt.hash(user.password, rounds);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        user.password = await bcrypt.hash(user.password, rounds);
      }
    },
  },
});

/**
 * Instance method: Verify password
 * @param {string} plainPassword - Password to verify
 * @returns {boolean}
 */
User.prototype.verifyPassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

/**
 * Instance method: Get safe user object (no password)
 */
User.prototype.toSafeObject = function () {
  const { password, ...safeUser } = this.toJSON();
  return safeUser;
};

module.exports = User;
