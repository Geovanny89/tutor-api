'use strict';

const AiService = require('../services/ai.service');
const { ConversationSession, AiUsage } = require('../models');
const { incrementAiUsage } = require('../middlewares/rateLimit.middleware');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../config/constants');

/**
 * AI Controller - MVC Controller layer
 * Handles all AI-powered interactions
 * Protected by checkAiLimit middleware
 */
const AiController = {
  /**
   * POST /api/ai/chat
   * Send a message to the AI English tutor
   * This is the main conversational endpoint
   * 
   * Body: { message, session_id, level, context }
   */
  async chat(req, res) {
    try {
      const { message, session_id, context = '' } = req.body;
      const userId = req.user.id;
      const level = req.user.current_level;

      if (!message || message.trim().length === 0) {
        return ApiResponse.error(res, 'Please say something! 😊', HTTP_STATUS.BAD_REQUEST);
      }

      if (message.length > 2000) {
        return ApiResponse.error(res, 'Message too long. Keep it under 2000 characters.', HTTP_STATUS.BAD_REQUEST);
      }

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

      // Generate AI response
      const { text, tokensUsed, fromCache, provider } = await AiService.generateResponse(
        message,
        level,
        history,
        context
      );

      // Save to conversation session
      const userMsg = { role: 'user', text: message, timestamp: new Date().toISOString() };
      const aiMsg = { role: 'ai', text, timestamp: new Date().toISOString() };

      if (!session) {
        // Create new session
        session = await ConversationSession.create({
          user_id: userId,
          session_type: 'lesson_practice',
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
      if (!fromCache) {
        await incrementAiUsage(userId, tokensUsed);
      }

      return ApiResponse.success(res, {
        reply: text,
        message: text,
        text,
        session_id: session.id,
        provider,
        from_cache: fromCache,
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
   */
  async gradeAnswer(req, res) {
    try {
      const { student_answer, expected_answer } = req.body;
      const level = req.user.current_level;

      if (!student_answer || !expected_answer) {
        return ApiResponse.error(res, 'Student answer and expected answer are required.', HTTP_STATUS.BAD_REQUEST);
      }

      const result = await AiService.gradeAnswer(student_answer, expected_answer, level);

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

      const result = await AiService.explainLessonConcept(
        lesson_title || 'English Concept',
        grammar_rule || '',
        question || '',
        userLevel
      );

      return ApiResponse.success(res, {
        explanation: result.text,
        tokens_used: result.tokensUsed,
      }, 'Lesson explanation generated.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to generate explanation.', HTTP_STATUS.INTERNAL_ERROR, error.message);
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

      const dailyLimit = parseInt(process.env.AI_DAILY_LIMIT) || 20;
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
};

module.exports = AiController;
