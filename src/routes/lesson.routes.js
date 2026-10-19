'use strict';

const { Router } = require('express');
const LessonController = require('../controllers/lesson.controller');
const { authenticate, requireSuperAdmin } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/:id', LessonController.getById);
router.post('/:id/complete', LessonController.complete);

router.post('/', ...requireSuperAdmin, LessonController.create);
router.put('/:id', ...requireSuperAdmin, LessonController.update);

module.exports = router;
