'use strict';

const { Op } = require('sequelize');
const { Tenant } = require('../models');
const { ROLES } = require('../config/constants');

/**
 * Tenant scoping helpers shared by academia / profesor controllers.
 */

/**
 * Devuelve la academia que administra el usuario (por ownership o pertenencia).
 * El super admin no tiene academia propia: devuelve null.
 * @param {object} user
 * @returns {Promise<object|null>}
 */
const findManagedAcademy = async (user) => {
  if (user.role === ROLES.SUPER_ADMIN) return null;
  return Tenant.findOne({
    where: {
      [Op.or]: [{ owner_id: user.id }, { id: user.tenant_id || null }],
    },
  });
};

/** Convierte un texto en slug URL-friendly */
const slugify = (text) =>
  String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);

/** Genera un slug único añadiendo sufijo numérico si hace falta */
const uniqueSlug = async (base) => {
  const safeBase = base || 'academia';
  let slug = safeBase;
  let i = 1;
  while (await Tenant.findOne({ where: { slug } })) {
    slug = `${safeBase}-${i}`;
    i += 1;
  }
  return slug;
};

module.exports = { findManagedAcademy, slugify, uniqueSlug };
