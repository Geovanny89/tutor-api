'use strict';

const AiService = require('../services/ai.service');
const { ConversationSession, AiUsage, Module, Lesson } = require('../models');
const { incrementAiUsage, resolveDailyLimit } = require('../middlewares/rateLimit.middleware');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Títulos de las lecciones del estudiante (según su nivel y rango de edad) para
 * que el tutor conversacional practique el vocabulario/temas del currículo que
 * le corresponde a cada edad. Nunca lanza: si falla, el tutor sigue sin contexto.
 * @param {object} user - usuario autenticado (current_level, age_range)
 * @returns {Promise<string>} contexto de currículo o cadena vacía
 */
const buildCurriculumContext = async (user) => {
  try {
    const modules = await Module.findAll({
      where: {
        level: user.current_level || 'A1',
        age_range: user.age_range || 'adults',
        is_published: true,
      },
      attributes: ['id'],
      include: [{
        model: Lesson,
        as: 'lessons',
        where: { is_published: true },
        required: false,
        attributes: ['title'],
      }],
      order: [['order_index', 'ASC']],
      limit: 4,
    });

    const titles = modules
      .flatMap((m) => (m.lessons || []).map((l) => l.title))
      .slice(0, 8);

    return titles.length
      ? `Lecciones actuales del estudiante: ${titles.map((t) => `"${t}"`).join(', ')}. Practica ese vocabulario y esos temas.`
      : '';
  } catch {
    return '';
  }
};

/**
 * AI Controller - MVC Controller layer
 * Handles all AI-powered interactions
 * Protected by checkAiLimit middleware
 */
