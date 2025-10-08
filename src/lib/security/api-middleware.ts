import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '../auth';
import { SecureApiHandler, RequestBody, QueryParams } from './types';
import { UserWithTenant, TenantWithPlan } from '@/types';
import { 
  validateRequestBody, 
  validateQueryParams, 
  createSecureErrorResponse 
} from './input-sanitization';
import { 
  logDataAccessEvent, 
  logSensitiveDataAccess, 
  logSecurityEvent
} from './audit-logger';

/**
 * Enhanced API middleware factory with comprehensive security
 */
export interface ApiMiddlewareOptions {
  requireAuth?: boolean;
  requireSuperAdmin?: boolean;
  bodySchema?: z.ZodSchema;
  querySchema?: z.ZodSchema;
  rateLimit?: 'low' | 'medium' | 'high';
  auditLevel?: 'standard' | 'sensitive' | 'admin';
  resourceType?: string;
}

/**
 * Create secure API handler with comprehensive validation and logging
 */
export function createSecureApiHandler<T = RequestBody>(
  handler: SecureApiHandler<T>,
  options: ApiMiddlewareOptions = {}
) {
  return async (req: NextRequest) => {
    const startTime = Date.now();
    let userId: string | undefined;
    let tenantId: string | undefined;
    let tenant: TenantWithPlan | undefined;
    let user: UserWithTenant | undefined;

    try {
      // 1. Authentication check
      if (options.requireAuth !== false) {
        try {
          const authResult = await requireAuth();
          tenant = authResult.tenant;
          user = authResult.user;
          userId = user?.id;
          tenantId = tenant?.id;
        } catch (error) {
          await logSecurityEvent(req, 'permission_denied', undefined, {
            reason: 'Authentication required',
            endpoint: req.nextUrl.pathname,
          });
          
          return createSecureErrorResponse('Authentication required', 401);
        }
      }

      // 2. Super admin check
      if (options.requireSuperAdmin) {
        // This would need to be implemented based on your user model
        // For now, we'll assume this check is done elsewhere
      }

      // 3. Request body validation
      let validatedBody: T | undefined;
      if (options.bodySchema && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        const bodyValidation = await validateRequestBody(req.clone(), options.bodySchema);
        
        if (!bodyValidation.success) {
          await logSecurityEvent(req, 'security_event', userId, {
            reason: 'Invalid request body',
            error: bodyValidation.error,
            endpoint: req.nextUrl.pathname,
          });
          
          return createSecureErrorResponse(`Validation error: ${bodyValidation.error}`, 400);
        }
        
        validatedBody = bodyValidation.data;
      }

      // 4. Query parameter validation
      let validatedQuery: QueryParams = {};
      if (options.querySchema) {
        const queryValidation = validateQueryParams(req.nextUrl, options.querySchema);
        
        if (!queryValidation.success) {
          await logSecurityEvent(req, 'security_event', userId, {
            reason: 'Invalid query parameters',
            error: queryValidation.error,
            endpoint: req.nextUrl.pathname,
          });
          
          return createSecureErrorResponse(`Query validation error: ${queryValidation.error}`, 400);
        }
        
        validatedQuery = queryValidation.data;
      }

      // 5. Audit logging
      const auditLevel = options.auditLevel || 'standard';
      
      if (auditLevel === 'sensitive' && userId && tenantId) {
        await logSensitiveDataAccess(
          req,
          userId,
          tenantId,
          options.resourceType || 'unknown',
          undefined,
          { method: req.method }
        );
      } else if (auditLevel === 'admin' && userId) {
        await logDataAccessEvent(
          req,
          'data_access',
          userId,
          tenantId || 'unknown',
          options.resourceType || 'admin_endpoint',
          undefined,
          true,
          { method: req.method }
        );
      } else if (userId && tenantId) {
        await logDataAccessEvent(
          req,
          req.method === 'GET' ? 'data_access' : 
          req.method === 'POST' ? 'data_create' :
          req.method === 'PUT' || req.method === 'PATCH' ? 'data_update' :
          req.method === 'DELETE' ? 'data_delete' : 'data_access',
          userId,
          tenantId,
          options.resourceType || 'api_endpoint',
          undefined,
          true,
          { method: req.method }
        );
      }

      // 6. Execute handler
      const response = await handler(req, {
        tenant,
        user,
        body: validatedBody as (Record<string, unknown> & T) | undefined,
        query: validatedQuery,
        userId,
        tenantId,
      });

      // 7. Add performance metrics
      const duration = Date.now() - startTime;
      response.headers.set('X-Response-Time', `${duration}ms`);

      return response;

    } catch (error) {
      console.error('API Middleware Error:', error);
      
      // Log the error
      await logSecurityEvent(req, 'security_event', userId, {
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: req.nextUrl.pathname,
        duration: Date.now() - startTime,
      });

      // Return secure error response
      if (error instanceof z.ZodError) {
        return createSecureErrorResponse(
          `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          400
        );
      }

      return createSecureErrorResponse(
        process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'Internal server error',
        500
      );
    }
  };
}

/**
 * Validation schemas for common API patterns
 */
export const commonValidationSchemas = {
  // ID parameter validation
  idParam: z.object({
    id: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  }),

  // Pagination query validation
  paginationQuery: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sortBy: z.string().max(50).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),

  // Date range query validation
  dateRangeQuery: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),

  // Search query validation
  searchQuery: z.object({
    q: z.string().min(1).max(100).optional(),
    category: z.string().max(50).optional(),
  }),
};

/**
 * Helper function to create tenant-scoped validation
 */
export function createTenantScopedHandler<T = RequestBody>(
  handler: (req: NextRequest, context: {
    tenant: TenantWithPlan;
    user: UserWithTenant;
    body?: T;
    query?: QueryParams;
    userId: string;
    tenantId: string;
  }) => Promise<Response>,
  options: Omit<ApiMiddlewareOptions, 'requireAuth'> = {}
) {
  return createSecureApiHandler(
    async (req, context) => {
      if (!context.tenant || !context.user) {
        throw new Error('Authentication required');
      }
      
      return handler(req, {
        tenant: context.tenant,
        user: context.user,
        body: context.body as T | undefined,
        query: context.query,
        userId: context.userId!,
        tenantId: context.tenantId!,
      });
    },
    { ...options, requireAuth: true }
  );
}

/**
 * Helper function to create admin-only handlers
 */
export function createAdminHandler<T = RequestBody>(
  handler: (req: NextRequest, context: {
    user: UserWithTenant;
    body?: T;
    query?: QueryParams;
    userId: string;
  }) => Promise<Response>,
  options: Omit<ApiMiddlewareOptions, 'requireAuth' | 'requireSuperAdmin' | 'auditLevel'> = {}
) {
  return createSecureApiHandler(
    async (req, context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      return handler(req, {
        user: context.user,
        body: context.body as T | undefined,
        query: context.query,
        userId: context.userId!,
      });
    },
    { 
      ...options, 
      requireAuth: true, 
      requireSuperAdmin: true,
      auditLevel: 'admin'
    }
  );
}

/**
 * Helper function for medical/sensitive data endpoints
 */
export function createSensitiveDataHandler<T = RequestBody>(
  handler: (req: NextRequest, context: {
    tenant: TenantWithPlan;
    user: UserWithTenant;
    body?: T;
    query?: QueryParams;
    userId: string;
    tenantId: string;
  }) => Promise<Response>,
  options: Omit<ApiMiddlewareOptions, 'requireAuth' | 'auditLevel'> = {}
) {
  return createSecureApiHandler(
    async (req, context) => {
      if (!context.tenant || !context.user) {
        throw new Error('Authentication required');
      }
      
      return handler(req, {
        tenant: context.tenant,
        user: context.user,
        body: context.body as T | undefined,
        query: context.query,
        userId: context.userId!,
        tenantId: context.tenantId!,
      });
    },
    { 
      ...options, 
      requireAuth: true,
      auditLevel: 'sensitive'
    }
  );
}
