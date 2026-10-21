'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { AGE_RANGES, SUBJECTS } = require('../config/constants');

/**
 * Lesson Model
 * Each lesson belongs to a Module and contains structured content
 * No AI tokens are used in lessons - content is pre-built
 */
const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  module_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'modules', key: 'id' },
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'null = lección global (plantilla); con valor = lección propia de una academia',
  },
  age_range: {
    type: DataTypes.ENUM(...Object.values(AGE_RANGES)),
    allowNull: true,
    comment: 'Segmento de edad al que apunta la lección',
  },
  subject: {
    type: DataTypes.ENUM(...Object.values(SUBJECTS)),
    allowNull: true,
    comment: 'Materia de la lección',
  },
  situation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Escenario/situación para la IA (columna CSV: situacion)',
  },
  teacher_prompt: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Prompt/instrucción adicional definida por el profesor (CSV: prompt_profesor)',
  },
  source: {
    type: DataTypes.ENUM('global', 'csv', 'manual'),
    defaultValue: 'manual',
    comment: 'Origen de la lección para trazabilidad',
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  subtitle: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  order_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // ── Content Structure (JSON) ──────────────────────────────────────────────
  // Each lesson has sections: intro, vocabulary, dialogue, grammar, practice
  content: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: `
      {
        "intro": { "text": "...", "audio_text": "..." },
        "vocabulary": [{ "word": "hello", "translation": "hola", "example": "Hello, how are you?" }],
        "dialogue": [
          { "speaker": "Gema", "text": "Hi! How are you today?", "translation": "¡Hola! ¿Cómo estás hoy?" },
          { "speaker": "Student", "text": "I am fine, thank you!", "translation": "¡Estoy bien, gracias!" }
        ],
        "grammar": { "rule": "...", "examples": [...] },
        "practice": [{ "type": "fill_blank", "question": "...", "answer": "..." }]
      }
    `,
  },
  // ── Lesson Metadata ───────────────────────────────────────────────────────
  duration_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  xp_reward: {
    type: DataTypes.INTEGER,
    defaultValue: 20,
  },
  icon: {
    type: DataTypes.STRING(10),
    defaultValue: '🎯',
  },
  requires_voice: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this lesson requires microphone',
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'lessons',
});

module.exports = Lesson;
