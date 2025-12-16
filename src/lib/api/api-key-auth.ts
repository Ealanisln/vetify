/**
 * API Key Authentication Middleware for Vetify API v1
 *
 * Provides authentication and authorization for API v1 endpoints using API keys.
 * Supports location scoping, permission scopes, and rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashApiKey, isValidApiKeyFormat, hasScope, ApiScope } from './api-key-utils';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { Location, Tenant, TenantApiKey } from '@prisma/client';

/**
 * Extended API key type with relations
 */
export type AuthenticatedApiKey = TenantApiKey & {
  tenant: Tenant;
  location: Location | null;
};

/**
 * API authentication result
 */
export type ApiAuthResult =
  | { success: true; apiKey: AuthenticatedApiKey }
  | { success: false; error: string; status: number };

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: string;
}

/**
 * Rate limiter instance (lazy initialized)
 */
let rateLimiter: Ratelimit | null = null;

/**
 * Get or create the rate limiter instance
 */
function getRateLimiter(): Ratelimit | null {
  if (rateLimiter) return rateLimiter;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.warn('Rate limiting disabled: UPSTASH_REDIS credentials not configured');
    return null;
  }

  try {
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    rateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, '1 h'), // Default, will be overridden per-key
      prefix: 'vetify:api:v1:',
    });

    return rateLimiter;
  } catch (error) {
    console.error('Failed to initialize rate limiter:', error);
    return null;
  }
}

/**
 * Extract the API key from the Authorization header
 *
 * @param request - The incoming request
 * @returns The API key string or null if not found/invalid format
 */
export function extractApiKey(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return null;
  }

  // Support both "Bearer vfy_..." and just "vfy_..."
  if (authHeader.startsWith('Bearer ')) {
    const key = authHeader.slice(7);
    return isValidApiKeyFormat(key) ? key : null;
  }

  return isValidApiKeyFormat(authHeader) ? authHeader : null;
}

/**
 * Authenticate an API request using the API key in the Authorization header
 *
 * @param request - The incoming NextRequest
 * @returns ApiAuthResult with either the authenticated key or error details
 */
export async function authenticateApiKey(request: NextRequest): Promise<ApiAuthResult> {
  const key = extractApiKey(request);

  if (!key) {
    return {
      success: false,
      error: 'Missing or invalid API key',
      status: 401,
    };
  }

  const keyHash = hashApiKey(key);

  try {
    const apiKey = await prisma.tenantApiKey.findUnique({
      where: { keyHash },
      include: {
        tenant: true,
        location: true,
      },
    });

    if (!apiKey) {
      return {
        success: false,
        error: 'Invalid API key',
        status: 401,
      };
    }

    if (!apiKey.isActive) {
      return {
        success: false,
        error: 'API key is disabled',
        status: 401,
      };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return {
        success: false,
        error: 'API key has expired',
        status: 401,
      };
    }

    // Check rate limit
    const limiter = getRateLimiter();
    if (limiter) {
      // Create a custom limiter for this key's rate limit
      const keyLimiter = new Ratelimit({
        redis: limiter.redis as Redis,
        limiter: Ratelimit.slidingWindow(apiKey.rateLimit, '1 h'),
        prefix: 'vetify:api:v1:',
      });

      const { success: rateLimitSuccess, remaining, reset } = await keyLimiter.limit(apiKey.id);

      if (!rateLimitSuccess) {
        return {
          success: false,
          error: `Rate limit exceeded. Limit: ${apiKey.rateLimit}/hour. Resets at: ${new Date(reset).toISOString()}`,
          status: 429,
        };
      }

      // Add rate limit headers to response (done in wrapper)
      (request as NextRequest & { rateLimitInfo?: { remaining: number; reset: number } }).rateLimitInfo = {
        remaining,
        reset,
      };
    }

    // Update lastUsed timestamp (fire and forget)
    prisma.tenantApiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsed: new Date() },
      })
      .catch((err) => {
        console.error('Failed to update API key lastUsed:', err);
      });

    return {
      success: true,
      apiKey,
    };
  } catch (error) {
    console.error('API key authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      status: 500,
    };
  }
}

/**
 * Check if the authenticated API key has the required scope
 *
 * @param apiKey - The authenticated API key
 * @param requiredScope - The scope required for the operation
 * @returns true if the key has the required scope
 */
export function checkScope(apiKey: AuthenticatedApiKey, requiredScope: ApiScope): boolean {
  return hasScope(apiKey.scopes, requiredScope);
}

