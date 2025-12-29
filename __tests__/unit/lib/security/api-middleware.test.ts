/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createSecureApiHandler,
  createTenantScopedHandler,
  createAdminHandler,
  createSensitiveDataHandler,
  commonValidationSchemas,
  ApiMiddlewareOptions,
} from '@/lib/security/api-middleware';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/security/input-sanitization', () => ({
  validateRequestBody: jest.fn(),
  validateQueryParams: jest.fn(),
  createSecureErrorResponse: jest.fn((message: string, status: number) => {
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
}));

jest.mock('@/lib/security/audit-logger', () => ({
  logDataAccessEvent: jest.fn(),
  logSensitiveDataAccess: jest.fn(),
  logSecurityEvent: jest.fn(),
}));

import { requireAuth } from '@/lib/auth';
import {
  validateRequestBody,
  validateQueryParams,
  createSecureErrorResponse,
} from '@/lib/security/input-sanitization';
import {
  logDataAccessEvent,
  logSensitiveDataAccess,
  logSecurityEvent,
} from '@/lib/security/audit-logger';

const mockRequireAuth = requireAuth as jest.Mock;
const mockValidateRequestBody = validateRequestBody as jest.Mock;
const mockValidateQueryParams = validateQueryParams as jest.Mock;
const mockLogDataAccessEvent = logDataAccessEvent as jest.Mock;
const mockLogSensitiveDataAccess = logSensitiveDataAccess as jest.Mock;
const mockLogSecurityEvent = logSecurityEvent as jest.Mock;

