'use strict';

const { Router } = require('express');
const AiController = require('../controllers/ai.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkAiLimit } = require('../middlewares/rateLimit.middleware');

const router = Router();

router.use(authenticate);

// Usage stats (no AI limit needed)
router.get('/usage', AiController.getUsage);
router.get('/sessions', AiController.getSessions);
router.get('/sessions/:id', AiController.getSession);

// AI interactions (rate limited)
router.post('/chat', checkAiLimit, AiController.chat);
router.post('/grade', checkAiLimit, AiController.gradeAnswer);
router.post('/explain', checkAiLimit, AiController.explainConcept);

module.exports = router;
