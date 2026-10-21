'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { TOKENS } = require('../config/constants');

/**
 * Advertisement Model
 * Rewarded ads shown to students to earn extra AI tokens.
 * - kind "promo": the first promotional video of the day → +5 tokens
 * - kind "extra": additional videos after the promo → +3 tokens each (max 4/day)
 */
const Advertisement = sequelize.define('Advertisement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  video_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'URL del video promocional (mp4 o embed)',
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cta_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Enlace del anunciante (opcional)',
  },
  duration_seconds: {
    type: DataTypes.INTEGER,
    defaultValue: TOKENS.AD_DURATION_SECONDS,
  },
  reward_tokens: {
    type: DataTypes.INTEGER,
    defaultValue: TOKENS.EXTRA_REWARD,
    comment: 'Tokens otorgados al completar el anuncio',
  },
  kind: {
    type: DataTypes.ENUM('promo', 'extra'),
    defaultValue: 'extra',
    comment: 'promo = video principal (+5), extra = videos de relleno (+3)',
  },
  order_index: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  impressions_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'advertisements',
});

module.exports = Advertisement;