/**
 * Get the effective location ID for a request
 *
 * If the API key is scoped to a location, that takes precedence.
 * Otherwise, use the locationId from query params if provided.
 *
 * @param apiKey - The authenticated API key
 * @param request - The incoming request
 * @returns The location ID to filter by, or null for all locations
 */
export function getEffectiveLocationId(
  apiKey: AuthenticatedApiKey,
  request: NextRequest
): string | null {
  // If API key is scoped to a specific location, always use that
  if (apiKey.locationId) {
    return apiKey.locationId;
  }

  // Otherwise, check query params
  const { searchParams } = new URL(request.url);
  return searchParams.get('locationId');
}

/**
 * Create a standardized error response
 *
 * @param error - Error message
 * @param code - Error code
 * @param status - HTTP status code
 * @param details - Optional additional details
 * @returns NextResponse with error JSON
 */
export function apiError(
  error: string,
  code: string,
  status: number,
  details?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error,
      code,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Wrapper for API v1 route handlers that handles authentication and common patterns
 *
 * @param handler - The actual route handler function
 * @param options - Options for the wrapper
 * @returns A wrapped handler function
 */
export function withApiAuth(
  handler: (
    request: NextRequest,
    context: {
      apiKey: AuthenticatedApiKey;
      locationId: string | null;
      params?: Record<string, string>;
    }
  ) => Promise<NextResponse>,
  options: {
    requiredScope?: ApiScope;
    requireLocation?: boolean;
  } = {}
) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    // Authenticate
    const authResult = await authenticateApiKey(request);

    if (!authResult.success) {
      return apiError(authResult.error, 'UNAUTHORIZED', authResult.status);
    }

    const { apiKey } = authResult;

    // Check scope if required
    if (options.requiredScope && !checkScope(apiKey, options.requiredScope)) {
      return apiError(
        `Missing required scope: ${options.requiredScope}`,
        'FORBIDDEN',
        403,
        `This endpoint requires the '${options.requiredScope}' scope`
      );
    }

    // Get effective location ID
    const locationId = getEffectiveLocationId(apiKey, request);

    // Check location requirement
    if (options.requireLocation && !locationId) {
      return apiError(
        'Location ID required',
        'BAD_REQUEST',
        400,
        'This endpoint requires a locationId parameter'
      );
    }

    // Resolve params if present
    const params = context?.params ? await context.params : undefined;

    // Call the handler
    try {
      const response = await handler(request, { apiKey, locationId, params });

      // Add rate limit headers
      const rateLimitInfo = (request as NextRequest & { rateLimitInfo?: { remaining: number; reset: number } }).rateLimitInfo;
      if (rateLimitInfo) {
        response.headers.set('X-RateLimit-Remaining', String(rateLimitInfo.remaining));
        response.headers.set('X-RateLimit-Reset', String(rateLimitInfo.reset));
        response.headers.set('X-RateLimit-Limit', String(apiKey.rateLimit));
      }

      return response;
    } catch (error) {
      console.error('API v1 handler error:', error);
      return apiError('Internal server error', 'INTERNAL_ERROR', 500);
    }
  };
}

/**
 * Helper to build a Prisma where clause with tenant and location filtering
 *
 * @param apiKey - The authenticated API key
 * @param locationId - The effective location ID
 * @param additionalWhere - Additional where conditions
 * @returns Combined where clause
 */
export function buildWhereClause<T extends Record<string, unknown>>(
  apiKey: AuthenticatedApiKey,
  locationId: string | null,
  additionalWhere: T = {} as T
): { tenantId: string; locationId?: string } & T {
  return {
    tenantId: apiKey.tenantId,
    ...(locationId && { locationId }),
    ...additionalWhere,
  };
}

/**
 * Standard pagination parameters
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Parse pagination parameters from query string
 *
 * @param request - The incoming request
 * @param defaults - Default values
 * @returns Pagination params with validated values
 */
export function parsePaginationParams(
  request: NextRequest,
  defaults: { limit?: number; maxLimit?: number } = {}
): PaginationParams {
  const { searchParams } = new URL(request.url);

  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get('limit') || String(defaults.limit || 50))),
    defaults.maxLimit || 100
  );

  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));

  return { limit, offset };
}

/**
 * Standard paginated response format
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Create a paginated response
 *
 * @param data - Array of items
 * @param total - Total count
 * @param pagination - Pagination params used
 * @returns Paginated response object
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  pagination: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      total,
      limit: pagination.limit,
      offset: pagination.offset,
      hasMore: pagination.offset + data.length < total,
    },
  };
}
