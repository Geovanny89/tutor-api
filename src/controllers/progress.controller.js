'use strict';

const { UserProgress, ConversationSession, User, Module, Lesson, AiUsage } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS, PROGRESS_STATUS, LEVEL_ORDER } = require('../config/constants');
const { Op } = require('sequelize');

/**
 * Progress Controller - MVC Controller layer
 * Returns student's comprehensive learning history and stats
 */
const ProgressController = {
  /**
   * GET /api/progress
   * Get full progress overview for current user
   * Powers the "My Progress" dashboard page
   */
  async getMyProgress(req, res) {
    try {
      const userId = req.user.id;

      // Get all completed lessons and evaluations
      const allProgress = await UserProgress.findAll({
        where: { user_id: userId },
        include: [
          { model: Lesson, as: 'lesson', attributes: ['id', 'title', 'icon', 'xp_reward'], required: false },
          { model: Module, as: 'module', attributes: ['id', 'level', 'name', 'icon'], required: false },
        ],
        order: [['updated_at', 'DESC']],
      });

      // Get conversation sessions
      const sessions = await ConversationSession.findAll({
        where: { user_id: userId },
        attributes: ['id', 'messages_count', 'duration_seconds', 'created_at', 'xp_earned'],
        order: [['created_at', 'DESC']],
        limit: 10,
      });

      // Get today's AI usage
      const today = new Date().toISOString().split('T')[0];
      const todayUsage = await AiUsage.findOne({ where: { user_id: userId, date: today } });

      // ── Calculate Stats ────────────────────────────────────────────────
      const completedLessons = allProgress.filter(
        (p) => p.lesson_id && p.status === PROGRESS_STATUS.COMPLETED
      );
      const passedEvaluations = allProgress.filter(
        (p) => p.evaluation_id && p.score >= 70
      );

      const totalTimeMinutes = Math.round(
        allProgress.reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0) / 60
      );

      // Weekly activity (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyProgress = allProgress.filter((p) => new Date(p.updated_at) >= weekAgo);

      // ── Level Roadmap ──────────────────────────────────────────────────
      const currentLevelIndex = LEVEL_ORDER.indexOf(req.user.current_level);
      const levelRoadmap = LEVEL_ORDER.map((level, idx) => ({
        level,
        status: idx < currentLevelIndex
          ? 'completed'
          : idx === currentLevelIndex
            ? 'current'
            : 'locked',
      }));

      return ApiResponse.success(res, {
        user: {
          name: req.user.name,
          level: req.user.current_level,
          total_xp: req.user.total_xp,
          streak_days: req.user.streak_days,
        },
        stats: {
          completed_lessons: completedLessons.length,
          passed_evaluations: passedEvaluations.length,
          total_time_minutes: totalTimeMinutes,
          total_sessions: sessions.length,
          today_ai_used: todayUsage?.interactions_count || 0,
          today_ai_limit: parseInt(process.env.AI_DAILY_LIMIT) || 20,
        },
        level_roadmap: levelRoadmap,
        recent_activity: allProgress.slice(0, 10).map((p) => ({
          id: p.id,
          type: p.lesson_id ? 'lesson' : 'evaluation',
          title: p.lesson?.title || 'Module Evaluation',
          module: p.module?.name,
          icon: p.lesson?.icon || '📝',
          status: p.status,
          score: p.score,
          xp_earned: p.xp_earned,
          completed_at: p.completed_at,
        })),
        recent_sessions: sessions,
        weekly_lessons: weeklyProgress.length,
      }, 'Progress retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve progress.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * GET /api/progress/leaderboard
   * Top students in the same tenant
   */
  async getLeaderboard(req, res) {
    try {
      const where = { role: 'student', is_active: true };
      if (req.user.tenant_id) {
        where.tenant_id = req.user.tenant_id;
      }

      const topStudents = await User.findAll({
        where,
        attributes: ['id', 'name', 'avatar_url', 'total_xp', 'current_level', 'streak_days'],
        order: [['total_xp', 'DESC']],
        limit: 10,
      });

      const leaderboard = topStudents.map((student, index) => ({
        rank: index + 1,
        name: student.name,
        avatar_url: student.avatar_url,
        level: student.current_level,
        total_xp: student.total_xp,
        streak_days: student.streak_days,
        is_me: student.id === req.user.id,
      }));

      return ApiResponse.success(res, leaderboard, 'Leaderboard retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to get leaderboard.', HTTP_STATUS.INTERNAL_ERROR);
    }
  },
};

module.exports = ProgressController;
