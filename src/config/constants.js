'use strict';

/**
 * Application-wide constants
 * Centralized to avoid magic strings/numbers scattered throughout codebase
 */

// ─── User Roles ───────────────────────────────────────────────────────────────
const ROLES = {
  SUPER_ADMIN: 'super_admin',  // Tú - acceso total a toda la plataforma
  TENANT_ADMIN: 'tenant_admin', // Admin de cada organización/escuela (academia)
  PROFESSOR: 'professor',      // Profesor/instituto dueño de una academia (slug)
  STUDENT: 'student',          // Estudiante
};

// Roles con acceso a paneles de gestión (cualquier nivel de administración)
const STAFF_ROLES = [ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN, ROLES.PROFESSOR];

// ─── Age Ranges (segmentación pedagógica) ─────────────────────────────────────
const AGE_RANGES = {
  KIDS: 'kids',     // 3 a 7 años - iniciación con dibujos y frases cortas
  TEENS: 'teens',   // 8 a 16 años - juegos de roles y misiones
  ADULTS: 'adults', // 17 en adelante - interactivo y profesional
};

const AGE_RANGE_LABELS = {
  kids: 'Niños (3-7 años)',
  teens: 'Adolescentes (8-16 años)',
  adults: 'Adultos (17+ años)',
};

const AGE_RANGE_ORDER = ['kids', 'teens', 'adults'];

// ─── Subjects (materias administrables por el profesor) ───────────────────────
const SUBJECTS = {
  ENGLISH: 'english',
  MATH: 'math',
  PROGRAMMING: 'programming',
};

// ─── Token Economy (IA + publicidad recompensada) ─────────────────────────────
const TOKENS = {
  PROMO_REWARD: 5,        // Ver 1 video promocional → +5 tokens
  EXTRA_REWARD: 3,        // Ver videos de relleno → +3 tokens c/u
  MAX_EXTRA_ADS_PER_DAY: 4, // Máximo de videos extra recompensados por día
  AD_DURATION_SECONDS: 45, // Duración aproximada de cada anuncio
};

// ─── English Levels (CEFR) ────────────────────────────────────────────────────
const LEVELS = {
  A1: 'A1',
  A2: 'A2',
  B1: 'B1',
  B2: 'B2',
  C1: 'C1',
  C2: 'C2',
};

const LEVEL_NAMES = {
  A1: 'Absolute Beginner',
  A2: 'Elementary',
  B1: 'Pre-Intermediate',
  B2: 'Intermediate',
  C1: 'Upper-Intermediate',
  C2: 'Mastery',
};

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// ─── Exercise Types ───────────────────────────────────────────────────────────
const EXERCISE_TYPES = {
  SPEAKING: 'speaking',       // Pronunciación con Web Speech API
  LISTENING: 'listening',     // Escuchar y responder
  GRAMMAR: 'grammar',         // Ejercicio gramatical
  VOCABULARY: 'vocabulary',   // Vocabulario
  CONVERSATION: 'conversation', // Chat con IA
  READING: 'reading',         // Comprensión lectora
  WRITING: 'writing',         // Escritura corta
};

// ─── Evaluation Pass Threshold ────────────────────────────────────────────────
const EVALUATION = {
  MIN_PASS_SCORE: 70,  // % mínimo para avanzar al siguiente módulo
  MAX_ATTEMPTS: 3,     // Intentos máximos por evaluación
  COOLDOWN_HOURS: 24,  // Horas de espera después de agotar intentos
};

// ─── Progress Statuses ────────────────────────────────────────────────────────
const PROGRESS_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  LOCKED: 'locked',
};

// ─── Achievement Types ────────────────────────────────────────────────────────
const ACHIEVEMENTS = {
  FIRST_LESSON: 'first_lesson',
  LEVEL_COMPLETE: 'level_complete',
  STREAK_7: 'streak_7',
  STREAK_30: 'streak_30',
  PERFECT_SCORE: 'perfect_score',
  VOICE_MASTER: 'voice_master',
};

// ─── API Response Codes ───────────────────────────────────────────────────────
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
};

module.exports = {
  ROLES,
  STAFF_ROLES,
  AGE_RANGES,
  AGE_RANGE_LABELS,
  AGE_RANGE_ORDER,
  SUBJECTS,
  TOKENS,
  LEVELS,
  LEVEL_NAMES,
  LEVEL_ORDER,
  EXERCISE_TYPES,
  EVALUATION,
  PROGRESS_STATUS,
  ACHIEVEMENTS,
  HTTP_STATUS,
};
