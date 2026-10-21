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
const Message = require('./Message');
const Advertisement = require('./Advertisement');
const AdView = require('./AdView');
const Certificate = require('./Certificate');
const PasswordResetToken = require('./PasswordResetToken');
const EvaluationAttempt = require('./EvaluationAttempt');

/**
 * Model Associations - Defines all relationships between models
 * MVC Pattern: Models layer - centralized relationship definitions
 */

// ─── Tenant → Users ───────────────────────────────────────────────────────────
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// ─── Tenant → Owner (profesor/instituto) ──────────────────────────────────────
// constraints: false para evitar dependencia circular entre tenants y users
Tenant.belongsTo(User, { foreignKey: 'owner_id', as: 'owner', constraints: false });

// ─── Module → Lessons ─────────────────────────────────────────────────────────
Module.hasMany(Lesson, { foreignKey: 'module_id', as: 'lessons' });
Lesson.belongsTo(Module, { foreignKey: 'module_id', as: 'module' });

// ─── Tenant → Module / Lesson (contenido propio de una academia) ──────────────
Tenant.hasMany(Module, { foreignKey: 'tenant_id', as: 'modules', constraints: false });
Module.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'academy', constraints: false });

Tenant.hasMany(Lesson, { foreignKey: 'tenant_id', as: 'lessons', constraints: false });
Lesson.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'academy', constraints: false });

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

// ─── Messaging (estudiante ↔ profesor) ────────────────────────────────────────
User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiver_id', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });
Message.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'academy' });

// ─── Advertising & rewarded tokens ────────────────────────────────────────────
Advertisement.hasMany(AdView, { foreignKey: 'advertisement_id', as: 'views' });
AdView.belongsTo(Advertisement, { foreignKey: 'advertisement_id', as: 'advertisement' });
User.hasMany(AdView, { foreignKey: 'user_id', as: 'adViews' });
AdView.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── Certificates ─────────────────────────────────────────────────────────────
User.hasMany(Certificate, { foreignKey: 'user_id', as: 'certificates' });
Certificate.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Certificate.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'academy', constraints: false });
Certificate.belongsTo(Module, { foreignKey: 'module_id', as: 'module', constraints: false });

// ─── Password reset ───────────────────────────────────────────────────────────
User.hasMany(PasswordResetToken, { foreignKey: 'user_id', as: 'resetTokens' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── Timed evaluation attempts ────────────────────────────────────────────────
User.hasMany(EvaluationAttempt, { foreignKey: 'user_id', as: 'evaluationAttempts' });
EvaluationAttempt.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Evaluation.hasMany(EvaluationAttempt, { foreignKey: 'evaluation_id', as: 'attempts' });
EvaluationAttempt.belongsTo(Evaluation, { foreignKey: 'evaluation_id', as: 'evaluation' });

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
  Message,
  Advertisement,
  AdView,
  Certificate,
  PasswordResetToken,
  EvaluationAttempt,
};
