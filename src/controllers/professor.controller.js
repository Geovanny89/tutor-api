'use strict';

const { Readable } = require('stream');
const csv = require('csv-parser');
const Joi = require('joi');
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
const { findManagedAcademy } = require('../utils/tenantScope');
const {
  ROLES,
  AGE_RANGE_ORDER,
  LEVEL_ORDER,
  SUBJECTS,
  HTTP_STATUS,
} = require('../config/constants');

/**
 * Professor Controller
 * Panel del profesor/instituto dueño de una academia:
 *  - gestión de estudiantes (ver progreso, bloquear/desbloquear)
 *  - importación masiva de lecciones por CSV
 *  - CRUD de módulos/lecciones propios
 *  - evaluaciones con tiempo estipulado
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────
const requireAcademy = async (req, res) => {
  const academy = await findManagedAcademy(req.user);
  if (!academy) {
    ApiResponse.error(res, 'You do not have an academy yet. Create one first.', HTTP_STATUS.FORBIDDEN);
    return null;
  }
  return academy;
};

/** Normaliza el rango de edad del CSV (acepta kids/niños, teens/adolescentes, adults/adultos) */
const normalizeAgeRange = (raw) => {
  const v = String(raw || '').trim().toLowerCase();
  if (!v) return null;
  if (['kids', 'kid', 'niños', 'ninos', 'infantil', 'niño'].includes(v)) return 'kids';
  if (['teens', 'teen', 'adolescentes', 'adolescente', 'juvenil'].includes(v)) return 'teens';
  if (['adults', 'adult', 'adultos', 'adulto'].includes(v)) return 'adults';
  return AGE_RANGE_ORDER.includes(v) ? v : null;
};

const normalizeSubject = (raw) => {
  const v = String(raw || '').trim().toLowerCase();
  if (['ingles', 'inglés', 'english'].includes(v)) return SUBJECTS.ENGLISH;
  if (['matematicas', 'matemáticas', 'math', 'maths'].includes(v)) return SUBJECTS.MATH;
  if (['programacion', 'programación', 'programming', 'code'].includes(v)) return SUBJECTS.PROGRAMMING;
  return Object.values(SUBJECTS).includes(v) ? v : SUBJECTS.ENGLISH;
};

const normalizeLevel = (raw) => {
  const v = String(raw || '').trim().toUpperCase();
  return LEVEL_ORDER.includes(v) ? v : 'A1';
};

/** Convierte "hello=hola; book=libro" en la estructura de vocabulario de una lección */
const parseVocabulary = (raw) => {
  if (!raw) return [];
  return String(raw)
    .split(/[;|]/)
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [word, translation, example] = pair.split(/[=:]/).map((s) => (s || '').trim());
      return { word: word || pair, translation: translation || '', example: example || '' };
    });
};

