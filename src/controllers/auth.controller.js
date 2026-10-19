'use strict';

const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { User, Tenant } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const { ROLES, HTTP_STATUS } = require('../config/constants');

/**
 * Auth Controller - MVC Controller layer
 * Handles: register, login, me (get current user), logout
 */

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
  target_level: Joi.string().optional().allow(''),
  native_language: Joi.string().max(10).optional().default('es'),
}).unknown(true);

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

      const { name, email, password, tenant_slug, native_language } = value;

      // Check if email already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return ApiResponse.error(res, 'An account with this email already exists.', HTTP_STATUS.CONFLICT);
      }

      // Resolve tenant if slug provided or default to active tenant
      let tenantId = value.tenant_id || null;
      if (!tenantId && tenant_slug) {
        const tenant = await Tenant.findOne({ where: { slug: tenant_slug, is_active: true } });
        if (!tenant) {
          return ApiResponse.error(res, 'Organization not found.', HTTP_STATUS.NOT_FOUND);
        }
        // Check max students
        const studentCount = await User.count({ where: { tenant_id: tenant.id, role: ROLES.STUDENT } });
        if (studentCount >= tenant.max_students) {
          return ApiResponse.error(res, 'This organization has reached its student limit.', HTTP_STATUS.FORBIDDEN);
        }
        tenantId = tenant.id;
      }

      if (!tenantId) {
        const defaultTenant = await Tenant.findOne({ where: { is_active: true } });
        if (defaultTenant) {
          tenantId = defaultTenant.id;
        }
      }

      const user = await User.create({
        name,
        email,
        password,
        role: ROLES.STUDENT,
        tenant_id: tenantId,
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
        include: [{ model: Tenant, as: 'tenant', attributes: ['id', 'name', 'slug', 'primary_color', 'logo_url'] }],
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

      return ApiResponse.success(res, {
        user: user.toSafeObject(),
        token,
        ai_remaining: parseInt(process.env.AI_DAILY_LIMIT) || 20,
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
        include: [{ model: Tenant, as: 'tenant', attributes: ['id', 'name', 'slug', 'primary_color', 'logo_url'] }],
      });

      return ApiResponse.success(res, user, 'User profile retrieved.');
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
      const { name, avatar_url, native_language } = req.body;

      await req.user.update({
        ...(name && { name }),
        ...(avatar_url !== undefined && { avatar_url }),
        ...(native_language && { native_language }),
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
};

module.exports = AuthController;
