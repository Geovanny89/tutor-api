'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * AiUsage Model
 * Tracks daily AI interaction usage per user
 * Prevents burning through free API quota
 * Resets daily (checked by date comparison)
 */
const AiUsage = sequelize.define('AiUsage', {
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
  date: {
    type: DataTypes.DATEONLY,  // YYYY-MM-DD
    allowNull: false,
    comment: 'The date of usage (for daily reset)',
  },
  interactions_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of AI interactions today',
  },
  tokens_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Approximate tokens used today',
  },
  last_interaction_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'ai_usage',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'date'],
      name: 'unique_user_daily_usage',
    },
  ],
});

module.exports = AiUsage;
