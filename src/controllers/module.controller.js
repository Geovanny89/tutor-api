'use strict';

const { Module, Lesson, Evaluation, UserProgress, Tenant } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const CacheService = require('../utils/cache');
const { HTTP_STATUS, PROGRESS_STATUS, LEVEL_ORDER, ROLES } = require('../config/constants');

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

      // Admins can request unpublished content for management (never cached)
      const isAdmin = req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.TENANT_ADMIN;
      const includeUnpublished = isAdmin && req.query.include_unpublished === 'true';
      const lessonFilter = includeUnpublished ? {} : { is_published: true };
      const evalFilter = includeUnpublished ? {} : { is_published: true };

      // ── Alcance por academia ────────────────────────────────────────────
      // super_admin ve todo; el resto ve SOLO el contenido de su academia.
      // Los estudiantes de la plataforma (tenant sin dueño) ven los módulos globales.
      let scopeFilter = {};
      if (req.user.role !== ROLES.SUPER_ADMIN) {
        const tenant = req.user.tenant_id ? await Tenant.findByPk(req.user.tenant_id) : null;
        scopeFilter = tenant && tenant.owner_id
          ? { tenant_id: tenant.id }   // academia: únicamente sus módulos
          : { tenant_id: null };       // plataforma: únicamente módulos globales
      }
      const publishedFilter = {
        ...scopeFilter,
        ...(includeUnpublished ? {} : { is_published: true }),
      };

      // Try cache first
      const cacheKey = `modules:user:${userId}`;
      const cached = CacheService.get(cacheKey);
      if (!includeUnpublished && cached && Array.isArray(cached) && cached.length > 0) {
        return ApiResponse.success(res, cached, 'Modules retrieved.');
      }

      // Get all modules
      const modules = await Module.findAll({
        where: publishedFilter,
        order: [['order_index', 'ASC']],
        include: [
          {
            model: Lesson,
            as: 'lessons',
            where: lessonFilter,
            required: false,
            attributes: ['id', 'title', 'order_index', 'duration_minutes', 'xp_reward', 'icon', 'requires_voice', 'is_published'],
            order: [['order_index', 'ASC']],
          },
          {
            model: Evaluation,
            as: 'evaluation',
            where: evalFilter,
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
      const {
        title,
        name,
        description,
        level,
        order_index,
        icon,
        color_from,
        color_to,
        xp_reward,
        is_published,
      } = req.body;

      const moduleName = name || title;
      if (!moduleName || !String(moduleName).trim()) {
        return ApiResponse.error(res, 'Module name is required.', HTTP_STATUS.BAD_REQUEST);
      }
      if (!level || !LEVEL_ORDER.includes(level)) {
        return ApiResponse.error(res, 'A valid CEFR level (A1-C2) is required.', HTTP_STATUS.BAD_REQUEST);
      }

      // Auto-assign next order when not provided
      let nextOrder = order_index !== undefined ? Number(order_index) : null;
      if (nextOrder === null || Number.isNaN(nextOrder)) {
        const last = await Module.findOne({ order: [['order_index', 'DESC']], attributes: ['order_index'] });
        nextOrder = last ? last.order_index + 1 : 1;
      }

      const module = await Module.create({
        name: String(moduleName).trim(),
        description: description || null,
        level,
        order_index: nextOrder,
        ...(icon && { icon }),
        ...(color_from && { color_from }),
        ...(color_to && { color_to }),
        ...(xp_reward !== undefined && { xp_reward: Number(xp_reward) }),
        ...(is_published !== undefined && { is_published }),
      });

      CacheService.flush();
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

      const { title, name, description, level, order_index, icon, color_from, color_to, xp_reward, is_published } = req.body;

      await module.update({
        ...((name || title) && { name: name || title }),
        ...(description !== undefined && { description }),
        ...(level && { level }),
        ...(order_index !== undefined && { order_index: Number(order_index) }),
        ...(icon && { icon }),
        ...(color_from && { color_from }),
        ...(color_to && { color_to }),
        ...(xp_reward !== undefined && { xp_reward: Number(xp_reward) }),
        ...(is_published !== undefined && { is_published }),
      });

      CacheService.flush(); // Clear all cache on content update
      return ApiResponse.success(res, module, 'Module updated.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to update module.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * DELETE /api/modules/:id (super_admin only)
   * Deletes the module together with its lessons, evaluation and student progress
   */
  async remove(req, res) {
    try {
      const module = await Module.findByPk(req.params.id);
      if (!module) return ApiResponse.error(res, 'Module not found.', HTTP_STATUS.NOT_FOUND);

      const [lessons, evaluation, progressDeleted] = await Promise.all([
        Lesson.destroy({ where: { module_id: module.id }, force: true }),
        Evaluation.destroy({ where: { module_id: module.id }, force: true }),
        UserProgress.destroy({ where: { module_id: module.id }, force: true }),
      ]);

      await module.destroy({ force: true });
      CacheService.flush();

      return ApiResponse.success(res, {
        id: module.id,
        deleted: { lessons, evaluations: evaluation, progress_records: progressDeleted },
      }, `Module "${module.name}" deleted.`);
    } catch (error) {
      return ApiResponse.error(res, 'Failed to delete module.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },
};

module.exports = ModuleController;
