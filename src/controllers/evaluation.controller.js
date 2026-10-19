'use strict';

const { Evaluation, UserProgress, User, Module } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS, PROGRESS_STATUS, EVALUATION } = require('../config/constants');

/**
 * Evaluation Controller - MVC Controller layer
 * Handles module evaluations - required to advance to next module
 * No AI tokens used in evaluations - all questions are pre-built
 */
const EvaluationController = {
  /**
   * GET /api/evaluations/:moduleId
   * Get evaluation for a module
   */
  async getByModule(req, res) {
    try {
      const evaluation = await Evaluation.findOne({
        where: { module_id: req.params.moduleId, is_published: true },
        include: [{ model: Module, as: 'module', attributes: ['id', 'level', 'name'] }],
      });

      if (!evaluation) {
        return ApiResponse.error(res, 'Evaluation not found for this module.', HTTP_STATUS.NOT_FOUND);
      }

      // Check attempts
      const progress = await UserProgress.findOne({
        where: { user_id: req.user.id, evaluation_id: evaluation.id },
      });

      if (progress && progress.attempts >= evaluation.max_attempts && progress.status !== PROGRESS_STATUS.COMPLETED) {
        const nextAttemptDate = new Date(progress.updated_at);
        nextAttemptDate.setHours(nextAttemptDate.getHours() + EVALUATION.COOLDOWN_HOURS);

        return ApiResponse.error(res, 
          `Maximum attempts (${evaluation.max_attempts}) reached. Try again after ${nextAttemptDate.toLocaleDateString()}.`,
          HTTP_STATUS.FORBIDDEN,
          { next_attempt_at: nextAttemptDate }
        );
      }

      // Return evaluation WITHOUT correct answers (security!)
      const evalData = evaluation.toJSON();
      evalData.questions = evalData.questions.map(({ correct, ...q }) => q);

      return ApiResponse.success(res, {
        ...evalData,
        previous_attempts: progress?.attempts || 0,
        previous_score: progress?.score || null,
        already_passed: progress?.score >= evaluation.min_pass_score,
      }, 'Evaluation loaded. Good luck! 🍀');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to load evaluation.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/evaluations/:id/submit
   * Submit evaluation answers and get results
   * Automatically advances student level if passed
   */
  async submit(req, res) {
    try {
      const { answers } = req.body; // [{ question_id, answer }]
      const userId = req.user.id;

      if (!answers || !Array.isArray(answers)) {
        return ApiResponse.error(res, 'Answers array is required.', HTTP_STATUS.BAD_REQUEST);
      }

      const evaluation = await Evaluation.findByPk(req.params.id, {
        include: [{ model: Module, as: 'module', attributes: ['id', 'level', 'order_index'] }],
      });

      if (!evaluation) return ApiResponse.error(res, 'Evaluation not found.', HTTP_STATUS.NOT_FOUND);

      // Check/create progress record
      const [progress, created] = await UserProgress.findOrCreate({
        where: { user_id: userId, evaluation_id: evaluation.id },
        defaults: {
          user_id: userId,
          evaluation_id: evaluation.id,
          module_id: evaluation.module_id,
          status: PROGRESS_STATUS.IN_PROGRESS,
          attempts: 0,
        },
      });

      // Check max attempts
      if (progress.attempts >= evaluation.max_attempts && progress.status !== PROGRESS_STATUS.COMPLETED) {
        return ApiResponse.error(res, 'Maximum attempts reached.', HTTP_STATUS.FORBIDDEN);
      }

      // ── Grade the evaluation ────────────────────────────────────────────
      let earnedPoints = 0;
      const totalPoints = evaluation.total_points;
      const results = [];

      for (const question of evaluation.questions) {
        const studentAnswer = answers.find((a) => a.question_id === question.id);
        let isCorrect = false;
        let studentValue = studentAnswer?.answer;

        if (studentAnswer) {
          if (question.type === 'multiple_choice') {
            isCorrect = parseInt(studentValue) === parseInt(question.correct);
          } else if (question.type === 'fill_blank') {
            isCorrect = studentValue?.toLowerCase().trim() === question.correct?.toLowerCase().trim();
          } else if (question.type === 'speaking') {
            // For speaking: check if required words are in the transcription
            const requiredWords = question.expected_words || [];
            const spokenText = (studentValue || '').toLowerCase();
            const foundWords = requiredWords.filter((w) => spokenText.includes(w.toLowerCase()));
            isCorrect = requiredWords.length === 0 || foundWords.length >= Math.ceil(requiredWords.length * 0.7);
          }
        }

        if (isCorrect) earnedPoints += question.points || 10;

        results.push({
          question_id: question.id,
          question: question.question,
          student_answer: studentValue,
          correct_answer: question.correct,
          is_correct: isCorrect,
          points_earned: isCorrect ? (question.points || 10) : 0,
          explanation: question.explanation || null,
        });
      }

      const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const passed = scorePercent >= evaluation.min_pass_score;

      // ── Update progress ────────────────────────────────────────────────
      await progress.update({
        status: passed ? PROGRESS_STATUS.COMPLETED : PROGRESS_STATUS.IN_PROGRESS,
        score: scorePercent,
        attempts: (progress.attempts || 0) + 1,
        answers: answers,
        feedback: passed
          ? 'Congratulations! You passed! 🎉'
          : `Keep studying! You need ${evaluation.min_pass_score}% to pass.`,
        completed_at: passed ? new Date() : null,
        xp_earned: passed ? 100 : 0,
      });

      // ── If passed: advance student level ──────────────────────────────
      if (passed) {
        const { LEVEL_ORDER } = require('../config/constants');
        const currentLevelIndex = LEVEL_ORDER.indexOf(req.user.current_level);
        const moduleLevel = evaluation.module?.level;
        const moduleLevelIndex = LEVEL_ORDER.indexOf(moduleLevel);

        if (moduleLevelIndex >= currentLevelIndex) {
          const nextLevel = LEVEL_ORDER[moduleLevelIndex + 1];
          if (nextLevel) {
            await User.update({ current_level: nextLevel }, { where: { id: userId } });
          }
        }

        // Award XP
        await User.increment({ total_xp: 100 }, { where: { id: userId } });
      }

      return ApiResponse.success(res, {
        score: scorePercent,
        passed,
        earned_points: earnedPoints,
        total_points: totalPoints,
        min_pass_score: evaluation.min_pass_score,
        attempts: progress.attempts + 1,
        max_attempts: evaluation.max_attempts,
        results,
        xp_earned: passed ? 100 : 0,
      }, passed
        ? `You passed! Score: ${scorePercent}% 🏆`
        : `Score: ${scorePercent}%. You need ${evaluation.min_pass_score}% to pass. Keep going! 💪`
      );
    } catch (error) {
      return ApiResponse.error(res, 'Failed to submit evaluation.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/evaluations (super_admin only)
   * Creates the module evaluation. If the module already has one, it is updated.
   */
  async create(req, res) {
    try {
      const { module_id } = req.body;
      if (!module_id) return ApiResponse.error(res, 'module_id is required.', HTTP_STATUS.BAD_REQUEST);

      const existing = await Evaluation.findOne({ where: { module_id } });

      if (existing) {
        await existing.update(req.body);
        return ApiResponse.success(res, existing, 'Evaluation updated.');
      }

      const evaluation = await Evaluation.create(req.body);
      return ApiResponse.success(res, evaluation, 'Evaluation created.', HTTP_STATUS.CREATED);
    } catch (error) {
      return ApiResponse.error(res, 'Failed to save evaluation.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * DELETE /api/evaluations/:id (super_admin only)
   */
  async remove(req, res) {
    try {
      const evaluation = await Evaluation.findByPk(req.params.id);
      if (!evaluation) return ApiResponse.error(res, 'Evaluation not found.', HTTP_STATUS.NOT_FOUND);

      await UserProgress.destroy({ where: { evaluation_id: evaluation.id }, force: true });
      await evaluation.destroy({ force: true });

      return ApiResponse.success(res, { id: evaluation.id }, 'Evaluation deleted.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to delete evaluation.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },
};

module.exports = EvaluationController;