const ProfessorController = {
  /**
   * GET /api/professor/students
   * Lista los estudiantes de la academia con su progreso y consumo de IA.
   */
  async getStudents(req, res) {
    try {
      const academy = await requireAcademy(req, res);
      if (!academy) return;

      const { search = '', status } = req.query;
      const where = { tenant_id: academy.id, role: ROLES.STUDENT };
      if (search.trim()) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search.trim()}%` } },
          { email: { [Op.like]: `%${search.trim()}%` } },
        ];
      }
      if (status === 'active') where.is_active = true;
      if (status === 'blocked') where.is_active = false;

      const students = await User.findAll({
        where,
        attributes: { exclude: ['password'] },
        order: [['created_at', 'DESC']],
      });

      const ids = students.map((s) => s.id);
      const today = new Date().toISOString().split('T')[0];

      const [progressRows, usageRows] = await Promise.all([
        ids.length
          ? UserProgress.findAll({
              where: { user_id: { [Op.in]: ids }, status: 'completed' },
              attributes: ['user_id'],
              raw: true,
            })
          : [],
        ids.length
          ? AiUsage.findAll({
              where: { user_id: { [Op.in]: ids }, date: today },
              attributes: ['user_id', 'interactions_count'],
              raw: true,
            })
          : [],
      ]);

      const completedMap = progressRows.reduce((acc, r) => {
        acc[r.user_id] = (acc[r.user_id] || 0) + 1;
        return acc;
      }, {});
      const usageMap = usageRows.reduce((acc, r) => {
        acc[r.user_id] = r.interactions_count;
        return acc;
      }, {});

      const data = students.map((s) => ({
        ...s.toSafeObject(),
        completed_items: completedMap[s.id] || 0,
        ai_today: usageMap[s.id] || 0,
      }));

      return ApiResponse.success(res, { students: data, total: data.length }, 'Students retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve students.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * GET /api/professor/students/:id
   * Detalle del progreso de un estudiante.
   */
  async getStudentDetail(req, res) {
    try {
      const academy = await requireAcademy(req, res);
      if (!academy) return;

      const student = await User.findOne({
        where: { id: req.params.id, tenant_id: academy.id },
        attributes: { exclude: ['password'] },
      });
      if (!student) return ApiResponse.error(res, 'Student not found.', HTTP_STATUS.NOT_FOUND);

      const [progress, sessions] = await Promise.all([
        UserProgress.findAll({
          where: { user_id: student.id },
          include: [
            { model: Lesson, as: 'lesson', attributes: ['id', 'title', 'icon'], required: false },
            { model: Module, as: 'module', attributes: ['id', 'name', 'level'], required: false },
          ],
          order: [['updated_at', 'DESC']],
          limit: 30,
        }),
        ConversationSession.findAll({
          where: { user_id: student.id },
          attributes: ['id', 'session_type', 'messages_count', 'created_at'],
          order: [['created_at', 'DESC']],
          limit: 10,
        }),
      ]);

      return ApiResponse.success(res, {
        student: student.toSafeObject(),
        progress: progress.map((p) => ({
          id: p.id,
          type: p.lesson_id ? 'lesson' : 'evaluation',
          title: p.lesson?.title || 'Evaluación de módulo',
          module: p.module?.name || null,
          status: p.status,
          score: p.score,
          updated_at: p.updated_at,
        })),
        sessions,
      }, 'Student detail retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve student detail.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * PUT /api/professor/students/:id/status
   * Bloquea o desbloquea a un estudiante.
   */
  async setStudentStatus(req, res) {
    try {
      const academy = await requireAcademy(req, res);
      if (!academy) return;

      const { is_active } = req.body;
      if (typeof is_active !== 'boolean') {
        return ApiResponse.error(res, 'Field "is_active" (boolean) is required.', HTTP_STATUS.BAD_REQUEST);
      }

      const student = await User.findOne({
        where: { id: req.params.id, tenant_id: academy.id, role: ROLES.STUDENT },
      });
      if (!student) return ApiResponse.error(res, 'Student not found.', HTTP_STATUS.NOT_FOUND);

      await student.update({ is_active });
      return ApiResponse.success(
        res,
        student.toSafeObject(),
        is_active ? 'Student unblocked.' : 'Student blocked.'
      );
    } catch (error) {
      return ApiResponse.error(res, 'Failed to update student status.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * GET /api/professor/modules
   * Módulos de la academia + plantillas globales disponibles.
   */
  async getModules(req, res) {
    try {
      const academy = await requireAcademy(req, res);
      if (!academy) return;

      const modules = await Module.findAll({
        where: { [Op.or]: [{ tenant_id: academy.id }, { tenant_id: null }] },
        include: [{ model: Lesson, as: 'lessons', attributes: ['id'] }],
        order: [['order_index', 'ASC']],
      });

      const data = modules.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        level: m.level,
        age_range: m.age_range,
        subject: m.subject,
        icon: m.icon,
        is_published: m.is_published,
        is_own: m.tenant_id === academy.id,
        lessons_count: m.lessons?.length || 0,
      }));

      return ApiResponse.success(res, { modules: data }, 'Modules retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve modules.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/professor/modules
   * Crea un módulo propio de la academia.
   */
  async createModule(req, res) {
    try {
      const academy = await requireAcademy(req, res);
      if (!academy) return;

      const schema = Joi.object({
        name: Joi.string().min(2).max(100).required(),
        level: Joi.string().valid(...LEVEL_ORDER).default('A1'),
        age_range: Joi.string().valid(...AGE_RANGE_ORDER).default('adults'),
        subject: Joi.string().valid(...Object.values(SUBJECTS)).default(SUBJECTS.ENGLISH),
        description: Joi.string().allow('', null),
        icon: Joi.string().max(10).default('📚'),
      });
      const { error, value } = schema.validate(req.body, { abortEarly: false });
      if (error) {
        return ApiResponse.error(res, error.details.map((d) => d.message).join('. '), HTTP_STATUS.BAD_REQUEST);
      }

      const orderIndex = await Module.count({ where: { tenant_id: academy.id } });

      const module = await Module.create({
        ...value,
        tenant_id: academy.id,
        order_index: orderIndex,
        is_published: true,
      });

      CacheService.flush();
      return ApiResponse.success(res, { module }, 'Module created.', HTTP_STATUS.CREATED);
    } catch (error) {
      return ApiResponse.error(res, 'Failed to create module.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * PUT /api/professor/modules/:id
   * Edita un módulo propio de la academia.
   */
  async updateModule(req, res) {
    try {
      const academy = await requireAcademy(req, res);
      if (!academy) return;

      const module = await Module.findOne({ where: { id: req.params.id, tenant_id: academy.id } });
      if (!module) return ApiResponse.error(res, 'Module not found in your academy.', HTTP_STATUS.NOT_FOUND);

      const schema = Joi.object({
        name: Joi.string().min(2).max(100),
        level: Joi.string().valid(...LEVEL_ORDER),
        age_range: Joi.string().valid(...AGE_RANGE_ORDER),
        subject: Joi.string().valid(...Object.values(SUBJECTS)),
        description: Joi.string().allow('', null),
        icon: Joi.string().max(10),
        is_published: Joi.boolean(),
      });
      const { error, value } = schema.validate(req.body, { abortEarly: false });
      if (error) {
        return ApiResponse.error(res, error.details.map((d) => d.message).join('. '), HTTP_STATUS.BAD_REQUEST);
      }

      await module.update(value);
      CacheService.flush();
      return ApiResponse.success(res, { module }, 'Module updated.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to update module.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * DELETE /api/professor/modules/:id
   * Elimina un módulo propio con sus lecciones, evaluación y progreso asociado.
   */
  async deleteModule(req, res) {
    try {
      const academy = await requireAcademy(req, res);
      if (!academy) return;

      const module = await Module.findOne({ where: { id: req.params.id, tenant_id: academy.id } });
      if (!module) return ApiResponse.error(res, 'Module not found in your academy.', HTTP_STATUS.NOT_FOUND);

      await Promise.all([
        Lesson.destroy({ where: { module_id: module.id } }),
        Evaluation.destroy({ where: { module_id: module.id } }),
        UserProgress.destroy({ where: { module_id: module.id } }),
      ]);
      await module.destroy();

      CacheService.flush();
      return ApiResponse.success(res, { id: module.id }, `Module "${module.name}" deleted.`);
    } catch (error) {
      return ApiResponse.error(res, 'Failed to delete module.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/professor/modules/:id/clone
   * Importa (clona) un módulo global por defecto dentro de la academia,
   * copiando sus lecciones y su evaluación para poder editarlos.
   */
  async cloneModule(req, res) {
    try {
      const academy = await requireAcademy(req, res);
      if (!academy) return;

      const source = await Module.findByPk(req.params.id, {
        include: [
          { model: Lesson, as: 'lessons' },
          { model: Evaluation, as: 'evaluation' },
        ],
      });
      if (!source) return ApiResponse.error(res, 'Module not found.', HTTP_STATUS.NOT_FOUND);

      if (source.tenant_id === academy.id) {
        return ApiResponse.error(res, 'This module already belongs to your academy.', HTTP_STATUS.BAD_REQUEST);
      }
      if (source.tenant_id) {
        return ApiResponse.error(res, 'You can only import global default modules.', HTTP_STATUS.FORBIDDEN);
      }

      const orderIndex = await Module.count({ where: { tenant_id: academy.id } });

      const newModule = await Module.create({
        name: source.name,
        description: source.description,
        level: source.level,
        age_range: source.age_range,
        subject: source.subject,
        icon: source.icon,
        color_from: source.color_from,
        color_to: source.color_to,
        xp_reward: source.xp_reward,
        total_lessons: source.lessons?.length || 0,
        order_index: orderIndex,
        is_published: true,
        tenant_id: academy.id,
      });

      const sourceLessons = source.lessons || [];
      for (const lesson of sourceLessons) {
        await Lesson.create({
          module_id: newModule.id,
          tenant_id: academy.id,
          title: lesson.title,
          subtitle: lesson.subtitle,
          situation: lesson.situation,
          teacher_prompt: lesson.teacher_prompt,
          age_range: lesson.age_range,
          subject: lesson.subject,
          order_index: lesson.order_index,
          icon: lesson.icon,
          duration_minutes: lesson.duration_minutes,
          xp_reward: lesson.xp_reward,
          requires_voice: lesson.requires_voice,
          content: lesson.content,
          source: 'manual',
          is_published: true,
        });
      }

      if (source.evaluation) {
        await Evaluation.create({
          module_id: newModule.id,
          title: source.evaluation.title,
          instructions: source.evaluation.instructions,
          questions: source.evaluation.questions,
          total_points: source.evaluation.total_points,
          min_pass_score: source.evaluation.min_pass_score,
          time_limit_minutes: source.evaluation.time_limit_minutes,
          max_attempts: source.evaluation.max_attempts,
          is_published: true,
        });
      }

      CacheService.flush();
      return ApiResponse.success(res, { module: newModule }, 'Module imported to your academy.', HTTP_STATUS.CREATED);
    } catch (error) {
      return ApiResponse.error(res, 'Failed to import module.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/professor/lessons
   * Crea una lección dentro de un módulo propio.
   */
  async createLesson(req, res) {
    try {
      const academy = await requireAcademy(req, res);
      if (!academy) return;

      const schema = Joi.object({
        module_id: Joi.string().required(),
        title: Joi.string().min(2).max(150).required(),
        subtitle: Joi.string().allow('', null),
        situation: Joi.string().allow('', null),
        teacher_prompt: Joi.string().allow('', null),
        age_range: Joi.string().valid(...AGE_RANGE_ORDER).allow(null),
        subject: Joi.string().valid(...Object.values(SUBJECTS)).allow(null),
        content: Joi.object().default({}),
        icon: Joi.string().max(10).default('🎯'),
      });
      const { error, value } = schema.validate(req.body, { abortEarly: false });
      if (error) {
        return ApiResponse.error(res, error.details.map((d) => d.message).join('. '), HTTP_STATUS.BAD_REQUEST);
      }

      const module = await Module.findOne({ where: { id: value.module_id, tenant_id: academy.id } });
      if (!module) return ApiResponse.error(res, 'Module not found in your academy.', HTTP_STATUS.NOT_FOUND);

      const orderIndex = await Lesson.count({ where: { module_id: module.id } });

      const lesson = await Lesson.create({
        module_id: module.id,
        tenant_id: academy.id,
        title: value.title,
        subtitle: value.subtitle || null,
        situation: value.situation || null,
        teacher_prompt: value.teacher_prompt || null,
        age_range: value.age_range || module.age_range,
        subject: value.subject || module.subject,
        content: value.content,
        order_index: orderIndex,
        icon: value.icon,
        source: 'manual',
      });

      await module.update({ total_lessons: orderIndex + 1 });

      CacheService.flush();
      return ApiResponse.success(res, { lesson }, 'Lesson created.', HTTP_STATUS.CREATED);
    } catch (error) {
      return ApiResponse.error(res, 'Failed to create lesson.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * DELETE /api/professor/lessons/:id
   */
  async deleteLesson(req, res) {
    try {
      const academy = await requireAcademy(req, res);
      if (!academy) return;

      const lesson = await Lesson.findOne({ where: { id: req.params.id, tenant_id: academy.id } });
      if (!lesson) return ApiResponse.error(res, 'Lesson not found.', HTTP_STATUS.NOT_FOUND);

      await lesson.destroy();
      CacheService.flush();
      return ApiResponse.success(res, { id: lesson.id }, 'Lesson deleted.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to delete lesson.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/professor/lessons/import  (multipart/form-data, campo "file")
   * Importa lecciones desde un CSV. Columnas esperadas:
   *   materia, rango_edad, nivel, modulo, titulo, subtitulo, situacion, vocabulario, prompt_profesor
   */
  async importLessonsCSV(req, res) {
    try {
      const academy = await requireAcademy(req, res);
      if (!academy) return;

      if (!req.file) {
        return ApiResponse.error(res, 'CSV file is required (field "file").', HTTP_STATUS.BAD_REQUEST);
      }

      const rows = await new Promise((resolve, reject) => {
        const results = [];
        Readable.from(req.file.buffer)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
      });

      if (rows.length === 0) {
        return ApiResponse.error(res, 'The CSV file is empty or has no valid rows.', HTTP_STATUS.BAD_REQUEST);
      }

      const created = [];
      const errors = [];

      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        // Normaliza nombres de columnas (tolera mayúsculas, tildes y espacios)
        const get = (key) => {
          const found = Object.keys(row).find((k) => k.trim().toLowerCase() === key);
          return found ? row[found] : '';
        };

        const title = String(get('titulo') || '').trim();
        if (!title) {
          errors.push({ row: i + 2, error: 'Falta la columna "titulo"' });
          continue;
        }

        try {
          const subject = normalizeSubject(get('materia'));
          const ageRange = normalizeAgeRange(get('rango_edad')) || AGE_RANGE_ORDER[2];
          const level = normalizeLevel(get('nivel'));
          const moduleName = String(get('modulo') || title).trim().slice(0, 100);

          // Buscar o crear el módulo del profesor para esa combinación
          const [module] = await Module.findOrCreate({
            where: { tenant_id: academy.id, name: moduleName, subject, age_range: ageRange },
            defaults: {
              tenant_id: academy.id,
              name: moduleName,
              level,
              age_range: ageRange,
              subject,
              order_index: await Module.count({ where: { tenant_id: academy.id } }),
              is_published: true,
            },
          });

          const orderIndex = await Lesson.count({ where: { module_id: module.id } });

          const lesson = await Lesson.create({
            module_id: module.id,
            tenant_id: academy.id,
            title,
            subtitle: String(get('subtitulo') || '').trim() || null,
            situation: String(get('situacion') || '').trim() || null,
            teacher_prompt: String(get('prompt_profesor') || '').trim() || null,
            age_range: ageRange,
            subject,
            order_index: orderIndex,
            source: 'csv',
            content: {
              intro: { text: String(get('situacion') || '').trim() },
              vocabulary: parseVocabulary(get('vocabulario')),
            },
          });

          await module.update({ total_lessons: orderIndex + 1 });
          created.push({ id: lesson.id, title: lesson.title, module: module.name });
        } catch (rowError) {
          errors.push({ row: i + 2, error: rowError.message });
        }
      }

      CacheService.flush();
      return ApiResponse.success(
        res,
        { imported: created.length, created, errors },
        `CSV processed: ${created.length} lessons imported.`
      );
    } catch (error) {
      return ApiResponse.error(res, 'Failed to import CSV.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * PUT /api/professor/modules/:id/evaluation
   * Crea o actualiza la evaluación de un módulo propio, con tiempo estipulado.
   */
  async upsertEvaluation(req, res) {
    try {
      const academy = await requireAcademy(req, res);
      if (!academy) return;

      const module = await Module.findOne({ where: { id: req.params.id, tenant_id: academy.id } });
      if (!module) return ApiResponse.error(res, 'Module not found in your academy.', HTTP_STATUS.NOT_FOUND);

      const schema = Joi.object({
        title: Joi.string().max(150).required(),
        instructions: Joi.string().allow('', null),
        questions: Joi.array().items(Joi.object()).min(1).required(),
        time_limit_minutes: Joi.number().integer().min(1).max(240).default(20),
        min_pass_score: Joi.number().integer().min(1).max(100).default(70),
        max_attempts: Joi.number().integer().min(1).max(10).default(3),
      });
      const { error, value } = schema.validate(req.body, { abortEarly: false });
      if (error) {
        return ApiResponse.error(res, error.details.map((d) => d.message).join('. '), HTTP_STATUS.BAD_REQUEST);
      }

      const totalPoints = value.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0) || 100;

      const [evaluation] = await Evaluation.findOrCreate({
        where: { module_id: module.id },
        defaults: { module_id: module.id, ...value, total_points: totalPoints },
      });
      await evaluation.update({ ...value, total_points: totalPoints });

      CacheService.flush();
      return ApiResponse.success(res, { evaluation }, 'Evaluation saved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to save evaluation.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * GET /api/professor/overview
   * Métricas rápidas de la academia para el dashboard del profesor.
   */
  async getOverview(req, res) {
    try {
      const academy = await requireAcademy(req, res);
      if (!academy) return;

      const [students, blocked, ownModules, ownLessons] = await Promise.all([
        User.count({ where: { tenant_id: academy.id, role: ROLES.STUDENT } }),
        User.count({ where: { tenant_id: academy.id, role: ROLES.STUDENT, is_active: false } }),
        Module.count({ where: { tenant_id: academy.id } }),
        Lesson.count({ where: { tenant_id: academy.id } }),
      ]);

      return ApiResponse.success(res, {
        academy: {
          id: academy.id,
          name: academy.name,
          slug: academy.slug,
          primary_color: academy.primary_color,
          logo_url: academy.logo_url,
          enabled_age_ranges: academy.enabled_age_ranges,
          is_public_page_active: academy.is_public_page_active,
        },
        metrics: {
          students,
          blocked,
          active: students - blocked,
          spots_left: Math.max(0, academy.max_students - students),
          max_students: academy.max_students,
          own_modules: ownModules,
          own_lessons: ownLessons,
        },
      }, 'Overview retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve overview.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },
};

module.exports = ProfessorController;
