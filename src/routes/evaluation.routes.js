'use strict';

const { Router } = require('express');
const EvaluationController = require('../controllers/evaluation.controller');
const { authenticate, requireSuperAdmin } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/module/:moduleId', EvaluationController.getByModule);
router.post('/:id/submit', EvaluationController.submit);

router.post('/', ...requireSuperAdmin, EvaluationController.create);
router.delete('/:id', ...requireSuperAdmin, EvaluationController.remove);

module.exports = router;
