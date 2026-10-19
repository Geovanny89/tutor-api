'use strict';

const NodeCache = require('node-cache');

/**
 * In-Memory Cache Utility
 * Caches AI responses to avoid duplicate API calls
 * Also caches static content (modules, lessons) for performance
 */
const cache = new NodeCache({
  stdTTL: 3600,           // Default: 1 hour
  checkperiod: 600,       // Check for expired keys every 10 minutes
  useClones: false,       // Better performance for read-heavy workloads
});

const CacheService = {
  /**
   * Get a cached value
   * @param {string} key
   * @returns {*} cached value or undefined
   */
  get(key) {
    return cache.get(key);
  },

  /**
   * Set a cached value
   * @param {string} key
   * @param {*} value
   * @param {number} ttl - Time to live in seconds (optional, uses default if omitted)
   */
  set(key, value, ttl = undefined) {
    return cache.set(key, value, ttl);
  },

  /**
   * Delete a cached value
   * @param {string} key
   */
  del(key) {
    return cache.del(key);
  },

  /**
   * Generate a consistent cache key for AI responses
   * Based on message content hash to cache similar questions
   * @param {string} userId
   * @param {string} message
   * @param {string} level
   * @returns {string}
   */
  aiKey(userId, message, level) {
    // Simple hash: level + first 50 chars (not userId, so similar msgs share cache)
    const content = `${level}:${message.toLowerCase().trim().slice(0, 50)}`;
    return `ai:${Buffer.from(content).toString('base64').slice(0, 32)}`;
  },

  /**
   * Generate cache key for modules list
   */
  modulesKey() {
    return 'modules:all';
  },

  /**
   * Generate cache key for lessons in a module
   * @param {string} moduleId
   */
  lessonsKey(moduleId) {
    return `lessons:${moduleId}`;
  },

  /**
   * Clear all cache (use after admin updates)
   */
  flush() {
    return cache.flushAll();
  },

  /**
   * Get cache stats
   */
  stats() {
    return cache.getStats();
  },
};

module.exports = CacheService;
