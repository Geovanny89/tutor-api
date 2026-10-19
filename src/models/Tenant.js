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
  logo_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  primary_color: {
    type: DataTypes.STRING(7),
    defaultValue: '#6C63FF',
    comment: 'Brand color hex code',
  },
  ai_daily_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 20,
    comment: 'Override global AI daily limit per tenant',
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
