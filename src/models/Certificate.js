'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Certificate Model
 * Dinámicamente generado al completar un módulo. Incluye un código único
 * verificable públicamente (CERT-XXXX) y los datos para el PDF.
 */
const Certificate = sequelize.define('Certificate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    comment: 'Código público de verificación (ej. CERT-8F3K-2026)',
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Academia emisora (para branding); null = marca KDice',
  },
  module_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  student_name: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  academy_name: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  subject: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  level: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Nivel MCER alcanzado (A1..C2)',
  },
  hours: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Horas de práctica certificadas',
  },
  issued_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  meta: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
}, {
  tableName: 'certificates',
});

module.exports = Certificate;
