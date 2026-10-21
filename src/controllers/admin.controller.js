'use strict';

const { Op } = require('sequelize');
const {
  User,
  Module,
  Lesson,
  Evaluation,
  UserProgress,
  AiUsage,
  ConversationSession,
} = require('../models');
const ApiResponse = require('../utils/apiResponse');
const CacheService = require('../utils/cache');
const { HTTP_STATUS, ROLES, LEVEL_ORDER } = require('../config/constants');
const jwt = require('jsonwebtoken');

/**
 * Admin Controller - MVC Controller layer
 * Full platform control for super_admin / tenant_admin:
 * metrics, students management, content overview
 */

// ─── Helper: Generate JWT Token ───────────────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ─── Helper: tenant scoping ───────────────────────────────────────────────────
// super_admin sees the whole platform; tenant_admin only their own tenant
const tenantFilter = (req) => {
  if (req.user.role === ROLES.SUPER_ADMIN) return {};
  return { tenant_id: req.user.tenant_id || null };
};

const AdminController = {
  /**
   * GET /api/admin/stats
   * Global platform metrics for the admin overview
   */
  async getStats(req, res) {
    try {
      const scope = tenantFilter(req);
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        activeUsers,
        students,
        admins,
        newUsersThisWeek,
        totalModules,
        publishedModules,
        totalLessons,
        totalEvaluations,
        aiUsageToday,
        totalSessions,
        completions,
      ] = await Promise.all([
        User.count({ where: scope }),
        User.count({ where: { ...scope, is_active: true } }),
        User.count({ where: { ...scope, role: ROLES.STUDENT } }),
        User.count({ where: { ...scope, role: { [Op.in]: [ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN] } } }),
        User.count({ where: { ...scope, created_at: { [Op.gte]: weekAgo } } }),
        Module.count(),
        Module.count({ where: { is_published: true } }),
        Lesson.count(),
        Evaluation.count(),
        AiUsage.sum('interactions_count', { where: { date: today } }),
        ConversationSession.count(),
        UserProgress.count({ where: { status: 'completed' } }),
      ]);

      // Students per CEFR level (progress distribution)
      const levelRows = await User.findAll({
        where: { ...scope, role: ROLES.STUDENT },
        attributes: ['current_level'],
        raw: true,
      });

      const levelDistribution = LEVEL_ORDER.map((level) => ({
        level,
        count: levelRows.filter((u) => u.current_level === level).length,
      }));

      // Top students by XP
      const topStudents = await User.findAll({
        where: { ...scope, role: ROLES.STUDENT, is_active: true },
        attributes: ['id', 'name', 'email', 'current_level', 'total_xp', 'streak_days'],
        order: [['total_xp', 'DESC']],
        limit: 5,
      });

      // Most recent registrations
      const recentUsers = await User.findAll({
        where: scope,
        attributes: ['id', 'name', 'email', 'role', 'current_level', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: 5,
      });

      return ApiResponse.success(res, {
        users: {
          total: totalUsers,
          active: activeUsers,
          students,
          admins,
          new_this_week: newUsersThisWeek,
        },
        content: {
          modules: totalModules,
          published_modules: publishedModules,
          lessons: totalLessons,
          evaluations: totalEvaluations,
        },
        ai: {
          interactions_today: aiUsageToday || 0,
          daily_limit_per_student: parseInt(process.env.AI_DAILY_LIMIT) || 20,
          total_sessions: totalSessions,
          provider: 'Groq (Llama 3) + Gemini Flash',
        },
        learning: {
          completed_items: completions,
          level_distribution: levelDistribution,
        },
        top_students: topStudents,
        recent_users: recentUsers,
      }, 'Platform stats retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve stats.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * GET /api/admin/users
   * List registered users with their activity and AI consumption
   * Query: ?search=&role=&level=&status=active|inactive&page=1&limit=20
   */
  async getUsers(req, res) {
    try {
      const { search = '', role, level, status } = req.query;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const offset = (page - 1) * limit;

      const where = { ...tenantFilter(req) };

      if (search.trim()) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search.trim()}%` } },
          { email: { [Op.like]: `%${search.trim()}%` } },
        ];
      }
      if (role && Object.values(ROLES).includes(role)) where.role = role;
      if (level) where.current_level = level;
      if (status === 'active') where.is_active = true;
      if (status === 'inactive') where.is_active = false;

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      // Today's AI usage per user (single query, then mapped)
      const today = new Date().toISOString().split('T')[0];
      const userIds = rows.map((u) => u.id);
      const usageRows = userIds.length
        ? await AiUsage.findAll({
            where: { user_id: { [Op.in]: userIds }, date: today },
            attributes: ['user_id', 'interactions_count', 'tokens_used'],
            raw: true,
          })
        : [];
      const usageMap = usageRows.reduce((acc, row) => {
        acc[row.user_id] = row;
        return acc;
      }, {});

      // Completed items per user in a single grouped query
      const progressRows = userIds.length
        ? await UserProgress.findAll({
            where: { user_id: { [Op.in]: userIds }, status: 'completed' },
            attributes: ['user_id', 'status'],
            raw: true,
          })
        : [];
      const completedMap = progressRows.reduce((acc, row) => {
        acc[row.user_id] = (acc[row.user_id] || 0) + 1;
        return acc;
      }, {});

      const users = rows.map((u) => {
        const json = u.toJSON();
        return {
          ...json,
          completed_items: completedMap[u.id] || 0,
          ai_today: usageMap[u.id]?.interactions_count || 0,
          ai_tokens_today: usageMap[u.id]?.tokens_used || 0,
        };
      });

      return ApiResponse.paginated(res, users, count, page, limit, 'Users retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve users.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * GET /api/admin/users/:id
   * Full detail of one student: progress + conversation sessions
   */
  async getUserDetail(req, res) {
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] },
      });

      if (!user) return ApiResponse.error(res, 'User not found.', HTTP_STATUS.NOT_FOUND);
      if (req.user.role !== ROLES.SUPER_ADMIN && user.tenant_id !== req.user.tenant_id) {
        return ApiResponse.error(res, 'User not found.', HTTP_STATUS.NOT_FOUND);
      }

      const [progress, sessions] = await Promise.all([
        UserProgress.findAll({
          where: { user_id: user.id },
          include: [
            { model: Lesson, as: 'lesson', attributes: ['id', 'title', 'icon'], required: false },
            { model: Module, as: 'module', attributes: ['id', 'name', 'level'], required: false },
          ],
          order: [['updated_at', 'DESC']],
          limit: 20,
        }),
        ConversationSession.findAll({
          where: { user_id: user.id },
          attributes: ['id', 'session_type', 'messages_count', 'ai_tokens_used', 'created_at'],
          order: [['created_at', 'DESC']],
          limit: 10,
        }),
      ]);

      return ApiResponse.success(res, {
        user: user.toSafeObject(),
        progress: progress.map((p) => ({
          id: p.id,
          type: p.lesson_id ? 'lesson' : 'evaluation',
          title: p.lesson?.title || 'Evaluación de módulo',
          module: p.module?.name || null,
          status: p.status,
          score: p.score,
          xp_earned: p.xp_earned,
          updated_at: p.updated_at,
        })),
        sessions,
      }, 'User detail retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve user detail.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * PUT /api/admin/users/:id
   * Update role, level, status or name of a user
   */
  async updateUser(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return ApiResponse.error(res, 'User not found.', HTTP_STATUS.NOT_FOUND);

      if (req.user.role !== ROLES.SUPER_ADMIN && user.tenant_id !== req.user.tenant_id) {
        return ApiResponse.error(res, 'User not found.', HTTP_STATUS.NOT_FOUND);
      }

      const { name, role, current_level, is_active, native_language, total_xp } = req.body;

      if (role && !Object.values(ROLES).includes(role)) {
        return ApiResponse.error(res, 'Invalid role.', HTTP_STATUS.BAD_REQUEST);
      }
      if (current_level && !LEVEL_ORDER.includes(current_level)) {
        return ApiResponse.error(res, 'Invalid CEFR level.', HTTP_STATUS.BAD_REQUEST);
      }
      // Prevent locking yourself out or demoting the main admin account
      if (user.id === req.user.id && is_active === false) {
        return ApiResponse.error(res, 'You cannot deactivate your own account.', HTTP_STATUS.BAD_REQUEST);
      }

      await user.update({
        ...(name && { name }),
        ...(role && user.id !== req.user.id && { role }),
        ...(current_level && { current_level }),
        ...(is_active !== undefined && { is_active }),
        ...(native_language && { native_language }),
        ...(total_xp !== undefined && { total_xp: Number(total_xp) }),
      });

      CacheService.del(`modules:user:${user.id}`);

      return ApiResponse.success(res, user.toSafeObject(), 'User updated successfully.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to update user.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * DELETE /api/admin/users/:id
   * Soft-delete a user account (and their AI usage records)
   */
  async deleteUser(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return ApiResponse.error(res, 'User not found.', HTTP_STATUS.NOT_FOUND);

      if (user.id === req.user.id) {
        return ApiResponse.error(res, 'You cannot delete your own account.', HTTP_STATUS.BAD_REQUEST);
      }
      if (req.user.role !== ROLES.SUPER_ADMIN && user.tenant_id !== req.user.tenant_id) {
        return ApiResponse.error(res, 'User not found.', HTTP_STATUS.NOT_FOUND);
      }

      await user.destroy();
      CacheService.del(`modules:user:${user.id}`);

      return ApiResponse.success(res, { id: user.id }, `User ${user.email} deleted.`);
    } catch (error) {
      return ApiResponse.error(res, 'Failed to delete user.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/admin/users/:id/impersonate
   * Allows a super_admin to get a token for another user
   */
  async impersonateUser(req, res) {
    try {
      // Only SUPER_ADMIN can impersonate
      if (req.user.role !== ROLES.SUPER_ADMIN) {
        return ApiResponse.error(res, 'Only Super Admins can perform this action.', HTTP_STATUS.FORBIDDEN);
      }

      const user = await User.findByPk(req.params.id);
      if (!user) {
        return ApiResponse.error(res, 'Target user not found.', HTTP_STATUS.NOT_FOUND);
      }

      // Do not allow impersonating other super admins (optional security measure)
      if (user.role === ROLES.SUPER_ADMIN && user.id !== req.user.id) {
        return ApiResponse.error(res, 'You cannot impersonate another Super Admin.', HTTP_STATUS.FORBIDDEN);
      }

      const token = generateToken(user);

      return ApiResponse.success(res, {
        user: user.toSafeObject(),
        token,
        is_impersonation: true,
      }, `Impersonating ${user.name}...`);
    } catch (error) {
      return ApiResponse.error(res, 'Impersonation failed.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },
};

module.exports = AdminController;
