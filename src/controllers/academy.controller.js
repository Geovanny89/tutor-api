'use strict';

const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const { Tenant, User, Module, Lesson } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const { findManagedAcademy, slugify, uniqueSlug } = require('../utils/tenantScope');
const { ROLES, AGE_RANGE_ORDER, HTTP_STATUS } = require('../config/constants');

/**
 * Academy Controller
 * - Rutas públicas: consultar una academia por su slug (página de inscripción)
 * - Rutas del profesor: crear/configurar su academia (branding, edades, límites)
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Límite diario de IA que se asigna a cada academia. Lo define la plataforma,
// no el profesor (por eso no forma parte de academySchema).
const DEFAULT_ACADEMY_AI_LIMIT = 30;

const academySchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().allow('', null).max(1000),
  primary_color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
  logo_url: Joi.string().allow('', null),
  contact_email: Joi.string().email().allow('', null),
  contact_phone: Joi.string().allow('', null).max(30),
  enabled_age_ranges: Joi.array().items(Joi.string().valid(...AGE_RANGE_ORDER)),
  max_students: Joi.number().integer().min(1).max(100000),
  is_public_page_active: Joi.boolean(),
}).unknown(false);

/** Proyección pública de una academia (sin datos sensibles) */
const publicProjection = (t) => ({
  id: t.id,
  name: t.name,
  slug: t.slug,
  description: t.description,
  logo_url: t.logo_url,
  primary_color: t.primary_color,
  contact_email: t.contact_email,
  contact_phone: t.contact_phone,
  enabled_age_ranges: t.enabled_age_ranges || AGE_RANGE_ORDER,
  is_public_page_active: t.is_public_page_active,
});

