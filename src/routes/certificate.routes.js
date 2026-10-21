'use strict';

const { Router } = require('express');
const CertificateController = require('../controllers/certificate.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

// ─── Rutas públicas (verificación) ───────────────────────────────────────────
router.get('/verify/:code', CertificateController.verify);
router.get('/:code/pdf', CertificateController.downloadPdf);

// ─── Rutas autenticadas ──────────────────────────────────────────────────────
router.get('/mine', authenticate, CertificateController.listMine);
router.post('/', authenticate, CertificateController.issue);

module.exports = router;