describe('api-middleware', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
  };

  const mockTenant = {
    id: 'tenant-123',
    name: 'Test Clinic',
    plan: 'professional',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      user: mockUser,
      tenant: mockTenant,
    });
    mockValidateRequestBody.mockResolvedValue({ success: true, data: {} });
    mockValidateQueryParams.mockReturnValue({ success: true, data: {} });
  });

  describe('createSecureApiHandler', () => {
    describe('authentication', () => {
      it('should call requireAuth by default', async () => {
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler);

        const request = new NextRequest('http://localhost:3000/api/test');
        await secureHandler(request);

        expect(mockRequireAuth).toHaveBeenCalled();
      });

      it('should skip auth when requireAuth is false', async () => {
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler, { requireAuth: false });

        const request = new NextRequest('http://localhost:3000/api/test');
        await secureHandler(request);

        expect(mockRequireAuth).not.toHaveBeenCalled();
      });

      it('should return 401 when auth fails', async () => {
        mockRequireAuth.mockRejectedValue(new Error('Not authenticated'));
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler);

        const request = new NextRequest('http://localhost:3000/api/test');
        const response = await secureHandler(request);

        expect(response.status).toBe(401);
        expect(handler).not.toHaveBeenCalled();
      });

      it('should log security event when auth fails', async () => {
        mockRequireAuth.mockRejectedValue(new Error('Not authenticated'));
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler);

        const request = new NextRequest('http://localhost:3000/api/test');
        await secureHandler(request);

        expect(mockLogSecurityEvent).toHaveBeenCalledWith(
          request,
          'permission_denied',
          undefined,
          expect.objectContaining({
            reason: 'Authentication required',
          })
        );
      });
    });

    describe('body validation', () => {
      it('should not validate body for GET requests', async () => {
        const bodySchema = z.object({ name: z.string() });
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler, { bodySchema });

        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'GET',
        });
        await secureHandler(request);

        // Body validation should not be called for GET requests
        expect(mockValidateRequestBody).not.toHaveBeenCalled();
        expect(handler).toHaveBeenCalled();
      });

      it('should not validate body for HEAD requests', async () => {
        const bodySchema = z.object({ name: z.string() });
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler, { bodySchema });

        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'HEAD',
        });
        await secureHandler(request);

        expect(mockValidateRequestBody).not.toHaveBeenCalled();
        expect(handler).toHaveBeenCalled();
      });

      it('should not validate body for DELETE requests', async () => {
        const bodySchema = z.object({ name: z.string() });
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler, { bodySchema });

        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'DELETE',
        });
        await secureHandler(request);

        expect(mockValidateRequestBody).not.toHaveBeenCalled();
        expect(handler).toHaveBeenCalled();
      });
    });

    describe('query validation', () => {
      it('should validate query params when querySchema is provided', async () => {
        const querySchema = z.object({ page: z.string() });
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler, { querySchema });

        const request = new NextRequest('http://localhost:3000/api/test?page=1');
        await secureHandler(request);

        expect(mockValidateQueryParams).toHaveBeenCalled();
      });

      it('should return 400 when query validation fails', async () => {
        mockValidateQueryParams.mockReturnValue({
          success: false,
          error: 'Invalid page parameter',
        });
        const querySchema = z.object({ page: z.string() });
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler, { querySchema });

        const request = new NextRequest('http://localhost:3000/api/test?page=invalid');
        const response = await secureHandler(request);

        expect(response.status).toBe(400);
      });

      it('should pass validated query to handler', async () => {
        const validatedQuery = { page: '1', limit: '10' };
        mockValidateQueryParams.mockReturnValue({
          success: true,
          data: validatedQuery,
        });
        const querySchema = z.object({ page: z.string() });
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler, { querySchema });

        const request = new NextRequest('http://localhost:3000/api/test?page=1&limit=10');
        await secureHandler(request);

        expect(handler).toHaveBeenCalledWith(
          request,
          expect.objectContaining({
            query: validatedQuery,
          })
        );
      });
    });

    describe('audit logging', () => {
      it('should log data access for GET requests', async () => {
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler, {
          resourceType: 'pets',
        });

        const request = new NextRequest('http://localhost:3000/api/pets', {
          method: 'GET',
        });
        await secureHandler(request);

        expect(mockLogDataAccessEvent).toHaveBeenCalledWith(
          request,
          'data_access',
          mockUser.id,
          mockTenant.id,
          'pets',
          undefined,
          true,
          expect.objectContaining({ method: 'GET' })
        );
      });

      it('should log data_create for POST requests', async () => {
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler, {
          resourceType: 'pets',
        });

        const request = new NextRequest('http://localhost:3000/api/pets', {
          method: 'POST',
        });
        await secureHandler(request);

        expect(mockLogDataAccessEvent).toHaveBeenCalledWith(
          request,
          'data_create',
          expect.any(String),
          expect.any(String),
          'pets',
          undefined,
          true,
          expect.objectContaining({ method: 'POST' })
        );
      });

      it('should log data_update for PUT requests', async () => {
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler, {
          resourceType: 'pets',
        });

        const request = new NextRequest('http://localhost:3000/api/pets/123', {
          method: 'PUT',
        });
        await secureHandler(request);

        expect(mockLogDataAccessEvent).toHaveBeenCalledWith(
          request,
          'data_update',
          expect.any(String),
          expect.any(String),
          'pets',
          undefined,
          true,
          expect.objectContaining({ method: 'PUT' })
        );
      });

      it('should log data_delete for DELETE requests', async () => {
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler, {
          resourceType: 'pets',
        });

        const request = new NextRequest('http://localhost:3000/api/pets/123', {
          method: 'DELETE',
        });
        await secureHandler(request);

        expect(mockLogDataAccessEvent).toHaveBeenCalledWith(
          request,
          'data_delete',
          expect.any(String),
          expect.any(String),
          'pets',
          undefined,
          true,
          expect.objectContaining({ method: 'DELETE' })
        );
      });

      it('should log sensitive data access for sensitive audit level', async () => {
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler, {
          auditLevel: 'sensitive',
          resourceType: 'medical_records',
        });

        const request = new NextRequest('http://localhost:3000/api/records', {
          method: 'GET',
        });
        await secureHandler(request);

        expect(mockLogSensitiveDataAccess).toHaveBeenCalledWith(
          request,
          mockUser.id,
          mockTenant.id,
          'medical_records',
          undefined,
          expect.objectContaining({ method: 'GET' })
        );
      });

      it('should log admin access for admin audit level', async () => {
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler, {
          auditLevel: 'admin',
          resourceType: 'admin_settings',
        });

        const request = new NextRequest('http://localhost:3000/api/admin', {
          method: 'GET',
        });
        await secureHandler(request);

        expect(mockLogDataAccessEvent).toHaveBeenCalledWith(
          request,
          'data_access',
          mockUser.id,
          expect.any(String),
          'admin_settings',
          undefined,
          true,
          expect.objectContaining({ method: 'GET' })
        );
      });
    });

    describe('handler execution', () => {
      it('should pass user and tenant to handler', async () => {
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler);

        const request = new NextRequest('http://localhost:3000/api/test');
        await secureHandler(request);

        expect(handler).toHaveBeenCalledWith(
          request,
          expect.objectContaining({
            user: mockUser,
            tenant: mockTenant,
            userId: mockUser.id,
            tenantId: mockTenant.id,
          })
        );
      });

      it('should add X-Response-Time header to response', async () => {
        const handler = jest.fn().mockResolvedValue(new Response('OK'));
        const secureHandler = createSecureApiHandler(handler);

        const request = new NextRequest('http://localhost:3000/api/test');
        const response = await secureHandler(request);

        expect(response.headers.get('X-Response-Time')).toMatch(/^\d+ms$/);
      });
    });

    describe('error handling', () => {
      it('should catch handler errors and return 500', async () => {
        const handler = jest.fn().mockRejectedValue(new Error('Handler failed'));
        const secureHandler = createSecureApiHandler(handler);

        const request = new NextRequest('http://localhost:3000/api/test');
        const response = await secureHandler(request);

        expect(response.status).toBe(500);
      });

      it('should log error when handler fails', async () => {
        const handler = jest.fn().mockRejectedValue(new Error('Handler failed'));
        const secureHandler = createSecureApiHandler(handler);

        const request = new NextRequest('http://localhost:3000/api/test');
        await secureHandler(request);

        expect(mockLogSecurityEvent).toHaveBeenCalledWith(
          request,
          'security_event',
          mockUser.id,
          expect.objectContaining({
            error: 'Handler failed',
          })
        );
      });

      it('should return appropriate error message in development', async () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        const errorMessage = 'Specific error message';
        const handler = jest.fn().mockRejectedValue(new Error(errorMessage));
        const secureHandler = createSecureApiHandler(handler);

        const request = new NextRequest('http://localhost:3000/api/test');
        const response = await secureHandler(request);

        expect(response.status).toBe(500);

        process.env.NODE_ENV = originalNodeEnv;
      });
    });
  });

  describe('commonValidationSchemas', () => {
    describe('idParam', () => {
      it('should validate valid ID', () => {
        const result = commonValidationSchemas.idParam.safeParse({ id: 'abc-123' });
        expect(result.success).toBe(true);
      });

      it('should reject empty ID', () => {
        const result = commonValidationSchemas.idParam.safeParse({ id: '' });
        expect(result.success).toBe(false);
      });

      it('should reject ID with special characters', () => {
        const result = commonValidationSchemas.idParam.safeParse({ id: 'id<script>' });
        expect(result.success).toBe(false);
      });

      it('should reject ID over 50 characters', () => {
        const result = commonValidationSchemas.idParam.safeParse({ id: 'a'.repeat(51) });
        expect(result.success).toBe(false);
      });

      it('should accept underscore and hyphen', () => {
        const result = commonValidationSchemas.idParam.safeParse({ id: 'my_id-123' });
        expect(result.success).toBe(true);
      });
    });

    describe('paginationQuery', () => {
      it('should validate valid pagination', () => {
        const result = commonValidationSchemas.paginationQuery.safeParse({
          page: '1',
          limit: '10',
          sortBy: 'name',
          sortOrder: 'asc',
        });
        expect(result.success).toBe(true);
      });

      it('should allow optional fields', () => {
        const result = commonValidationSchemas.paginationQuery.safeParse({});
        expect(result.success).toBe(true);
      });

      it('should reject non-numeric page', () => {
        const result = commonValidationSchemas.paginationQuery.safeParse({ page: 'abc' });
        expect(result.success).toBe(false);
      });

      it('should reject invalid sortOrder', () => {
        const result = commonValidationSchemas.paginationQuery.safeParse({ sortOrder: 'invalid' });
        expect(result.success).toBe(false);
      });

      it('should transform page to number', () => {
        const result = commonValidationSchemas.paginationQuery.safeParse({ page: '5' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(5);
        }
      });
    });

    describe('dateRangeQuery', () => {
      it('should validate valid date range', () => {
        const result = commonValidationSchemas.dateRangeQuery.safeParse({
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z',
        });
        expect(result.success).toBe(true);
      });

      it('should allow optional dates', () => {
        const result = commonValidationSchemas.dateRangeQuery.safeParse({});
        expect(result.success).toBe(true);
      });

      it('should reject invalid date format', () => {
        const result = commonValidationSchemas.dateRangeQuery.safeParse({
          startDate: '2024-01-01',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('searchQuery', () => {
      it('should validate valid search query', () => {
        const result = commonValidationSchemas.searchQuery.safeParse({
          q: 'search term',
          category: 'pets',
        });
        expect(result.success).toBe(true);
      });

      it('should allow optional fields', () => {
        const result = commonValidationSchemas.searchQuery.safeParse({});
        expect(result.success).toBe(true);
      });

      it('should reject query over 100 characters', () => {
        const result = commonValidationSchemas.searchQuery.safeParse({
          q: 'a'.repeat(101),
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('createTenantScopedHandler', () => {
    it('should require authentication', async () => {
      const handler = jest.fn().mockResolvedValue(new Response('OK'));
      const secureHandler = createTenantScopedHandler(handler);

      const request = new NextRequest('http://localhost:3000/api/test');
      await secureHandler(request);

      expect(mockRequireAuth).toHaveBeenCalled();
    });

    it('should pass tenant and user to handler', async () => {
      const handler = jest.fn().mockResolvedValue(new Response('OK'));
      const secureHandler = createTenantScopedHandler(handler);

      const request = new NextRequest('http://localhost:3000/api/test');
      await secureHandler(request);

      expect(handler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          tenant: mockTenant,
          user: mockUser,
          tenantId: mockTenant.id,
          userId: mockUser.id,
        })
      );
    });

    it('should throw error if tenant is missing', async () => {
      mockRequireAuth.mockResolvedValue({ user: mockUser, tenant: null });
      const handler = jest.fn().mockResolvedValue(new Response('OK'));
      const secureHandler = createTenantScopedHandler(handler);

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await secureHandler(request);

      expect(response.status).toBe(500);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('createAdminHandler', () => {
    it('should require authentication', async () => {
      const handler = jest.fn().mockResolvedValue(new Response('OK'));
      const secureHandler = createAdminHandler(handler);

      const request = new NextRequest('http://localhost:3000/api/admin/test');
      await secureHandler(request);

      expect(mockRequireAuth).toHaveBeenCalled();
    });

    it('should use admin audit level', async () => {
      const handler = jest.fn().mockResolvedValue(new Response('OK'));
      const secureHandler = createAdminHandler(handler);

      const request = new NextRequest('http://localhost:3000/api/admin/test', {
        method: 'GET',
      });
      await secureHandler(request);

      expect(mockLogDataAccessEvent).toHaveBeenCalledWith(
        expect.any(NextRequest),
        'data_access',
        expect.any(String),
        expect.any(String),
        expect.any(String),
        undefined,
        true,
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should pass user to handler', async () => {
      const handler = jest.fn().mockResolvedValue(new Response('OK'));
      const secureHandler = createAdminHandler(handler);

      const request = new NextRequest('http://localhost:3000/api/admin/test');
      await secureHandler(request);

      expect(handler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          user: mockUser,
          userId: mockUser.id,
        })
      );
    });
  });

  describe('createSensitiveDataHandler', () => {
    it('should require authentication', async () => {
      const handler = jest.fn().mockResolvedValue(new Response('OK'));
      const secureHandler = createSensitiveDataHandler(handler);

      const request = new NextRequest('http://localhost:3000/api/medical');
      await secureHandler(request);

      expect(mockRequireAuth).toHaveBeenCalled();
    });

    it('should log sensitive data access', async () => {
      const handler = jest.fn().mockResolvedValue(new Response('OK'));
      const secureHandler = createSensitiveDataHandler(handler, {
        resourceType: 'medical_records',
      });

      const request = new NextRequest('http://localhost:3000/api/medical', {
        method: 'GET',
      });
      await secureHandler(request);

      expect(mockLogSensitiveDataAccess).toHaveBeenCalledWith(
        request,
        mockUser.id,
        mockTenant.id,
        'medical_records',
        undefined,
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should pass tenant and user to handler', async () => {
      const handler = jest.fn().mockResolvedValue(new Response('OK'));
      const secureHandler = createSensitiveDataHandler(handler);

      const request = new NextRequest('http://localhost:3000/api/medical');
      await secureHandler(request);

      expect(handler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          tenant: mockTenant,
          user: mockUser,
          tenantId: mockTenant.id,
          userId: mockUser.id,
        })
      );
    });

    it('should throw error if user is missing', async () => {
      mockRequireAuth.mockResolvedValue({ user: null, tenant: mockTenant });
      const handler = jest.fn().mockResolvedValue(new Response('OK'));
      const secureHandler = createSensitiveDataHandler(handler);

      const request = new NextRequest('http://localhost:3000/api/medical');
      const response = await secureHandler(request);

      expect(response.status).toBe(500);
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
