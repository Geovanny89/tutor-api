'use strict';

const sequelize = require('../config/database');
const Tenant = require('./Tenant');
const User = require('./User');
const Module = require('./Module');
const Lesson = require('./Lesson');
const Evaluation = require('./Evaluation');
const UserProgress = require('./UserProgress');
const AiUsage = require('./AiUsage');
const ConversationSession = require('./ConversationSession');

/**
 * Model Associations - Defines all relationships between models
 * MVC Pattern: Models layer - centralized relationship definitions
 */

// ─── Tenant → Users ───────────────────────────────────────────────────────────
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// ─── Module → Lessons ─────────────────────────────────────────────────────────
Module.hasMany(Lesson, { foreignKey: 'module_id', as: 'lessons' });
Lesson.belongsTo(Module, { foreignKey: 'module_id', as: 'module' });

// ─── Module → Evaluation (one per module) ─────────────────────────────────────
Module.hasOne(Evaluation, { foreignKey: 'module_id', as: 'evaluation' });
Evaluation.belongsTo(Module, { foreignKey: 'module_id', as: 'module' });

// ─── User → Progress ──────────────────────────────────────────────────────────
User.hasMany(UserProgress, { foreignKey: 'user_id', as: 'progress' });
UserProgress.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Lesson.hasMany(UserProgress, { foreignKey: 'lesson_id', as: 'progress' });
UserProgress.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

Module.hasMany(UserProgress, { foreignKey: 'module_id', as: 'progress' });
UserProgress.belongsTo(Module, { foreignKey: 'module_id', as: 'module' });

Evaluation.hasMany(UserProgress, { foreignKey: 'evaluation_id', as: 'progress' });
UserProgress.belongsTo(Evaluation, { foreignKey: 'evaluation_id', as: 'evaluation' });

// ─── User → AI Usage ──────────────────────────────────────────────────────────
User.hasMany(AiUsage, { foreignKey: 'user_id', as: 'aiUsage' });
AiUsage.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── User → Conversation Sessions ─────────────────────────────────────────────
User.hasMany(ConversationSession, { foreignKey: 'user_id', as: 'sessions' });
ConversationSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Lesson.hasMany(ConversationSession, { foreignKey: 'lesson_id', as: 'sessions' });
ConversationSession.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

module.exports = {
  sequelize,
  Tenant,
  User,
  Module,
  Lesson,
  Evaluation,
  UserProgress,
  AiUsage,
  ConversationSession,
};
