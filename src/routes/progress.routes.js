'use strict';

const { Router } = require('express');
const ProgressController = require('../controllers/progress.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/', ProgressController.getMyProgress);
router.get('/leaderboard', ProgressController.getLeaderboard);

module.exports = router;
