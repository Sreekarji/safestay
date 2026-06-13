import { PAGINATION } from '../config/constants.js';

interface PaginationInput {
  page?: any;
  limit?: any;
}

interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
  pages: number;
}

/**
 * Parse and validate pagination parameters from query string.
 */
export const parsePagination = (
  input: PaginationInput,
  total: number = 0
): PaginationResult => {
  let page = Number(input.page) || PAGINATION.DEFAULT_PAGE;
  let limit = Number(input.limit) || PAGINATION.DEFAULT_LIMIT;

  // Clamp values
  page = Math.max(1, page);
  limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, limit));

  const skip = (page - 1) * limit;
  const pages = Math.ceil(total / limit);

  return { page, limit, skip, pages };
};

/**
 * Build pagination metadata for response.
 */
export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number
) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
});
