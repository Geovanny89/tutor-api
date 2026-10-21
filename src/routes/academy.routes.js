'use strict';

const { Router } = require('express');
const AcademyController = require('../controllers/academy.controller');
const { requireStaff } = require('../middlewares/auth.middleware');
const { imageUpload } = require('../middlewares/upload.middleware');

const router = Router();

// ─── Rutas del profesor/admin (antes de /:slug para evitar colisiones) ────────
router.get('/mine', ...requireStaff, AcademyController.getMyAcademy);
router.post('/', ...requireStaff, AcademyController.createAcademy);
router.put('/mine', ...requireStaff, AcademyController.updateMyAcademy);
router.post('/mine/logo', ...requireStaff, imageUpload.single('logo'), AcademyController.uploadLogo);

// ─── Ruta pública por slug ───────────────────────────────────────────────────
router.get('/:slug', AcademyController.getPublicAcademy);

module.exports = router;
