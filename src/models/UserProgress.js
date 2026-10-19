'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { PROGRESS_STATUS } = require('../config/constants');

/**
 * UserProgress Model
 * Tracks student progress per lesson and per module evaluation
 * This drives the "adventure map" UI showing locked/unlocked modules
 */
const UserProgress = sequelize.define('UserProgress', {
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
  // ── Can be a lesson OR an evaluation ─────────────────────────────────────
  lesson_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'lessons', key: 'id' },
  },
  evaluation_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'evaluations', key: 'id' },
  },
  module_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'modules', key: 'id' },
  },
  // ── Progress Data ─────────────────────────────────────────────────────────
  status: {
    type: DataTypes.ENUM(...Object.values(PROGRESS_STATUS)),
    defaultValue: PROGRESS_STATUS.NOT_STARTED,
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Score percentage (0-100) for evaluations',
  },
  xp_earned: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of attempts (for evaluations)',
  },
  time_spent_seconds: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // ── Detailed Results (for review) ─────────────────────────────────────────
  answers: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Student answers for review',
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI-generated or system feedback',
  },
}, {
  tableName: 'user_progress',
  indexes: [
    { fields: ['user_id', 'lesson_id'] },
    { fields: ['user_id', 'module_id'] },
    { fields: ['user_id', 'evaluation_id'] },
  ],
});

module.exports = UserProgress;
