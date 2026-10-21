'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { LEVELS, LEVEL_NAMES, AGE_RANGES, SUBJECTS } = require('../config/constants');

/**
 * Module Model
 * Represents a CEFR level module (A1, A2, B1, B2, C1, C2)
 * Each module contains multiple lessons and one final evaluation
 */
const Module = sequelize.define('Module', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  level: {
    type: DataTypes.ENUM(...Object.values(LEVELS)),
    allowNull: false,
  },
  // ── Pedagogical segmentation ──────────────────────────────────────────────
  age_range: {
    type: DataTypes.ENUM(...Object.values(AGE_RANGES)),
    defaultValue: AGE_RANGES.ADULTS,
    comment: 'Target age segment for this module',
  },
  subject: {
    type: DataTypes.ENUM(...Object.values(SUBJECTS)),
    defaultValue: SUBJECTS.ENGLISH,
    comment: 'Materia: inglés, matemáticas o programación',
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'null = módulo global (plantilla); con valor = módulo propio de una academia',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  icon: {
    type: DataTypes.STRING(10),
    defaultValue: '📚',
    comment: 'Emoji icon for the module',
  },
  color_from: {
    type: DataTypes.STRING(7),
    defaultValue: '#6C63FF',
    comment: 'Gradient start color',
  },
  color_to: {
    type: DataTypes.STRING(7),
    defaultValue: '#3ECFCF',
    comment: 'Gradient end color',
  },
  order_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Display order (0=A1, 1=A2...)',
  },
  total_lessons: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Auto-calculated total lessons',
  },
  xp_reward: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    comment: 'XP earned on module completion',
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'modules',
});

module.exports = Module;