const AcademyController = {
  /**
   * GET /api/academies/:slug  (público)
   * Datos de la academia para su página pública de inscripción.
   */
  async getPublicAcademy(req, res) {
    try {
      const tenant = await Tenant.findOne({ where: { slug: req.params.slug, is_active: true } });
      if (!tenant) return ApiResponse.error(res, 'Academy not found.', HTTP_STATUS.NOT_FOUND);

      const [studentCount, moduleCount, lessonCount, professors] = await Promise.all([
        User.count({ where: { tenant_id: tenant.id, role: ROLES.STUDENT } }),
        Module.count({ where: { tenant_id: tenant.id } }),
        Lesson.count({ where: { tenant_id: tenant.id } }),
        User.findAll({
          where: { tenant_id: tenant.id, role: ROLES.PROFESSOR, is_active: true },
          attributes: ['id', 'name', 'avatar_url'],
          order: [['created_at', 'ASC']],
        }),
      ]);

      return ApiResponse.success(res, {
        academy: publicProjection(tenant),
        professors: professors.map((p) => ({
          id: p.id,
          name: p.name,
          avatar_url: p.avatar_url,
          is_owner: p.id === tenant.owner_id,
        })),
        stats: {
          students: studentCount,
          custom_modules: moduleCount,
          custom_lessons: lessonCount,
          spots_left: Math.max(0, tenant.max_students - studentCount),
        },
      }, 'Academy retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve academy.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * GET /api/academies/mine  (profesor / admin)
   */
  async getMyAcademy(req, res) {
    try {
      if (req.user.role === ROLES.SUPER_ADMIN) {
        // El super admin puede ver cualquier academia con ?tenant_id=
        const tenant = req.query.tenant_id
          ? await Tenant.findByPk(req.query.tenant_id)
          : null;
        return ApiResponse.success(res, { academy: tenant, can_create: true }, 'Academy retrieved.');
      }

      const academy = await findManagedAcademy(req.user);
      return ApiResponse.success(
        res,
        { academy, can_create: !academy },
        academy ? 'Academy retrieved.' : 'You do not have an academy yet.'
      );
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve academy.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/academies  (profesor / admin)
   * Crea la academia del profesor y la vincula como owner.
   */
  async createAcademy(req, res) {
    try {
      const existing = await findManagedAcademy(req.user);
      if (existing) {
        return ApiResponse.error(res, 'You already have an academy.', HTTP_STATUS.CONFLICT);
      }

      const { error, value } = academySchema.validate(req.body, { abortEarly: false });
      if (error) {
        return ApiResponse.error(res, error.details.map((d) => d.message).join('. '), HTTP_STATUS.BAD_REQUEST);
      }
      if (!value.name) {
        return ApiResponse.error(res, 'Academy name is required.', HTTP_STATUS.BAD_REQUEST);
      }

      const baseSlug = slugify(value.name);
      const slug = await uniqueSlug(baseSlug);

      const academy = await Tenant.create({
        name: value.name,
        slug,
        description: value.description || null,
        logo_url: value.logo_url || null,
        primary_color: value.primary_color || '#6C63FF',
        contact_email: value.contact_email || req.user.email,
        contact_phone: value.contact_phone || null,
        enabled_age_ranges: value.enabled_age_ranges || AGE_RANGE_ORDER,
        // El límite de IA lo fija la plataforma; el profesor no puede modificarlo.
        ai_daily_limit: DEFAULT_ACADEMY_AI_LIMIT,
        max_students: value.max_students || 100,
        owner_id: req.user.id,
      });

      // Vincular al profesor con su academia
      if (!req.user.tenant_id) {
        await req.user.update({ tenant_id: academy.id });
      }

      return ApiResponse.success(res, { academy }, 'Academy created successfully! 🎉', HTTP_STATUS.CREATED);
    } catch (error) {
      return ApiResponse.error(res, 'Failed to create academy.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * PUT /api/academies/mine  (profesor / admin)
   */
  async updateMyAcademy(req, res) {
    try {
      const academy = await findManagedAcademy(req.user);
      if (!academy) return ApiResponse.error(res, 'Academy not found.', HTTP_STATUS.NOT_FOUND);

      const { error, value } = academySchema.validate(req.body, { abortEarly: false });
      if (error) {
        return ApiResponse.error(res, error.details.map((d) => d.message).join('. '), HTTP_STATUS.BAD_REQUEST);
      }

      await academy.update({
        ...(value.name && { name: value.name }),
        ...(value.description !== undefined && { description: value.description }),
        ...(value.primary_color && { primary_color: value.primary_color }),
        ...(value.logo_url !== undefined && { logo_url: value.logo_url }),
        ...(value.contact_email !== undefined && { contact_email: value.contact_email }),
        ...(value.contact_phone !== undefined && { contact_phone: value.contact_phone }),
        ...(value.enabled_age_ranges && { enabled_age_ranges: value.enabled_age_ranges }),
        ...(value.max_students && { max_students: value.max_students }),
        ...(value.is_public_page_active !== undefined && { is_public_page_active: value.is_public_page_active }),
      });

      return ApiResponse.success(res, { academy }, 'Academy updated successfully.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to update academy.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/academies/mine/logo
   * Upload and set academy logo
   */
  async uploadLogo(req, res) {
    try {
      const academy = await findManagedAcademy(req.user);
      if (!academy) return ApiResponse.error(res, 'Academy not found.', HTTP_STATUS.NOT_FOUND);

      if (!req.file) {
        return ApiResponse.error(res, 'No logo file provided.', HTTP_STATUS.BAD_REQUEST);
      }

      // Generate filename: logo-[tenantId]-[timestamp].[ext]
      const ext = path.extname(req.file.originalname) || '.png';
      const filename = `logo-${academy.id}-${Date.now()}${ext}`;
      const uploadPath = path.join(__dirname, '../../public/uploads/logos', filename);

      // Save file
      fs.writeFileSync(uploadPath, req.file.buffer);

      // Delete old logo if it was a local file
      if (academy.logo_url && academy.logo_url.includes('/uploads/logos/')) {
        try {
          const oldFilename = academy.logo_url.split('/').pop();
          const oldPath = path.join(__dirname, '../../public/uploads/logos', oldFilename);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (err) {
          console.warn('Could not delete old logo:', err.message);
        }
      }

      // Update academy
      const logoUrl = `${process.env.API_URL || 'http://localhost:3001'}/uploads/logos/${filename}`;
      await academy.update({ logo_url: logoUrl });

      return ApiResponse.success(res, { logo_url: logoUrl }, 'Logo uploaded successfully.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to upload logo.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },
};

module.exports = AcademyController;
