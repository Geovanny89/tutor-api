'use strict';

const { Evaluation, UserProgress, User, Module, EvaluationAttempt } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS, PROGRESS_STATUS, EVALUATION } = require('../config/constants');

/**
 * Califica las respuestas de una evaluación.
 * Compartido entre el envío normal y el envío de intentos cronometrados.
 * @param {object} evaluation
 * @param {Array<{question_id:string, answer:*}>} answers
 * @returns {{earnedPoints:number, totalPoints:number, scorePercent:number, passed:boolean, results:Array}}
 */
const gradeEvaluation = (evaluation, answers) => {
  let earnedPoints = 0;
  const totalPoints = evaluation.total_points || 100;
  const results = [];

  for (const question of evaluation.questions) {
    const studentAnswer = answers.find((a) => a.question_id === question.id);
    let isCorrect = false;
    const studentValue = studentAnswer?.answer;

    if (studentAnswer) {
      if (question.type === 'multiple_choice') {
        isCorrect = parseInt(studentValue) === parseInt(question.correct);
      } else if (question.type === 'fill_blank') {
        isCorrect = studentValue?.toLowerCase().trim() === question.correct?.toLowerCase().trim();
      } else if (question.type === 'speaking') {
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
  return {
    earnedPoints,
    totalPoints,
    scorePercent,
    passed: scorePercent >= evaluation.min_pass_score,
    results,
  };
};

/**
 * Actualiza el progreso del estudiante tras calificar una evaluación y,
 * si aprueba, avanza su nivel MCER y otorga XP.
 * @param {object} user - usuario autenticado
 * @param {object} evaluation
 * @param {{scorePercent:number, passed:boolean, answers:Array}} result
 * @returns {Promise<object>} registro de progreso actualizado
 */
const applyEvaluationResult = async (user, evaluation, { scorePercent, passed, answers }) => {
  const [progress] = await UserProgress.findOrCreate({
    where: { user_id: user.id, evaluation_id: evaluation.id },
    defaults: {
      user_id: user.id,
      evaluation_id: evaluation.id,
      module_id: evaluation.module_id,
      status: PROGRESS_STATUS.IN_PROGRESS,
      attempts: 0,
    },
  });

  await progress.update({
    status: passed ? PROGRESS_STATUS.COMPLETED : PROGRESS_STATUS.IN_PROGRESS,
    score: scorePercent,
    attempts: (progress.attempts || 0) + 1,
    answers,
    feedback: passed
      ? 'Congratulations! You passed! 🎉'
      : `Keep studying! You need ${evaluation.min_pass_score}% to pass.`,
    completed_at: passed ? new Date() : null,
    xp_earned: passed ? 100 : 0,
  });

  if (passed) {
    const { LEVEL_ORDER } = require('../config/constants');
    const currentLevelIndex = LEVEL_ORDER.indexOf(user.current_level);
    const moduleLevelIndex = LEVEL_ORDER.indexOf(evaluation.module?.level);
    if (moduleLevelIndex >= currentLevelIndex) {
      const nextLevel = LEVEL_ORDER[moduleLevelIndex + 1];
      if (nextLevel) await User.update({ current_level: nextLevel }, { where: { id: user.id } });
    }
    await User.increment({ total_xp: 100 }, { where: { id: user.id } });
  }

  return progress;
};

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
      const { earnedPoints, totalPoints, scorePercent, passed, results } = gradeEvaluation(evaluation, answers);

      // ── Update progress & advance level if passed ──────────────────────
      const updatedProgress = await applyEvaluationResult(req.user, evaluation, { scorePercent, passed, answers });

      return ApiResponse.success(res, {
        score: scorePercent,
        passed,
        earned_points: earnedPoints,
        total_points: totalPoints,
        min_pass_score: evaluation.min_pass_score,
        attempts: updatedProgress.attempts,
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
   * POST /api/evaluations/:id/attempt
   * Inicia (o reanuda) un intento cronometrado.
   * El tiempo límite se controla en el servidor (no puede manipularse desde el cliente).
   */
  async startAttempt(req, res) {
    try {
      const evaluation = await Evaluation.findByPk(req.params.id, {
        include: [{ model: Module, as: 'module', attributes: ['id', 'level', 'order_index'] }],
      });
      if (!evaluation) return ApiResponse.error(res, 'Evaluation not found.', HTTP_STATUS.NOT_FOUND);

      const now = new Date();

      // Reanudar un intento en curso no vencido
      const existing = await EvaluationAttempt.findOne({
        where: { user_id: req.user.id, evaluation_id: evaluation.id, submitted_at: null },
        order: [['created_at', 'DESC']],
      });

      if (existing && new Date(existing.expires_at) > now) {
        return ApiResponse.success(res, {
          attempt_id: existing.id,
          server_now: now.toISOString(),
          started_at: existing.started_at,
          expires_at: existing.expires_at,
          remaining_seconds: Math.max(0, Math.floor((new Date(existing.expires_at) - now) / 1000)),
          time_limit_minutes: evaluation.time_limit_minutes,
          resumed: true,
        }, 'Attempt resumed.');
      }

      const expiresAt = new Date(now.getTime() + evaluation.time_limit_minutes * 60 * 1000);
      const attempt = await EvaluationAttempt.create({
        user_id: req.user.id,
        evaluation_id: evaluation.id,
        started_at: now,
        expires_at: expiresAt,
      });

      return ApiResponse.success(res, {
        attempt_id: attempt.id,
        server_now: now.toISOString(),
        started_at: attempt.started_at,
        expires_at: attempt.expires_at,
        remaining_seconds: evaluation.time_limit_minutes * 60,
        time_limit_minutes: evaluation.time_limit_minutes,
        resumed: false,
      }, 'Attempt started. Good luck! 🍀', HTTP_STATUS.CREATED);
    } catch (error) {
      return ApiResponse.error(res, 'Failed to start attempt.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/evaluations/attempts/:attemptId/submit
   * Envía las respuestas de un intento cronometrado. Valida el tiempo en servidor.
   */
  async submitAttempt(req, res) {
    try {
      const { answers } = req.body;
      if (!answers || !Array.isArray(answers)) {
        return ApiResponse.error(res, 'Answers array is required.', HTTP_STATUS.BAD_REQUEST);
      }

      const attempt = await EvaluationAttempt.findOne({
        where: { id: req.params.attemptId, user_id: req.user.id },
      });
      if (!attempt) return ApiResponse.error(res, 'Attempt not found.', HTTP_STATUS.NOT_FOUND);
      if (attempt.submitted_at) {
        return ApiResponse.error(res, 'This attempt was already submitted.', HTTP_STATUS.CONFLICT);
      }

      const evaluation = await Evaluation.findByPk(attempt.evaluation_id, {
        include: [{ model: Module, as: 'module', attributes: ['id', 'level', 'order_index'] }],
      });
      if (!evaluation) return ApiResponse.error(res, 'Evaluation not found.', HTTP_STATUS.NOT_FOUND);

      const now = new Date();
      const timedOut = now > new Date(attempt.expires_at);

      const { earnedPoints, totalPoints, scorePercent, passed, results } = gradeEvaluation(evaluation, answers);

      await attempt.update({
        submitted_at: now,
        score: scorePercent,
        passed,
        timed_out: timedOut,
        answers,
      });

      await applyEvaluationResult(req.user, evaluation, { scorePercent, passed, answers });

      return ApiResponse.success(res, {
        score: scorePercent,
        passed,
        timed_out: timedOut,
        earned_points: earnedPoints,
        total_points: totalPoints,
        min_pass_score: evaluation.min_pass_score,
        results,
        xp_earned: passed ? 100 : 0,
      }, timedOut
        ? `Time is up! Score: ${scorePercent}%.`
        : passed
          ? `You passed! Score: ${scorePercent}% 🏆`
          : `Score: ${scorePercent}%. You need ${evaluation.min_pass_score}% to pass.`
      );
    } catch (error) {
      return ApiResponse.error(res, 'Failed to submit attempt.', HTTP_STATUS.INTERNAL_ERROR, error.message);
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
