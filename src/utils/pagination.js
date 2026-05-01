'use strict';

/**
 * src/utils/pagination.js — Reusable Pagination Helper
 *
 * Provides consistent pagination parameter extraction and
 * metadata generation for all list endpoints.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Extract and validate pagination params from req.query.
 *
 * @param {object} query - Express req.query object
 * @returns {{ page: number, limit: number, offset: number }}
 */
const getPaginationParams = (query) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  // Validate and clamp
  page = Number.isNaN(page) || page < 1 ? DEFAULT_PAGE : page;
  limit = Number.isNaN(limit) || limit < 1 ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);

  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Build the pagination meta object for API responses.
 *
 * @param {number} total - Total number of records
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {{ page: number, limit: number, total: number, totalPages: number }}
 */
const getPaginationMeta = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

module.exports = {
  getPaginationParams,
  getPaginationMeta,
};
