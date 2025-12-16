/**
 * API v1 Utilities
 *
 * Re-exports all API-related utilities for convenient importing
 */

// API Key utilities
export {
  API_KEY_PREFIX,
  API_SCOPES,
  SCOPE_BUNDLES,
  generateApiKey,
  hashApiKey,
  isValidApiKeyFormat,
  extractKeyPrefix,
  hasScope,
  hasAnyScope,
  hasAllScopes,
  validateScopes,
  getScopeDescription,
  parseScopeString,
  formatScopes,
} from './api-key-utils';

export type { ApiScope } from './api-key-utils';

// API Key authentication
export {
  authenticateApiKey,
  extractApiKey,
  checkScope,
  getEffectiveLocationId,
  apiError,
  withApiAuth,
  buildWhereClause,
  parsePaginationParams,
  paginatedResponse,
} from './api-key-auth';

export type {
  AuthenticatedApiKey,
  ApiAuthResult,
  ApiErrorResponse,
  PaginationParams,
  PaginatedResponse,
} from './api-key-auth';
