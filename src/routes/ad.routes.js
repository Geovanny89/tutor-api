'use strict';

const { Router } = require('express');
const AdController = require('../controllers/ad.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/', AdController.getAds);
router.get('/tokens', AdController.getTokenStatus);
router.post('/:id/view', AdController.recordAdView);

module.exports = router;
