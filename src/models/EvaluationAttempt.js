'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * EvaluationAttempt Model
 * Intento de evaluación con tiempo límite controlado desde el servidor.
 * El profesor define el tiempo en la evaluación; aquí se guarda el inicio,
 * el vencimiento y el resultado para que el tiempo no pueda manipularse.
 */
const EvaluationAttempt = sequelize.define('EvaluationAttempt', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  evaluation_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'evaluations', key: 'id' },
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Porcentaje obtenido (0-100)',
  },
  passed: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  timed_out: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  answers: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  tableName: 'evaluation_attempts',
});

module.exports = EvaluationAttempt;
