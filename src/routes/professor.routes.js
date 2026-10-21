'use strict';

const { Router } = require('express');
const ProfessorController = require('../controllers/professor.controller');
const { requireStaff } = require('../middlewares/auth.middleware');
const { csvUpload } = require('../middlewares/upload.middleware');

const router = Router();

router.use(...requireStaff);

// Panel
router.get('/overview', ProfessorController.getOverview);

// Estudiantes
router.get('/students', ProfessorController.getStudents);
router.get('/students/:id', ProfessorController.getStudentDetail);
router.put('/students/:id/status', ProfessorController.setStudentStatus);

// Módulos y lecciones propios
router.get('/modules', ProfessorController.getModules);
router.post('/modules', ProfessorController.createModule);
router.put('/modules/:id', ProfessorController.updateModule);
router.delete('/modules/:id', ProfessorController.deleteModule);
router.post('/modules/:id/clone', ProfessorController.cloneModule);
router.post('/lessons', ProfessorController.createLesson);
router.post('/lessons/import', csvUpload.single('file'), ProfessorController.importLessonsCSV);
router.delete('/lessons/:id', ProfessorController.deleteLesson);

// Evaluaciones con tiempo estipulado
router.put('/modules/:id/evaluation', ProfessorController.upsertEvaluation);

module.exports = router;
