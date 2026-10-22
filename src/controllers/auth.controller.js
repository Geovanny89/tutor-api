'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Joi = require('joi');
const { User, Tenant, PasswordResetToken } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const { sendMail, passwordResetEmail } = require('../services/mail.service');
const { resolveDailyLimit } = require('../middlewares/rateLimit.middleware');
const { ROLES, AGE_RANGES, AGE_RANGE_ORDER, HTTP_STATUS } = require('../config/constants');

/**
 * Auth Controller - MVC Controller layer
 * Handles: register, login, me (get current user), logout
 */

const { slugify, uniqueSlug } = require('../utils/tenantScope');

// ─── Validation Schemas ────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(50).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
  tenant_id: Joi.string().optional().allow(null, ''),
  tenant_slug: Joi.string().optional().allow(null, ''),
  age_range: Joi.string().valid(...AGE_RANGE_ORDER).optional().allow(null, ''),
  target_level: Joi.string().optional().allow(''),
  native_language: Joi.string().max(10).optional().default('es'),
  account_type: Joi.string().valid('student', 'independent', 'academy').optional().default('student'),
  professor_id: Joi.string().optional().allow(null, ''),
  academy_name: Joi.string().optional().allow('', null),
  academy_slug: Joi.string().optional().allow('', null),
}).unknown(true);

