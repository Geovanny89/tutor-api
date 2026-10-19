'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * ConversationSession Model
 * Stores AI voice conversation history for student review
 * Students can revisit their conversations to learn from them
 */
const ConversationSession = sequelize.define('ConversationSession', {
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
  lesson_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'lessons', key: 'id' },
    comment: 'Optional: linked to a lesson context',
  },
  session_type: {
    type: DataTypes.ENUM('lesson_practice', 'free_conversation', 'evaluation'),
    defaultValue: 'lesson_practice',
  },
  // ── Conversation Messages ─────────────────────────────────────────────────
  messages: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: `Array of messages: 
    [
      { "role": "ai", "text": "Hello! How are you?", "timestamp": "...", "audio_url": null },
      { "role": "user", "text": "I am fine!", "timestamp": "...", "score": 85 }
    ]`,
  },
  // ── Session Stats ─────────────────────────────────────────────────────────
  duration_seconds: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  messages_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  ai_tokens_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  pronunciation_score: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Average pronunciation score (0-100) from Web Speech API',
  },
  xp_earned: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  ended_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'conversation_sessions',
  indexes: [
    { fields: ['user_id', 'created_at'] },
  ],
});

module.exports = ConversationSession;
