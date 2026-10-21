'use strict';

const { AiUsage, Tenant } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Límite diario de IA fijo para las academias: lo define la plataforma y el
 * profesor no puede modificarlo (por eso no se expone en la configuración).
 */
const ACADEMY_AI_DAILY_LIMIT = 30;

/**
 * Resolve the daily AI limit that actually applies to a user.
 * Las academias usan el límite fijo de la plataforma; el resto (plataforma
 * global) usa el límite del tenant o el valor por defecto del .env.
 * Bonus tokens earned by watching ads are added on top of the daily quota.
 * Used by checkAiLimit and by the usage endpoint so both report the same limit.
 * @param {object} user - authenticated user (needs tenant_id and bonus_tokens)
 * @returns {Promise<number>} daily interaction limit
 */
const resolveDailyLimit = async (user) => {
  let dailyLimit = parseInt(process.env.AI_DAILY_LIMIT) || 50;
  if (user?.tenant_id) {
    const tenant = await Tenant.findByPk(user.tenant_id, {
      attributes: ['ai_daily_limit', 'owner_id'],
    });
    if (tenant) {
      dailyLimit = tenant.owner_id ? ACADEMY_AI_DAILY_LIMIT : tenant.ai_daily_limit;
    }
  }
  return dailyLimit + (user?.bonus_tokens || 0);
};

/**
 * AI Rate Limit Middleware
 * Controls daily AI usage per user to protect free API quotas
 * 
 * Strategy:
 * - Check DB for today's usage count
 * - If limit reached, return 429 with friendly message
 * - If OK, increment counter and proceed
 */
const checkAiLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // ── Get tenant-specific limit or use global default ────────────────────
    const dailyLimit = await resolveDailyLimit(req.user);

    // ── Find or create today's usage record ───────────────────────────────
    const [usage, created] = await AiUsage.findOrCreate({
      where: { user_id: userId, date: today },
      defaults: {
        user_id: userId,
        date: today,
        interactions_count: 0,
        tokens_used: 0,
      },
    });

    // ── Check if limit exceeded ────────────────────────────────────────────
    if (usage.interactions_count >= dailyLimit) {
      return ApiResponse.error(
        res,
        `Daily AI limit reached (${dailyLimit} interactions). Come back tomorrow! 🌙`,
        HTTP_STATUS.TOO_MANY_REQUESTS,
        {
          limit: dailyLimit,
          used: usage.interactions_count,
          reset_at: 'Midnight (local time)',
          tip: 'Review your conversation history to keep practicing without AI!',
        }
      );
    }

    // ── Attach usage info to request ──────────────────────────────────────
    req.aiUsage = usage;
    req.aiDailyLimit = dailyLimit;
    req.aiRemaining = dailyLimit - usage.interactions_count;

    next();
  } catch (error) {
    // On error, allow the request (fail open - don't block users on tracking errors)
    console.error('[AI Rate Limit] Error checking limit:', error.message);
    next();
  }
};

/**
 * Increment AI usage after successful AI call
 * Call this after the AI response is generated
 * @param {string} userId
 * @param {number} tokensUsed - Approximate tokens used in this request
 */
const incrementAiUsage = async (userId, tokensUsed = 50) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    await AiUsage.increment(
      { interactions_count: 1, tokens_used: tokensUsed },
      { where: { user_id: userId, date: today } }
    );
    await AiUsage.update(
      { last_interaction_at: new Date() },
      { where: { user_id: userId, date: today } }
    );
  } catch (error) {
    console.error('[AI Rate Limit] Error incrementing usage:', error.message);
  }
};

module.exports = { checkAiLimit, incrementAiUsage, resolveDailyLimit };