const AiController = {
  /**
   * GET /api/ai/status
   * Reports which AI providers are actually reachable.
   * Lets the UI show whether the tutor is online or running in degraded mode.
   */
  async getStatus(req, res) {
    const status = AiService.getProviderStatus();
    return ApiResponse.success(res, status, status.connected
      ? 'AI tutor is online.'
      : 'AI tutor is currently offline.');
  },

  /**
   * POST /api/ai/chat
   * Send a message to the AI English tutor
   * This is the main conversational endpoint
   *
   * Body: { message, session_id, mode, persona, domain, context }
   *   mode: 'conversation' (fluency) | 'technical' (professional English)
   */
  async chat(req, res) {
    try {
      const {
        message,
        session_id,
        mode = 'conversation',
        persona = 'Beyli (Friendly Native Tutor)',
        domain = 'general professional English',
        context = '',
      } = req.body;
      const userId = req.user.id;
      const level = req.user.current_level;
      const ageRange = req.body.age_range || req.user.age_range || 'adults';

      if (!message || message.trim().length === 0) {
        return ApiResponse.error(res, 'Please say something! 😊', HTTP_STATUS.BAD_REQUEST);
      }

      if (message.length > 2000) {
        return ApiResponse.error(res, 'Message too long. Keep it under 2000 characters.', HTTP_STATUS.BAD_REQUEST);
      }

      // Alinea el tutor libre con las lecciones que le corresponden por edad.
      const curriculum = mode === 'conversation' ? await buildCurriculumContext(req.user) : '';
      const tutorContext = [context, curriculum].filter(Boolean).join(' ');

      // Load conversation history if session exists
      let session = null;
      let history = [];

      if (session_id) {
        session = await ConversationSession.findOne({
          where: { id: session_id, user_id: userId },
        });
        if (session) {
          history = (session.messages || []).map((m) => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.text,
          }));
        }
      }

      // Generate AI response (new signature: options object)
      const { text, tokensUsed, fromCache, provider } = await AiService.generateResponse(
        message,
        level,
        history,
        { mode, persona, domain, context: tutorContext, ageRange }
      );

      // Save to conversation session
      const userMsg = { role: 'user', text: message, timestamp: new Date().toISOString() };
      const aiMsg = { role: 'ai', text, timestamp: new Date().toISOString() };

      if (!session) {
        // Create new session
        session = await ConversationSession.create({
          user_id: userId,
          session_type: mode === 'lesson' ? 'lesson_practice' : 'free_conversation',
          messages: [userMsg, aiMsg],
          messages_count: 2,
          ai_tokens_used: tokensUsed,
        });
      } else {
        // Append to existing session
        await session.update({
          messages: [...(session.messages || []), userMsg, aiMsg],
          messages_count: (session.messages_count || 0) + 2,
          ai_tokens_used: (session.ai_tokens_used || 0) + tokensUsed,
        });
      }

      // Increment usage counter (unless it was a cache hit)
      if (!fromCache && provider !== 'fallback') {
        await incrementAiUsage(userId, tokensUsed);
      }

      return ApiResponse.success(res, {
        reply: text,
        message: text,
        text,
        session_id: session.id,
        provider,
        from_cache: fromCache,
        connected: provider !== 'fallback',
        ai_remaining: req.aiRemaining - (fromCache ? 0 : 1),
        ai_limit: req.aiDailyLimit,
      }, 'AI response generated.');
    } catch (error) {
      return ApiResponse.error(res, 'AI response failed. Please try again.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/ai/grade
   * Grade a student's spoken or written answer
   * Used during exercises - minimal token usage
   * Body: { student_answer, expected_answer, level? }
   */
  async gradeAnswer(req, res) {
    try {
      const { student_answer, expected_answer, level } = req.body;
      const userLevel = level || req.user.current_level;

      if (!student_answer || !expected_answer) {
        return ApiResponse.error(res, 'Student answer and expected answer are required.', HTTP_STATUS.BAD_REQUEST);
      }

      const result = await AiService.gradeAnswer(student_answer, expected_answer, userLevel);

      // Only increment if AI was actually used (not local grading)
      if (result.usedAi && !result.fromCache) {
        await incrementAiUsage(req.user.id, result.tokensUsed || 50);
      }

      return ApiResponse.success(res, {
        ...result,
        ai_remaining: req.aiRemaining,
      }, 'Answer graded!');
    } catch (error) {
      return ApiResponse.error(res, 'Grading failed.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/ai/explain
   * Explain a lesson concept step-by-step
   */
  async explainConcept(req, res) {
    try {
      const { lesson_title, grammar_rule, question, level } = req.body;
      const userLevel = level || req.user?.current_level || 'A1';
      const ageRange = req.body.age_range || req.user?.age_range || 'adults';

      const result = await AiService.explainLessonConcept(
        lesson_title || 'English Concept',
        grammar_rule || '',
        question || '',
        userLevel,
        ageRange
      );

      return ApiResponse.success(res, {
        explanation: result.text,
        tokens_used: result.tokensUsed,
        provider: result.provider,
      }, 'Lesson explanation generated.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to generate explanation.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/ai/practice/generate
   * Generate a fresh set of exercises for a module (or a free topic).
   * Body: { module_id?, topic?, type?, count? }
   */
  async generatePractice(req, res) {
    try {
      const { module_id, topic, type = 'fill_blank', count = 5, age_range } = req.body;

      let resolvedTopic = topic;
      let context = '';

      // When tied to a module, pull its title/description/level for accurate content
      if (module_id) {
        const module = await Module.findByPk(module_id, {
          attributes: ['id', 'name', 'description', 'level'],
        });
        if (module) {
          resolvedTopic = resolvedTopic || module.name;
          context = module.description || '';
        }
      }

      const result = await AiService.generatePractice({
        level: req.user.current_level || 'A1',
        topic: resolvedTopic || 'general English',
        type,
        count,
        context,
        ageRange: age_range || req.user.age_range || 'adults',
      });

      if (!result.generated) {
        return ApiResponse.error(
          res,
          'No pudimos generar los ejercicios en este momento. Intenta de nuevo. 🔄',
          HTTP_STATUS.SERVICE_UNAVAILABLE,
          { provider: result.provider }
        );
      }

      if (!result.fromCache) {
        await incrementAiUsage(req.user.id, result.tokensUsed || 400);
      }

      return ApiResponse.success(res, result, 'Practice generated.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to generate practice.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/ai/practice/check
   * Validate a single practice answer with instant + AI feedback.
   * Body: { level?, type, sentence?, expected, student_answer }
   */
  async checkPractice(req, res) {
    try {
      const { level, type = 'fill_blank', sentence = '', expected, student_answer, hints = [] } = req.body;

      if (!expected || student_answer === undefined || student_answer === null) {
        return ApiResponse.error(res, 'Expected answer and student answer are required.', HTTP_STATUS.BAD_REQUEST);
      }

      const result = await AiService.checkPracticeAnswer({
        level: level || req.user.current_level || 'A1',
        type,
        sentence,
        expected,
        studentAnswer: student_answer,
        hints,
      });

      if (result.usedAi) {
        await incrementAiUsage(req.user.id, 60);
      }

      return ApiResponse.success(res, result, result.correct ? 'Correct!' : 'Try again!');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to check answer.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * GET /api/ai/usage
   * Get current user's AI usage stats for today
   */
  async getUsage(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const usage = await AiUsage.findOne({
        where: { user_id: req.user.id, date: today },
      });

      // Same limit checkAiLimit enforces (tenant first, env as fallback)
      const dailyLimit = await resolveDailyLimit(req.user);
      const used = usage?.interactions_count || 0;

      return ApiResponse.success(res, {
        used,
        limit: dailyLimit,
        remaining: Math.max(0, dailyLimit - used),
        tokens_used: usage?.tokens_used || 0,
        reset_at: 'Midnight tonight',
        percentage: Math.round((used / dailyLimit) * 100),
      }, 'Usage stats retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to get usage stats.', HTTP_STATUS.INTERNAL_ERROR);
    }
  },

  /**
   * GET /api/ai/sessions
   * Get conversation history for the current user
   */
  async getSessions(req, res) {
    try {
      const sessions = await ConversationSession.findAll({
        where: { user_id: req.user.id },
        order: [['created_at', 'DESC']],
        limit: 20,
        attributes: ['id', 'session_type', 'messages_count', 'duration_seconds', 'xp_earned', 'created_at'],
      });

      return ApiResponse.success(res, sessions, 'Sessions retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to get sessions.', HTTP_STATUS.INTERNAL_ERROR);
    }
  },

  /**
   * GET /api/ai/sessions/:id
   * Get full conversation session with messages
   */
  async getSession(req, res) {
    try {
      const session = await ConversationSession.findOne({
        where: { id: req.params.id, user_id: req.user.id },
      });

      if (!session) return ApiResponse.error(res, 'Session not found.', HTTP_STATUS.NOT_FOUND);

      return ApiResponse.success(res, session, 'Session retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to get session.', HTTP_STATUS.INTERNAL_ERROR);
    }
  },

  /**
   * POST /api/ai/translate
   * Translate text to Spanish
   */
  async translate(req, res) {
    try {
      const { text } = req.body;
      if (!text) return ApiResponse.error(res, 'Text is required.', HTTP_STATUS.BAD_REQUEST);

      const result = await AiService.translate(text);
      
      // Increment usage with a small token count for translation
      await incrementAiUsage(req.user.id, result.tokensUsed || 30);

      return ApiResponse.success(res, result, 'Translation generated.');
    } catch (error) {
      return ApiResponse.error(res, 'Translation failed.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },
};

module.exports = AiController;
