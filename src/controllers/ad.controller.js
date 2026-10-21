'use strict';

const { Advertisement, AdView, AiUsage, User } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const { resolveDailyLimit } = require('../middlewares/rateLimit.middleware');
const { TOKENS, HTTP_STATUS } = require('../config/constants');

/**
 * Ad Controller
 * Publicidad recompensada:
 *  - 1 video promocional por día → +5 tokens
 *  - hasta 4 videos extra por día → +3 tokens cada uno
 * Los tokens ganados se suman al límite diario de IA del estudiante.
 */

const todayStr = () => new Date().toISOString().split('T')[0];

/**
 * Reinicia el contador de tokens extra si cambió el día.
 * @param {object} user - instancia Sequelize
 */
const refreshDailyBonus = async (user) => {
  const today = todayStr();
  if (user.tokens_last_refill !== today) {
    await user.update({ bonus_tokens: 0, tokens_last_refill: today });
    user.bonus_tokens = 0;
  }
};

/** Resumen de anuncios vistos hoy por un usuario */
const getTodayAdStats = async (userId) => {
  const today = todayStr();
  const views = await AdView.findAll({ where: { user_id: userId, date: today }, raw: true });
  const promo = views.filter((v) => v.kind === 'promo').length;
  const extra = views.filter((v) => v.kind === 'extra').length;
  return { promo, extra, tokens_earned: views.reduce((s, v) => s + (v.reward_tokens || 0), 0) };
};

/** Calcula el estado de tokens del usuario */
const buildTokenStatus = async (user) => {
  const dailyLimit = await resolveDailyLimit(user);
  const today = todayStr();
  const usage = await AiUsage.findOne({ where: { user_id: user.id, date: today } });
  const used = usage?.interactions_count || 0;
  const ads = await getTodayAdStats(user.id);

  return {
    daily_limit: dailyLimit,
    bonus_tokens: user.bonus_tokens || 0,
    used,
    remaining: Math.max(0, dailyLimit - used),
    ads_watched_today: ads,
    can_watch_promo: ads.promo < 1,
    can_watch_extra: ads.extra < TOKENS.MAX_EXTRA_ADS_PER_DAY,
    rewards: {
      promo: TOKENS.PROMO_REWARD,
      extra: TOKENS.EXTRA_REWARD,
      max_extra_per_day: TOKENS.MAX_EXTRA_ADS_PER_DAY,
    },
  };
};

const AdController = {
  /**
   * GET /api/ads
   * Lista los anuncios activos (solo metadatos necesarios para reproducirlos).
   */
  async getAds(req, res) {
    try {
      const ads = await Advertisement.findAll({
        where: { is_active: true },
        attributes: ['id', 'title', 'description', 'video_url', 'image_url', 'cta_url', 'duration_seconds', 'reward_tokens', 'kind', 'order_index'],
        order: [['kind', 'ASC'], ['order_index', 'ASC']],
      });
      return ApiResponse.success(res, { ads }, 'Ads retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve ads.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * GET /api/ads/tokens
   * Estado de tokens del estudiante (incluye bonus ganado por publicidad).
   */
  async getTokenStatus(req, res) {
    try {
      const user = await User.findByPk(req.user.id);
      await refreshDailyBonus(user);
      const status = await buildTokenStatus(user);
      return ApiResponse.success(res, status, 'Token status retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve token status.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/ads/:id/view
   * Registra que el estudiante completó un anuncio y le otorga tokens.
   */
  async recordAdView(req, res) {
    try {
      const user = await User.findByPk(req.user.id);
      await refreshDailyBonus(user);

      const ad = await Advertisement.findByPk(req.params.id);
      if (!ad || !ad.is_active) {
        return ApiResponse.error(res, 'Advertisement not found.', HTTP_STATUS.NOT_FOUND);
      }

      const stats = await getTodayAdStats(user.id);

      if (ad.kind === 'promo' && stats.promo >= 1) {
        return ApiResponse.error(res, 'You already watched today\'s promotional video.', HTTP_STATUS.TOO_MANY_REQUESTS);
      }
      if (ad.kind === 'extra' && stats.extra >= TOKENS.MAX_EXTRA_ADS_PER_DAY) {
        return ApiResponse.error(
          res,
          `Daily ad limit reached (${TOKENS.MAX_EXTRA_ADS_PER_DAY} extra videos). Come back tomorrow!`,
          HTTP_STATUS.TOO_MANY_REQUESTS
        );
      }

      const reward = ad.reward_tokens || (ad.kind === 'promo' ? TOKENS.PROMO_REWARD : TOKENS.EXTRA_REWARD);

      await AdView.create({
        user_id: user.id,
        advertisement_id: ad.id,
        kind: ad.kind,
        date: todayStr(),
        reward_tokens: reward,
      });

      await user.update({ bonus_tokens: (user.bonus_tokens || 0) + reward });
      await ad.update({ impressions_count: (ad.impressions_count || 0) + 1 });

      const status = await buildTokenStatus(user);

      return ApiResponse.success(
        res,
        { reward_tokens: reward, tokens: status },
        `You earned ${reward} tokens! 🎉`,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      return ApiResponse.error(res, 'Failed to record ad view.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },
};

module.exports = AdController;
