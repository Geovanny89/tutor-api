'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * PasswordResetToken Model
 * Token de un solo uso para recuperación de contraseña por email.
 * Se guarda el hash del token, nunca el valor plano.
 */
const PasswordResetToken = sequelize.define('PasswordResetToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  token_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  used_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'password_reset_tokens',
});

module.exports = PasswordResetToken;
