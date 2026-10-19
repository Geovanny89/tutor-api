'use strict';

const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');
const { User } = require('../models');
const { ROLES, HTTP_STATUS } = require('../config/constants');

/**
 * Auth Middleware
 * Validates JWT tokens and attaches user to request
 */

/**
 * Require valid JWT token
 * Attaches req.user with the authenticated user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.error(res, 'Authentication required. Please log in.', HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      const message = jwtError.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid authentication token.';
      return ApiResponse.error(res, message, HTTP_STATUS.UNAUTHORIZED);
    }

    // Load fresh user from DB to ensure it's still active
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user || !user.is_active) {
      return ApiResponse.error(res, 'User account not found or deactivated.', HTTP_STATUS.UNAUTHORIZED);
    }

    req.user = user;
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Authentication error.', HTTP_STATUS.INTERNAL_ERROR, error.message);
  }
};

/**
 * Require specific roles
 * Must be used AFTER authenticate middleware
 * @param {...string} roles - Allowed roles
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return ApiResponse.error(res, 'Authentication required.', HTTP_STATUS.UNAUTHORIZED);
  }

  if (!roles.includes(req.user.role)) {
    return ApiResponse.error(
      res,
      'You do not have permission to access this resource.',
      HTTP_STATUS.FORBIDDEN
    );
  }

  next();
};

/**
 * Convenience middleware for super admin only
 */
const requireSuperAdmin = [authenticate, requireRole(ROLES.SUPER_ADMIN)];

/**
 * Convenience middleware for admins (super_admin + tenant_admin)
 */
const requireAdmin = [authenticate, requireRole(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN)];

module.exports = {
  authenticate,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
};
