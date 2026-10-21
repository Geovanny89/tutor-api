'use strict';

const multer = require('multer');

/**
 * Upload Middleware
 * Configura multer en memoria para:
 *  - Importación de lecciones por CSV (profesor)
 *  - Subida de logo de la academia
 * Los archivos no se guardan en disco: se procesan en memoria (buffer).
 */

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.toLowerCase().endsWith('.csv');
    if (!ok) return cb(new Error('Solo se permiten archivos .csv'));
    cb(null, true);
  },
});

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Solo se permiten imágenes'));
    cb(null, true);
  },
});

module.exports = { csvUpload, imageUpload };