const registerAcademySchema = Joi.object({
  academyName: Joi.string().min(2).max(100).required().messages({
    'any.required': 'Academy name is required',
  }),
  academySlug: Joi.string().min(2).max(50).required().lowercase().messages({
    'any.required': 'Academy slug is required',
  }),
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(50).required(),
  accountType: Joi.string().valid('independent', 'academy').optional().default('academy'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ─── Helper: Generate JWT Token ───────────────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ─── Controllers ──────────────────────────────────────────────────────────────
const AuthController = {
  /**
   * POST /api/auth/register
   * Register a new student account
   */
  async register(req, res) {
    try {
      const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
      if (error) {
        const messages = error.details.map((d) => d.message);
        return ApiResponse.error(res, messages.join('. '), HTTP_STATUS.BAD_REQUEST);
      }

      const { name, email, password, tenant_slug, native_language, age_range, account_type } = value;

      // Check if email already exists
      const existingUser = await User.findOne({ where: { email: email.trim().toLowerCase() } });
      if (existingUser) {
        return ApiResponse.error(res, 'An account with this email already exists.', HTTP_STATUS.CONFLICT);
      }

      // If registering as independent professor or academy from main register
      if (account_type === 'independent' || account_type === 'academy') {
        const isInd = account_type === 'independent';
        const rawSlug = value.academy_slug || slugify(value.academy_name || (isInd ? `prof-${name}` : 'academia'));
        const resolvedSlug = await uniqueSlug(rawSlug);

        const tenant = await Tenant.create({
          name: value.academy_name || (isInd ? `Espacio de ${name}` : 'Mi Academia'),
          slug: resolvedSlug,
          is_active: true,
          is_public_page_active: true,
          type: isInd ? 'independent' : 'academy',
          max_professors: isInd ? 1 : 5,
          max_students: isInd ? 50 : 100,
          enabled_age_ranges: ['kids', 'teens', 'adults'],
        });

        const user = await User.create({
          name,
          email: email.trim().toLowerCase(),
          password,
          role: ROLES.PROFESSOR,
          tenant_id: tenant.id,
          age_range: 'adults',
          native_language: native_language || 'es',
        });

        await tenant.update({ owner_id: user.id });
        const token = generateToken(user);

        return ApiResponse.success(
          res,
          { user: user.toSafeObject(), token },
          isInd
            ? '¡Cuenta de profesor independiente creada con éxito! Bienvenido a tu panel docente. 🎉'
            : '¡Academia registrada con éxito! Tu academia tiene capacidad para 5 profesores con control total. 🎉',
          HTTP_STATUS.CREATED
        );
      }

      // Resolve tenant if slug provided or default to active tenant
      let tenantId = value.tenant_id || null;
      let tenant = null;
      if (tenant_slug) {
        tenant = await Tenant.findOne({ where: { slug: tenant_slug, is_active: true } });
        if (!tenant) {
          return ApiResponse.error(res, 'Organization not found.', HTTP_STATUS.NOT_FOUND);
        }
        if (tenant.is_public_page_active === false) {
          return ApiResponse.error(res, 'This academy is not accepting new students right now.', HTTP_STATUS.FORBIDDEN);
        }
        // Check max students
        const studentCount = await User.count({ where: { tenant_id: tenant.id, role: ROLES.STUDENT } });
        if (studentCount >= tenant.max_students) {
          return ApiResponse.error(res, 'This organization has reached its student limit.', HTTP_STATUS.FORBIDDEN);
        }
        // Validate the requested age range is offered by the academy
        const enabled = tenant.enabled_age_ranges || AGE_RANGE_ORDER;
        if (age_range && !enabled.includes(age_range)) {
          return ApiResponse.error(res, 'This academy does not offer the selected age group.', HTTP_STATUS.BAD_REQUEST);
        }
        tenantId = tenant.id;
      } else if (!tenantId) {
        const defaultTenant = await Tenant.findOne({ where: { is_active: true } });
        if (defaultTenant) {
          tenantId = defaultTenant.id;
          tenant = defaultTenant;
        }
      }

      // Si la academia solo ofrece un rango, úsalo por defecto
      let resolvedAgeRange = age_range || null;
      if (!resolvedAgeRange && tenant) {
        const enabled = tenant.enabled_age_ranges || AGE_RANGE_ORDER;
        if (enabled.length === 1) resolvedAgeRange = enabled[0];
      }

      const user = await User.create({
        name,
        email: email.trim().toLowerCase(),
        password,
        role: ROLES.STUDENT,
        tenant_id: tenantId,
        professor_id: value.professor_id || null,
        age_range: resolvedAgeRange,
        native_language,
      });

      const token = generateToken(user);

      return ApiResponse.success(
        res,
        { user: user.toSafeObject(), token },
        'Account created successfully! Welcome to KDice English! 🎉',
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      return ApiResponse.error(res, 'Registration failed.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/auth/register-academy
   * Register a new academy or independent teacher
   */
  async registerAcademy(req, res) {
    try {
      const { error, value } = registerAcademySchema.validate(req.body, { abortEarly: false });
      if (error) {
        const messages = error.details.map((d) => d.message);
        return ApiResponse.error(res, messages.join('. '), HTTP_STATUS.BAD_REQUEST);
      }

      const { academyName, academySlug, name, email, password, accountType = 'academy' } = value;
      const isIndependent = accountType === 'independent';

      // Check if email already exists
      const existingUser = await User.findOne({ where: { email: email.trim().toLowerCase() } });
      if (existingUser) {
        return ApiResponse.error(res, 'An account with this email already exists.', HTTP_STATUS.CONFLICT);
      }

      // Check if slug already exists
      const existingTenant = await Tenant.findOne({ where: { slug: academySlug } });
      if (existingTenant) {
        return ApiResponse.error(res, 'This academy URL (slug) is already taken. Please choose another.', HTTP_STATUS.CONFLICT);
      }

      // 1. Create Tenant
      const tenant = await Tenant.create({
        name: academyName,
        slug: academySlug,
        is_active: true,
        is_public_page_active: true,
        type: isIndependent ? 'independent' : 'academy',
        max_professors: isIndependent ? 1 : 5,
        max_students: isIndependent ? 50 : 100,
        enabled_age_ranges: ['kids', 'teens', 'adults'],
      });

      // 2. Create User as PROFESSOR
      const user = await User.create({
        name,
        email: email.trim().toLowerCase(),
        password,
        role: ROLES.PROFESSOR,
        tenant_id: tenant.id,
        age_range: 'adults',
      });

      // 3. Link owner back to tenant
      await tenant.update({ owner_id: user.id });

      const token = generateToken(user);

      return ApiResponse.success(
        res,
        { user: user.toSafeObject(), token },
        isIndependent
          ? '¡Cuenta de profesor independiente creada con éxito! Bienvenido al panel docente 🎉'
          : '¡Academia registrada con éxito! Tu academia tiene capacidad para 5 profesores con control total. 🎉',
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      return ApiResponse.error(res, 'Academy registration failed.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  async login(req, res) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return ApiResponse.error(res, 'Please provide a valid email and password.', HTTP_STATUS.BAD_REQUEST);
      }

      const { email, password } = value;

      const user = await User.findOne({
        where: { email },
        include: [{ model: Tenant, as: 'tenant', attributes: ['id', 'name', 'slug', 'primary_color', 'logo_url', 'owner_id'] }],
      });

      if (!user || !(await user.verifyPassword(password))) {
        return ApiResponse.error(
          res,
          'Incorrect email or password. Please try again.',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      if (!user.is_active) {
        return ApiResponse.error(res, 'Your account has been deactivated. Contact support.', HTTP_STATUS.FORBIDDEN);
      }

      // Update last activity
      await user.update({ last_activity_at: new Date() });

      const token = generateToken(user);

      // Marca si el usuario pertenece a una academia real (tiene dueño/profesor),
      // para que el frontend muestre su marca y oculte la publicidad de la plataforma.
      const safeUser = user.toSafeObject();
      if (safeUser.tenant) {
        safeUser.tenant.is_academy = Boolean(safeUser.tenant.owner_id);
        delete safeUser.tenant.owner_id;
      }

      return ApiResponse.success(res, {
        user: safeUser,
        token,
        ai_remaining: await resolveDailyLimit(user),
      }, `Welcome back, ${user.name}! 👋`);
    } catch (error) {
      return ApiResponse.error(res, 'Login failed.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * GET /api/auth/me
   * Get the currently authenticated user
   */
  async me(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [{ model: Tenant, as: 'tenant', attributes: ['id', 'name', 'slug', 'primary_color', 'logo_url', 'owner_id'] }],
      });

      const userJson = user.toJSON();
      if (userJson.tenant) {
        userJson.tenant.is_academy = Boolean(userJson.tenant.owner_id);
        delete userJson.tenant.owner_id;
      }

      return ApiResponse.success(res, userJson, 'User profile retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to get user profile.', HTTP_STATUS.INTERNAL_ERROR);
    }
  },

  /**
   * PUT /api/auth/profile
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const { name, avatar_url, native_language, age_range } = req.body;

      await req.user.update({
        ...(name && { name }),
        ...(avatar_url !== undefined && { avatar_url }),
        ...(native_language && { native_language }),
        ...(age_range && AGE_RANGE_ORDER.includes(age_range) && { age_range }),
      });

      return ApiResponse.success(res, req.user.toSafeObject(), 'Profile updated successfully!');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to update profile.', HTTP_STATUS.INTERNAL_ERROR);
    }
  },

  /**
   * PUT /api/auth/change-password
   * Change user password
   */
  async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return ApiResponse.error(res, 'Current and new password are required.', HTTP_STATUS.BAD_REQUEST);
      }

      if (new_password.length < 6) {
        return ApiResponse.error(res, 'New password must be at least 6 characters.', HTTP_STATUS.BAD_REQUEST);
      }

      const user = await User.findByPk(req.user.id);
      if (!(await user.verifyPassword(current_password))) {
        return ApiResponse.error(res, 'Current password is incorrect.', HTTP_STATUS.UNAUTHORIZED);
      }

      await user.update({ password: new_password });

      return ApiResponse.success(res, null, 'Password changed successfully!');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to change password.', HTTP_STATUS.INTERNAL_ERROR);
    }
  },

  /**
   * POST /api/auth/forgot-password
   * Envía un enlace de recuperación al email indicado.
   * Siempre responde con éxito para no revelar si el email existe.
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return ApiResponse.error(res, 'Please provide your email address.', HTTP_STATUS.BAD_REQUEST);
      }

      const user = await User.findOne({ where: { email } });
      if (user) {
        // Invalidar tokens anteriores sin usar
        await PasswordResetToken.update(
          { used_at: new Date() },
          { where: { user_id: user.id, used_at: null } }
        );

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        await PasswordResetToken.create({
          user_id: user.id,
          token_hash: tokenHash,
          expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
        });

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;
        const mail = passwordResetEmail(user.name, resetUrl);

        try {
          await sendMail({ to: user.email, ...mail });
        } catch (mailError) {
          console.error('[Auth] Error enviando correo de recuperación:', mailError.message);
        }
      }

      return ApiResponse.success(
        res,
        null,
        'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.'
      );
    } catch (error) {
      return ApiResponse.error(res, 'Failed to process password recovery.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/auth/reset-password
   * Restablece la contraseña usando el token enviado por email.
   */
  async resetPassword(req, res) {
    try {
      const { token, new_password } = req.body;
      if (!token || !new_password) {
        return ApiResponse.error(res, 'Token and new password are required.', HTTP_STATUS.BAD_REQUEST);
      }
      if (new_password.length < 6) {
        return ApiResponse.error(res, 'Password must be at least 6 characters.', HTTP_STATUS.BAD_REQUEST);
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const record = await PasswordResetToken.findOne({ where: { token_hash: tokenHash } });

      if (!record || record.used_at || new Date(record.expires_at) < new Date()) {
        return ApiResponse.error(res, 'This recovery link is invalid or has expired.', HTTP_STATUS.BAD_REQUEST);
      }

      const user = await User.findByPk(record.user_id);
      if (!user) {
        return ApiResponse.error(res, 'User not found.', HTTP_STATUS.NOT_FOUND);
      }

      await user.update({ password: new_password });
      await record.update({ used_at: new Date() });

      return ApiResponse.success(res, null, 'Password reset successfully! You can now log in.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to reset password.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },
};

module.exports = AuthController;
