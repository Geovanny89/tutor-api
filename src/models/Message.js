'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Message Model
 * Direct messaging between a student and their professor (or academy admin)
 */
const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  receiver_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Academia a la que pertenece la conversación',
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'null = mensaje sin leer',
  },
}, {
  tableName: 'messages',
  indexes: [
    { fields: ['sender_id', 'receiver_id'], name: 'idx_messages_participants' },
    { fields: ['tenant_id'], name: 'idx_messages_tenant' },
  ],
});

module.exports = Message;
