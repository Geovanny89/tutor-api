'use strict';

const { Router } = require('express');
const ModuleController = require('../controllers/module.controller');
const { authenticate, requireSuperAdmin } = require('../middlewares/auth.middleware');

const router = Router();

// All module routes require authentication
router.use(authenticate);

// Student routes
router.get('/', ModuleController.getAll);
router.get('/:id', ModuleController.getById);

// Admin only
router.post('/', ...requireSuperAdmin, ModuleController.create);
router.put('/:id', ...requireSuperAdmin, ModuleController.update);

module.exports = router;
