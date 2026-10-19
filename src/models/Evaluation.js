'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { EVALUATION } = require('../config/constants');

/**
 * Evaluation Model
 * Module-end test - student must pass (≥70%) to unlock next module
 * Questions are stored as JSONB - no AI tokens needed
 */
const Evaluation = sequelize.define('Evaluation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  module_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'modules', key: 'id' },
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // ── Questions stored as JSONB ─────────────────────────────────────────────
  questions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: `Array of questions:
    [
      {
        "id": "q1",
        "type": "multiple_choice",
        "question": "What is the correct form?",
        "options": ["I am", "I is", "I be", "I were"],
        "correct": 0,
        "explanation": "We use 'am' with I",
        "points": 10
      },
      {
        "id": "q2",
        "type": "fill_blank",
        "question": "She ___ a teacher",
        "correct": "is",
        "points": 10
      },
      {
        "id": "q3",
        "type": "speaking",
        "question": "Say this sentence: 'Hello, my name is...'",
        "expected_words": ["hello", "name"],
        "points": 20
      }
    ]`,
  },
  total_points: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
  },
  min_pass_score: {
    type: DataTypes.INTEGER,
    defaultValue: EVALUATION.MIN_PASS_SCORE,
    comment: 'Minimum percentage to pass (default 70%)',
  },
  time_limit_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 20,
  },
  max_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: EVALUATION.MAX_ATTEMPTS,
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'evaluations',
});

module.exports = Evaluation;
