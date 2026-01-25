/**
 * Tests for API v1 Locations Endpoints
 *
 * VETIF-98: Unit tests for /api/v1/locations
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    location: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    tenantApiKey: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
  },
}));

// Mock rate limiter
const mockLimit = jest.fn();
jest.mock('@upstash/ratelimit', () => {
  const MockRatelimit = jest.fn().mockImplementation(() => ({
    limit: mockLimit,
    redis: {},
  }));
  MockRatelimit.slidingWindow = jest.fn().mockReturnValue({});
  return { Ratelimit: MockRatelimit };
});

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({})),
}));

import { prisma } from '@/lib/prisma';
import { GET as listLocations } from '@/app/api/v1/locations/route';
import { GET as getLocation } from '@/app/api/v1/locations/[id]/route';
import { NextRequest } from 'next/server';
import type { AuthenticatedApiKey } from '@/lib/api/api-key-auth';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Helper to create mock NextRequest
function createMockRequest(url: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(url, { headers });
}

// Helper to create mock API key
function createMockApiKey(overrides: Partial<AuthenticatedApiKey> = {}): AuthenticatedApiKey {
  return {
    id: 'key-id',
    tenantId: 'tenant-123',
    name: 'Test Key',
    keyHash: 'hashed-value',
    keyPrefix: 'vfy_abc12345',
    scopes: ['read:locations'],
    isActive: true,
    rateLimit: 1000,
    expiresAt: null,
    locationId: null,
    lastUsed: null,
    createdAt: new Date(),
    createdById: null,
    tenant: { id: 'tenant-123', name: 'Test Clinic' } as AuthenticatedApiKey['tenant'],
    location: null,
    ...overrides,
  };
}

// Helper to create mock location
function createMockLocation(overrides = {}) {
  return {
    id: 'loc-1',
    tenantId: 'tenant-123',
    name: 'Main Office',
    slug: 'main-office',
    address: '123 Test St',
    phone: '555-1234',
    email: 'main@test.com',
    timezone: 'America/Mexico_City',
    isActive: true,
    isPrimary: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ...overrides,
  };
}

const validKey = 'vfy_12345678_abcdef1234567890abcdef1234567890';

describe('API v1 Locations', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'test-token',
    };
    mockLimit.mockResolvedValue({ success: true, remaining: 99, reset: Date.now() + 60000 });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('GET /api/v1/locations', () => {
    it('should return paginated list of locations', async () => {
      const mockApiKey = createMockApiKey();
      const mockLocations = [
        createMockLocation({ id: 'loc-1', isPrimary: true }),
        createMockLocation({ id: 'loc-2', name: 'Branch Office', isPrimary: false }),
      ];

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.location.findMany as jest.Mock).mockResolvedValue(mockLocations);
      (mockPrisma.location.count as jest.Mock).mockResolvedValue(2);

      const request = createMockRequest('https://api.vetify.com/api/v1/locations', {
        authorization: `Bearer ${validKey}`,
      });

      const response = await listLocations(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toHaveLength(2);
      expect(body.meta.total).toBe(2);
      expect(body.meta.hasMore).toBe(false);
      expect(body.data[0]).not.toHaveProperty('tenantId');
    });

    it('should filter by isActive', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.location.findMany as jest.Mock).mockResolvedValue([createMockLocation()]);
      (mockPrisma.location.count as jest.Mock).mockResolvedValue(1);

      const request = createMockRequest(
        'https://api.vetify.com/api/v1/locations?isActive=true',
        { authorization: `Bearer ${validKey}` }
      );

      await listLocations(request);

      expect(mockPrisma.location.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });

    it('should return 401 for missing API key', async () => {
      const request = createMockRequest('https://api.vetify.com/api/v1/locations');

      const response = await listLocations(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for wrong scope', async () => {
      const mockApiKey = createMockApiKey({ scopes: ['write:pets'] });
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest('https://api.vetify.com/api/v1/locations', {
        authorization: `Bearer ${validKey}`,
      });

      const response = await listLocations(request);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.code).toBe('FORBIDDEN');
    });

    it('should respect pagination params', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.location.findMany as jest.Mock).mockResolvedValue([createMockLocation()]);
      (mockPrisma.location.count as jest.Mock).mockResolvedValue(10);

      const request = createMockRequest(
        'https://api.vetify.com/api/v1/locations?limit=5&offset=5',
        { authorization: `Bearer ${validKey}` }
      );

      const response = await listLocations(request);
      const body = await response.json();

      expect(body.meta.limit).toBe(5);
      expect(body.meta.offset).toBe(5);
      expect(mockPrisma.location.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });

    it('should only return scoped location for location-scoped API key', async () => {
      const mockApiKey = createMockApiKey({ locationId: 'loc-1' });
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.location.findMany as jest.Mock).mockResolvedValue([createMockLocation()]);
      (mockPrisma.location.count as jest.Mock).mockResolvedValue(1);

      const request = createMockRequest('https://api.vetify.com/api/v1/locations', {
        authorization: `Bearer ${validKey}`,
      });

      await listLocations(request);

      expect(mockPrisma.location.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'loc-1',
          }),
        })
      );
    });
  });

  describe('GET /api/v1/locations/:id', () => {
    it('should return a single location', async () => {
      const mockApiKey = createMockApiKey();
      const mockLocation = createMockLocation();

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation);

      const request = createMockRequest('https://api.vetify.com/api/v1/locations/loc-1', {
        authorization: `Bearer ${validKey}`,
      });

      const response = await getLocation(request, {
        params: Promise.resolve({ id: 'loc-1' }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.id).toBe('loc-1');
      expect(body.data.name).toBe('Main Office');
      expect(body.data).not.toHaveProperty('tenantId');
    });

    it('should return 404 for non-existent location', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.location.findFirst as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest('https://api.vetify.com/api/v1/locations/non-existent', {
        authorization: `Bearer ${validKey}`,
      });

      const response = await getLocation(request, {
        params: Promise.resolve({ id: 'non-existent' }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.code).toBe('NOT_FOUND');
    });

    it('should return 403 for location-scoped key accessing different location', async () => {
      const mockApiKey = createMockApiKey({ locationId: 'loc-2' });
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest('https://api.vetify.com/api/v1/locations/loc-1', {
        authorization: `Bearer ${validKey}`,
      });

      const response = await getLocation(request, {
        params: Promise.resolve({ id: 'loc-1' }),
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.code).toBe('FORBIDDEN');
    });

    it('should allow location-scoped key to access its own location', async () => {
      const mockApiKey = createMockApiKey({ locationId: 'loc-1' });
      const mockLocation = createMockLocation();

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation);

      const request = createMockRequest('https://api.vetify.com/api/v1/locations/loc-1', {
        authorization: `Bearer ${validKey}`,
      });

      const response = await getLocation(request, {
        params: Promise.resolve({ id: 'loc-1' }),
      });

      expect(response.status).toBe(200);
    });
  });
});
