/**
 * Pagination and sorting utilities for API endpoints
 */

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginationSortParams extends PaginationParams, SortParams {}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Default pagination limits
 */
export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Parse pagination parameters from URL search params
 * @param searchParams - URL search params
 * @returns Parsed pagination parameters
 */
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const requestedLimit = parseInt(searchParams.get('limit') || String(PAGINATION_DEFAULTS.DEFAULT_LIMIT), 10);
  const limit = Math.min(Math.max(1, requestedLimit), PAGINATION_DEFAULTS.MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Create a paginated response object
 * @param data - Array of items
 * @param total - Total count of items
 * @param params - Pagination parameters
 * @returns Paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasMore: params.page < totalPages,
    },
  };
}

/**
 * Parse sort parameters from URL search params with whitelist validation
 * @param searchParams - URL search params
 * @param allowedFields - Array of allowed field names for sorting
 * @param defaultField - Default field to sort by
 * @param defaultOrder - Default sort order
 * @returns Parsed and validated sort parameters
 */
export function parseSortParams(
  searchParams: URLSearchParams,
  allowedFields: readonly string[],
  defaultField: string = 'createdAt',
  defaultOrder: 'asc' | 'desc' = 'desc'
): SortParams {
  const rawSortBy = searchParams.get('sortBy') || defaultField;
  const rawSortOrder = searchParams.get('sortOrder') || defaultOrder;

  // Whitelist validation for security
  const sortBy = allowedFields.includes(rawSortBy) ? rawSortBy : defaultField;
  const sortOrder = rawSortOrder === 'asc' || rawSortOrder === 'desc' ? rawSortOrder : defaultOrder;

  return { sortBy, sortOrder };
}

/**
 * Parse both pagination and sort parameters
 * @param searchParams - URL search params
 * @param allowedSortFields - Array of allowed field names for sorting
 * @param defaultSortField - Default field to sort by
 * @param defaultSortOrder - Default sort order
 * @returns Combined pagination and sort parameters
 */
export function parsePaginationAndSortParams(
  searchParams: URLSearchParams,
  allowedSortFields: readonly string[],
  defaultSortField: string = 'createdAt',
  defaultSortOrder: 'asc' | 'desc' = 'desc'
): PaginationSortParams {
  const pagination = parsePaginationParams(searchParams);
  const sort = parseSortParams(searchParams, allowedSortFields, defaultSortField, defaultSortOrder);

  return { ...pagination, ...sort };
}
