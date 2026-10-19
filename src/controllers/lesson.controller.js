'use strict';

const { Lesson, UserProgress, Module } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const CacheService = require('../utils/cache');
const { HTTP_STATUS, PROGRESS_STATUS } = require('../config/constants');

/**
 * Lesson Controller - MVC Controller layer
 */
const LessonController = {
  /**
   * GET /api/lessons/:id
   * Get lesson content with user progress
   */
  async getById(req, res) {
    try {
      const lesson = await Lesson.findByPk(req.params.id, {
        include: [{ model: Module, as: 'module', attributes: ['id', 'level', 'name', 'color_from', 'color_to'] }],
      });

      if (!lesson || !lesson.is_published) {
        return ApiResponse.error(res, 'Lesson not found.', HTTP_STATUS.NOT_FOUND);
      }

      // Get user's progress for this lesson
      const progress = await UserProgress.findOne({
        where: { user_id: req.user.id, lesson_id: lesson.id },
      });

      return ApiResponse.success(res, {
        ...lesson.toJSON(),
        user_progress: progress || { status: PROGRESS_STATUS.NOT_STARTED, xp_earned: 0 },
      }, 'Lesson loaded. Good luck! 🚀');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to load lesson.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/lessons/:id/complete
   * Mark lesson as completed and award XP
   */
  async complete(req, res) {
    try {
      const { time_spent_seconds = 0 } = req.body;
      const lessonId = req.params.id;
      const userId = req.user.id;

      const lesson = await Lesson.findByPk(lessonId);
      if (!lesson) return ApiResponse.error(res, 'Lesson not found.', HTTP_STATUS.NOT_FOUND);

      // Find or create progress record
      const [progress, created] = await UserProgress.findOrCreate({
        where: { user_id: userId, lesson_id: lessonId },
        defaults: {
          user_id: userId,
          lesson_id: lessonId,
          module_id: lesson.module_id,
          status: PROGRESS_STATUS.NOT_STARTED,
          xp_earned: 0,
        },
      });

      // Only award XP on first completion
      const isFirstCompletion = progress.status !== PROGRESS_STATUS.COMPLETED;
      const xpEarned = isFirstCompletion ? lesson.xp_reward : 0;

      await progress.update({
        status: PROGRESS_STATUS.COMPLETED,
        xp_earned: lesson.xp_reward, // Always store max XP (for display)
        time_spent_seconds: (progress.time_spent_seconds || 0) + time_spent_seconds,
        completed_at: isFirstCompletion ? new Date() : progress.completed_at,
      });

      // Award XP to user if first completion
      if (isFirstCompletion) {
        await req.user.increment({ total_xp: xpEarned });
        await req.user.update({ last_activity_at: new Date() });
      }

      // Clear modules cache to reflect updated progress
      CacheService.del(`modules:user:${userId}`);

      return ApiResponse.success(res, {
        xp_earned: xpEarned,
        total_xp: req.user.total_xp + xpEarned,
        is_first_completion: isFirstCompletion,
        progress: progress.toJSON(),
      }, isFirstCompletion ? `Lesson complete! +${xpEarned} XP! 🎉` : 'Lesson reviewed!');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to complete lesson.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/lessons (super_admin only)
   * Create a new lesson
   */
  async create(req, res) {
    try {
      const lesson = await Lesson.create(req.body);
      // Update module total_lessons count
      await Module.increment('total_lessons', { where: { id: lesson.module_id } });
      CacheService.flush();
      return ApiResponse.success(res, lesson, 'Lesson created.', HTTP_STATUS.CREATED);
    } catch (error) {
      return ApiResponse.error(res, 'Failed to create lesson.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * PUT /api/lessons/:id (super_admin only)
   */
  async update(req, res) {
    try {
      const lesson = await Lesson.findByPk(req.params.id);
      if (!lesson) return ApiResponse.error(res, 'Lesson not found.', HTTP_STATUS.NOT_FOUND);
      await lesson.update(req.body);
      CacheService.flush();
      return ApiResponse.success(res, lesson, 'Lesson updated.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to update lesson.', HTTP_STATUS.INTERNAL_ERROR);
    }
  },
};

module.exports = LessonController;
