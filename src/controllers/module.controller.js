'use strict';

const { Module, Lesson, Evaluation, UserProgress } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const CacheService = require('../utils/cache');
const { HTTP_STATUS, PROGRESS_STATUS, LEVEL_ORDER } = require('../config/constants');

/**
 * Module Controller - MVC Controller layer
 * Handles CEFR module retrieval with student progress overlay
 */
const ModuleController = {
  /**
   * GET /api/modules
   * Get all modules with student's progress
   * Returns the "adventure map" data for the dashboard
   */
  async getAll(req, res) {
    try {
      const userId = req.user.id;

      // Try cache first
      const cacheKey = `modules:user:${userId}`;
      const cached = CacheService.get(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return ApiResponse.success(res, cached, 'Modules retrieved.');
      }

      // Get all modules
      const modules = await Module.findAll({
        where: { is_published: true },
        order: [['order_index', 'ASC']],
        include: [
          {
            model: Lesson,
            as: 'lessons',
            where: { is_published: true },
            required: false,
            attributes: ['id', 'title', 'order_index', 'duration_minutes', 'xp_reward', 'icon', 'requires_voice'],
            order: [['order_index', 'ASC']],
          },
          {
            model: Evaluation,
            as: 'evaluation',
            where: { is_published: true },
            required: false,
            attributes: ['id', 'title', 'total_points', 'min_pass_score', 'time_limit_minutes'],
          },
        ],
      });

      // Get user's progress for all lessons and evaluations
      const userProgress = await UserProgress.findAll({
        where: { user_id: userId },
        attributes: ['lesson_id', 'evaluation_id', 'module_id', 'status', 'score', 'xp_earned'],
      });

      // Create progress maps for O(1) lookup
      const lessonProgressMap = {};
      const evalProgressMap = {};
      const moduleProgressMap = {};

      userProgress.forEach((p) => {
        if (p.lesson_id) lessonProgressMap[p.lesson_id] = p;
        if (p.evaluation_id) evalProgressMap[p.evaluation_id] = p;
        if (p.module_id && !p.lesson_id && !p.evaluation_id) {
          moduleProgressMap[p.module_id] = p;
        }
      });

      // Build response with progress overlay
      let previousModuleCompleted = true; // First module is always unlocked

      const modulesWithProgress = modules.map((module, index) => {
        const moduleJson = module.toJSON();

        // Calculate module completion
        const totalLessons = moduleJson.lessons?.length || 0;
        const completedLessons = moduleJson.lessons?.filter(
          (l) => lessonProgressMap[l.id]?.status === PROGRESS_STATUS.COMPLETED
        ).length || 0;

        const evaluationProgress = moduleJson.evaluation
          ? evalProgressMap[moduleJson.evaluation.id]
          : null;
        const evaluationPassed = evaluationProgress?.score >= (moduleJson.evaluation?.min_pass_score || 70);

        const isModuleLocked = !previousModuleCompleted;
        const completionPercent = totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

        // Update for next iteration
        previousModuleCompleted = evaluationPassed;

        return {
          ...moduleJson,
          title: moduleJson.name || moduleJson.title,
          Lessons: moduleJson.lessons || [],
          is_locked: isModuleLocked,
          completion_percent: completionPercent,
          completed_lessons: completedLessons,
          total_lessons: totalLessons,
          evaluation_passed: evaluationPassed,
          evaluation_score: evaluationProgress?.score || null,
          lessons: moduleJson.lessons?.map((lesson) => ({
            ...lesson,
            status: lessonProgressMap[lesson.id]?.status || PROGRESS_STATUS.NOT_STARTED,
            xp_earned: lessonProgressMap[lesson.id]?.xp_earned || 0,
          })),
        };
      });

      CacheService.set(cacheKey, modulesWithProgress, 300); // 5 min cache

      return ApiResponse.success(res, modulesWithProgress, 'Modules retrieved successfully.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve modules.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * GET /api/modules/:id
   * Get single module details
   */
  async getById(req, res) {
    try {
      const module = await Module.findByPk(req.params.id, {
        include: [
          { model: Lesson, as: 'lessons', where: { is_published: true }, required: false, order: [['order_index', 'ASC']] },
          { model: Evaluation, as: 'evaluation', where: { is_published: true }, required: false },
        ],
      });

      if (!module) {
        return ApiResponse.error(res, 'Module not found.', HTTP_STATUS.NOT_FOUND);
      }

      const moduleJson = module.toJSON();
      return ApiResponse.success(res, {
        ...moduleJson,
        title: moduleJson.name || moduleJson.title,
        Lessons: moduleJson.lessons || [],
      }, 'Module retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve module.', HTTP_STATUS.INTERNAL_ERROR);
    }
  },

  // ── Admin Only ─────────────────────────────────────────────────────────────

  /**
   * POST /api/modules (super_admin only)
   */
  async create(req, res) {
    try {
      const module = await Module.create(req.body);
      CacheService.del(CacheService.modulesKey());
      return ApiResponse.success(res, module, 'Module created.', HTTP_STATUS.CREATED);
    } catch (error) {
      return ApiResponse.error(res, 'Failed to create module.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * PUT /api/modules/:id (super_admin only)
   */
  async update(req, res) {
    try {
      const module = await Module.findByPk(req.params.id);
      if (!module) return ApiResponse.error(res, 'Module not found.', HTTP_STATUS.NOT_FOUND);

      await module.update(req.body);
      CacheService.flush(); // Clear all cache on content update
      return ApiResponse.success(res, module, 'Module updated.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to update module.', HTTP_STATUS.INTERNAL_ERROR);
    }
  },
};

module.exports = ModuleController;
