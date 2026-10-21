'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * AdView Model
 * Records each rewarded ad a user watched.
 * Used to enforce the daily economy:
 *   - 1 promotional video per day (+5 tokens)
 *   - up to 4 extra videos per day (+3 tokens each)
 */
const AdView = sequelize.define('AdView', {
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
  advertisement_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'advertisements', key: 'id' },
  },
  kind: {
    type: DataTypes.ENUM('promo', 'extra'),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Fecha (YYYY-MM-DD) para el control diario',
  },
  reward_tokens: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'ad_views',
  indexes: [
    { fields: ['user_id', 'date'], name: 'idx_adviews_user_date' },
  ],
});

module.exports = AdView;
