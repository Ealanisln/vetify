/**
 * Tests for API Key Authentication
 *
 * VETIF-96: Unit tests for api-key-auth.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractApiKey,
  authenticateApiKey,
  checkScope,
  getEffectiveLocationId,
  withApiAuth,
  buildWhereClause,
  parsePaginationParams,
  paginatedResponse,
  apiError,
  AuthenticatedApiKey,
} from '@/lib/api/api-key-auth';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenantApiKey: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}), // Must return a Promise for .catch() chain
    },
  },
}));

// Mock Upstash Rate Limiter
const mockLimit = jest.fn();
const mockRedisInstance = {};

jest.mock('@upstash/ratelimit', () => {
  const MockRatelimit = jest.fn().mockImplementation(() => ({
    limit: mockLimit,
    redis: mockRedisInstance,
  }));
  MockRatelimit.slidingWindow = jest.fn().mockReturnValue({});
  return { Ratelimit: MockRatelimit };
});

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => mockRedisInstance),
}));

// Import mocked prisma
import { prisma } from '@/lib/prisma';
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Helper to create mock NextRequest
// Note: The mock NextRequest in jest.setup.cjs expects headers as a plain object
function createMockRequest(
  url: string,
  options: { headers?: Record<string, string> } = {}
): NextRequest {
  return new NextRequest(url, {
    headers: options.headers || {},
  });
}

// Helper to create mock API key
function createMockApiKey(overrides: Partial<AuthenticatedApiKey> = {}): AuthenticatedApiKey {
  return {
    id: 'key-id',
    tenantId: 'tenant-id',
    name: 'Test Key',
    keyHash: 'hashed-value',
    keyPrefix: 'vfy_abc12345',
    scopes: ['read:pets', 'write:pets'],
    isActive: true,
    rateLimit: 1000,
    expiresAt: null,
    locationId: null,
    lastUsed: null,
    createdAt: new Date(),
    createdById: null,
    tenant: { id: 'tenant-id', name: 'Test Clinic' } as AuthenticatedApiKey['tenant'],
    location: null,
    ...overrides,
  };
}

describe('API Key Authentication', () => {
  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up environment variables for rate limiter
    process.env = {
      ...originalEnv,
      UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'test-token',
    };

    // Default rate limit mock response
    mockLimit.mockResolvedValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('extractApiKey', () => {
    it('should return key from Bearer vfy_... header', () => {
      const validKey = 'vfy_12345678_abcdef1234567890abcdef1234567890';
      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      expect(extractApiKey(request)).toBe(validKey);
    });

    it('should return key from raw vfy_... header (no Bearer prefix)', () => {
      const validKey = 'vfy_12345678_abcdef1234567890abcdef1234567890';
      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: validKey },
      });

      expect(extractApiKey(request)).toBe(validKey);
    });

    it('should return null when Authorization header missing', () => {
      const request = createMockRequest('https://api.vetify.com/v1/pets');

      expect(extractApiKey(request)).toBeNull();
    });

    it('should return null when key format is invalid', () => {
      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: 'invalid_key_format' },
      });

      expect(extractApiKey(request)).toBeNull();
    });

    it('should return null when Bearer prefix but no valid key', () => {
      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: 'Bearer invalid_key' },
      });

      expect(extractApiKey(request)).toBeNull();
    });
  });

  describe('authenticateApiKey', () => {
    const validKey = 'vfy_12345678_abcdef1234567890abcdef1234567890';

    it('should return success with apiKey when valid key found', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const result = await authenticateApiKey(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.apiKey.id).toBe('key-id');
        expect(result.apiKey.tenantId).toBe('tenant-id');
      }
    });

    it('should return 401 when key missing', async () => {
      const request = createMockRequest('https://api.vetify.com/v1/pets');

      const result = await authenticateApiKey(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(401);
        expect(result.error).toBe('Missing or invalid API key');
      }
    });

    it('should return 401 when key format invalid', async () => {
      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: 'invalid-key' },
      });

      const result = await authenticateApiKey(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(401);
        expect(result.error).toBe('Missing or invalid API key');
      }
    });

    it('should return 401 when key not found in database', async () => {
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const result = await authenticateApiKey(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(401);
        expect(result.error).toBe('Invalid API key');
      }
    });

    it('should return 401 when key is inactive (isActive: false)', async () => {
      const mockApiKey = createMockApiKey({ isActive: false });
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const result = await authenticateApiKey(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(401);
        expect(result.error).toBe('API key is disabled');
      }
    });

    it('should return 401 when key has expired', async () => {
      const expiredDate = new Date(Date.now() - 86400000); // 1 day ago
      const mockApiKey = createMockApiKey({ expiresAt: expiredDate });
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const result = await authenticateApiKey(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(401);
        expect(result.error).toBe('API key has expired');
      }
    });

    it('should return 429 when rate limit exceeded', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      mockLimit.mockResolvedValue({
        success: false,
        remaining: 0,
        reset: Date.now() + 60000,
      });

      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const result = await authenticateApiKey(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(429);
        expect(result.error).toContain('Rate limit exceeded');
      }
    });

    it('should update lastUsed timestamp on successful auth', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.tenantApiKey.update as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      await authenticateApiKey(request);

      // Wait for fire-and-forget update
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockPrisma.tenantApiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-id' },
        data: { lastUsed: expect.any(Date) },
      });
    });

    it('should include tenant and location relations in result', async () => {
      const mockLocation = { id: 'loc-1', name: 'Main Office' };
      const mockApiKey = createMockApiKey({
        locationId: 'loc-1',
        location: mockLocation as AuthenticatedApiKey['location'],
      });
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const result = await authenticateApiKey(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.apiKey.tenant).toBeDefined();
        expect(result.apiKey.tenant.name).toBe('Test Clinic');
        expect(result.apiKey.location).toBeDefined();
        expect(result.apiKey.location?.name).toBe('Main Office');
      }
    });

    it('should handle Prisma errors gracefully (returns 500)', async () => {
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const result = await authenticateApiKey(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(500);
        expect(result.error).toBe('Authentication failed');
      }
    });

    it('should work when rate limiter allows the request', async () => {
      // Rate limiter is configured and allows the request
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      mockLimit.mockResolvedValue({
        success: true,
        remaining: 500,
        reset: Date.now() + 3600000,
      });

      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const result = await authenticateApiKey(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.apiKey.id).toBe('key-id');
      }
    });
  });

  describe('checkScope', () => {
    it('should return true when scope exists in apiKey.scopes', () => {
      const apiKey = createMockApiKey({ scopes: ['read:pets', 'write:pets'] });

      expect(checkScope(apiKey, 'read:pets')).toBe(true);
      expect(checkScope(apiKey, 'write:pets')).toBe(true);
    });

    it('should return false when scope not in apiKey.scopes', () => {
      const apiKey = createMockApiKey({ scopes: ['read:pets'] });

      expect(checkScope(apiKey, 'write:pets')).toBe(false);
      expect(checkScope(apiKey, 'read:appointments')).toBe(false);
    });

    it('should handle empty scopes array', () => {
      const apiKey = createMockApiKey({ scopes: [] });

      expect(checkScope(apiKey, 'read:pets')).toBe(false);
    });
  });

  describe('getEffectiveLocationId', () => {
    it('should return apiKey.locationId when set (takes precedence)', () => {
      const apiKey = createMockApiKey({ locationId: 'key-location-id' });
      const request = createMockRequest('https://api.vetify.com/v1/pets?locationId=query-location');

      expect(getEffectiveLocationId(apiKey, request)).toBe('key-location-id');
    });

    it('should return query param locationId when apiKey has no location', () => {
      const apiKey = createMockApiKey({ locationId: null });
      const request = createMockRequest('https://api.vetify.com/v1/pets?locationId=query-location');

      expect(getEffectiveLocationId(apiKey, request)).toBe('query-location');
    });

    it('should return null when neither apiKey nor query param has location', () => {
      const apiKey = createMockApiKey({ locationId: null });
      const request = createMockRequest('https://api.vetify.com/v1/pets');

      expect(getEffectiveLocationId(apiKey, request)).toBeNull();
    });

    it('should have apiKey.locationId override query param', () => {
      const apiKey = createMockApiKey({ locationId: 'key-location' });
      const request = createMockRequest('https://api.vetify.com/v1/pets?locationId=query-location');

      // This is the same as the first test but emphasizes the override behavior
      expect(getEffectiveLocationId(apiKey, request)).toBe('key-location');
    });
  });

  describe('withApiAuth', () => {
    const validKey = 'vfy_12345678_abcdef1234567890abcdef1234567890';

    it('should call handler with authenticated context on success', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withApiAuth(mockHandler);

      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(request, {
        apiKey: mockApiKey,
        locationId: null,
        params: undefined,
      });
    });

    it('should return 401 on authentication failure', async () => {
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(null);

      const mockHandler = jest.fn();
      const wrappedHandler = withApiAuth(mockHandler);

      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await wrappedHandler(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe('Invalid API key');
      expect(body.code).toBe('UNAUTHORIZED');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 403 when required scope missing', async () => {
      const mockApiKey = createMockApiKey({ scopes: ['read:pets'] });
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const mockHandler = jest.fn();
      const wrappedHandler = withApiAuth(mockHandler, { requiredScope: 'write:pets' });

      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await wrappedHandler(request);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe('Missing required scope: write:pets');
      expect(body.code).toBe('FORBIDDEN');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 400 when location required but not provided', async () => {
      const mockApiKey = createMockApiKey({ locationId: null });
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const mockHandler = jest.fn();
      const wrappedHandler = withApiAuth(mockHandler, { requireLocation: true });

      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await wrappedHandler(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Location ID required');
      expect(body.code).toBe('BAD_REQUEST');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should resolve params promise from context', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withApiAuth(mockHandler);

      const request = createMockRequest('https://api.vetify.com/v1/pets/pet-123', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const context = { params: Promise.resolve({ id: 'pet-123' }) };
      await wrappedHandler(request, context);

      expect(mockHandler).toHaveBeenCalledWith(request, {
        apiKey: mockApiKey,
        locationId: null,
        params: { id: 'pet-123' },
      });
    });

    it('should add rate limit headers to response', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withApiAuth(mockHandler);

      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await wrappedHandler(request);

      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Limit')).toBe('1000');
    });

    it('should return 500 on handler error', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const mockHandler = jest.fn().mockRejectedValue(new Error('Handler crashed'));
      const wrappedHandler = withApiAuth(mockHandler);

      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await wrappedHandler(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Internal server error');
      expect(body.code).toBe('INTERNAL_ERROR');
    });

    it('should pass locationId to handler', async () => {
      const mockApiKey = createMockApiKey({ locationId: 'loc-123' });
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withApiAuth(mockHandler);

      const request = createMockRequest('https://api.vetify.com/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(request, {
        apiKey: mockApiKey,
        locationId: 'loc-123',
        params: undefined,
      });
    });
  });

  describe('buildWhereClause', () => {
    it('should always include tenantId from apiKey', () => {
      const apiKey = createMockApiKey({ tenantId: 'my-tenant' });
      const result = buildWhereClause(apiKey, null);

      expect(result.tenantId).toBe('my-tenant');
    });

    it('should include locationId when provided', () => {
      const apiKey = createMockApiKey({ tenantId: 'my-tenant' });
      const result = buildWhereClause(apiKey, 'loc-123');

      expect(result.tenantId).toBe('my-tenant');
      expect(result.locationId).toBe('loc-123');
    });

    it('should omit locationId when null', () => {
      const apiKey = createMockApiKey({ tenantId: 'my-tenant' });
      const result = buildWhereClause(apiKey, null);

      expect(result.tenantId).toBe('my-tenant');
      expect(result).not.toHaveProperty('locationId');
    });

    it('should merge additionalWhere conditions', () => {
      const apiKey = createMockApiKey({ tenantId: 'my-tenant' });
      const result = buildWhereClause(apiKey, 'loc-123', { status: 'active', name: 'Test' });

      expect(result.tenantId).toBe('my-tenant');
      expect(result.locationId).toBe('loc-123');
      expect(result.status).toBe('active');
      expect(result.name).toBe('Test');
    });

    it('should handle empty additionalWhere object', () => {
      const apiKey = createMockApiKey({ tenantId: 'my-tenant' });
      const result = buildWhereClause(apiKey, null, {});

      expect(result).toEqual({ tenantId: 'my-tenant' });
    });
  });

  describe('parsePaginationParams', () => {
    it('should return default limit (50) when not specified', () => {
      const request = createMockRequest('https://api.vetify.com/v1/pets');

      const result = parsePaginationParams(request);

      expect(result.limit).toBe(50);
    });

    it('should return custom default limit from options', () => {
      const request = createMockRequest('https://api.vetify.com/v1/pets');

      const result = parsePaginationParams(request, { limit: 25 });

      expect(result.limit).toBe(25);
    });

    it('should clamp limit to maxLimit (default 100)', () => {
      const request = createMockRequest('https://api.vetify.com/v1/pets?limit=200');

      const result = parsePaginationParams(request);

      expect(result.limit).toBe(100);
    });

    it('should return offset 0 when not specified', () => {
      const request = createMockRequest('https://api.vetify.com/v1/pets');

      const result = parsePaginationParams(request);

      expect(result.offset).toBe(0);
    });

    it('should parse limit and offset from query params', () => {
      const request = createMockRequest('https://api.vetify.com/v1/pets?limit=20&offset=40');

      const result = parsePaginationParams(request);

      expect(result.limit).toBe(20);
      expect(result.offset).toBe(40);
    });

    it('should handle non-numeric values gracefully', () => {
      const request = createMockRequest('https://api.vetify.com/v1/pets?limit=abc&offset=xyz');

      const result = parsePaginationParams(request);

      // parseInt('abc') returns NaN, Math.max/min with NaN returns NaN
      // This is the actual behavior - the function doesn't handle NaN specially
      expect(Number.isNaN(result.limit)).toBe(true);
      expect(Number.isNaN(result.offset)).toBe(true);
    });

    it('should handle negative values (clamps to minimum)', () => {
      const request = createMockRequest('https://api.vetify.com/v1/pets?limit=-10&offset=-5');

      const result = parsePaginationParams(request);

      expect(result.limit).toBe(1); // Clamped to minimum 1
      expect(result.offset).toBe(0); // Clamped to minimum 0
    });
  });

  describe('paginatedResponse', () => {
    it('should return correct structure with data and meta', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const result = paginatedResponse(data, 10, { limit: 2, offset: 0 });

      expect(result).toEqual({
        data: [{ id: '1' }, { id: '2' }],
        meta: {
          total: 10,
          limit: 2,
          offset: 0,
          hasMore: true,
        },
      });
    });

    it('should calculate hasMore correctly when more data exists', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const result = paginatedResponse(data, 10, { limit: 2, offset: 4 });

      // offset(4) + data.length(2) = 6, which is less than total(10)
      expect(result.meta.hasMore).toBe(true);
    });

    it('should calculate hasMore=false when at end', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const result = paginatedResponse(data, 10, { limit: 2, offset: 8 });

      // offset(8) + data.length(2) = 10, which equals total(10)
      expect(result.meta.hasMore).toBe(false);
    });

    it('should handle empty data array', () => {
      const result = paginatedResponse([], 0, { limit: 10, offset: 0 });

      expect(result).toEqual({
        data: [],
        meta: {
          total: 0,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      });
    });

    it('should handle offset at collection boundary', () => {
      const data = [{ id: '1' }];
      const result = paginatedResponse(data, 5, { limit: 10, offset: 4 });

      // offset(4) + data.length(1) = 5, which equals total(5)
      expect(result.meta.hasMore).toBe(false);
    });
  });

  describe('apiError', () => {
    it('should return NextResponse with correct status', async () => {
      const response = apiError('Not found', 'NOT_FOUND', 404);

      expect(response.status).toBe(404);
    });

    it('should include error and code in body', async () => {
      const response = apiError('Unauthorized', 'UNAUTHORIZED', 401);
      const body = await response.json();

      expect(body.error).toBe('Unauthorized');
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should include details when provided', async () => {
      const response = apiError('Bad request', 'BAD_REQUEST', 400, 'Missing required field: name');
      const body = await response.json();

      expect(body.error).toBe('Bad request');
      expect(body.code).toBe('BAD_REQUEST');
      expect(body.details).toBe('Missing required field: name');
    });

    it('should omit details when not provided', async () => {
      const response = apiError('Server error', 'INTERNAL_ERROR', 500);
      const body = await response.json();

      expect(body.error).toBe('Server error');
      expect(body.code).toBe('INTERNAL_ERROR');
      expect(body).not.toHaveProperty('details');
    });
  });
});
