'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Tenant Model - Multitenancy support
 * Each tenant represents a school, organization, or independent group
 * Students and admins belong to a tenant
 */
const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { len: [2, 100] },
  },
  slug: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: { is: /^[a-z0-9-]+$/ },
    comment: 'URL-friendly identifier (e.g., "my-school")',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Short description shown on the public academy page',
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'User id of the professor/institute that owns this academy',
  },
  logo_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  primary_color: {
    type: DataTypes.STRING(7),
    defaultValue: '#6C63FF',
    comment: 'Brand color hex code',
  },
  contact_email: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  contact_phone: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  // ── Which age segments this academy offers (kids / teens / adults) ─────────
  enabled_age_ranges: {
    type: DataTypes.JSON,
    defaultValue: ['kids', 'teens', 'adults'],
    comment: 'Age ranges the academy makes available to its students',
  },
  is_public_page_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether the public slug page accepts new registrations',
  },
  ai_daily_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    comment: 'Límite diario de IA de la academia (lo define la plataforma)',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  max_students: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
  },
  subscription_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'tenants',
});

module.exports = Tenant;
