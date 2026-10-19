'use strict';

const { HTTP_STATUS } = require('../config/constants');

/**
 * Standardized API Response Helper
 * Ensures consistent response format across all endpoints
 * 
 * Usage:
 *   return ApiResponse.success(res, data, 'User created', 201);
 *   return ApiResponse.error(res, 'Not found', 404);
 */
class ApiResponse {
  /**
   * Send a success response
   * @param {object} res - Express response object
   * @param {*} data - Response payload
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  static success(res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send an error response
   * @param {object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {*} errors - Detailed error info (optional)
   */
  static error(res, message = 'Internal server error', statusCode = HTTP_STATUS.INTERNAL_ERROR, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errors && process.env.NODE_ENV === 'development') {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send a paginated response
   */
  static paginated(res, data, total, page, limit, message = 'Success') {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message,
      data,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = ApiResponse;
