'use strict';

const { Router } = require('express');
const AdminController = require('../controllers/admin.controller');
const { requireAdmin } = require('../middlewares/auth.middleware');

const router = Router();

// Every admin route requires a valid token + admin role
router.use(...requireAdmin);

router.get('/stats', AdminController.getStats);
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserDetail);
router.put('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);

module.exports = router;
