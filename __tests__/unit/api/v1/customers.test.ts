/**
 * Tests for API v1 Customers Endpoints
 *
 * VETIF-98: Unit tests for /api/v1/customers
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    customer: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    location: {
      findFirst: jest.fn(),
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
import { GET as listCustomers, POST as createCustomer } from '@/app/api/v1/customers/route';
import { GET as getCustomer, PUT as updateCustomer, DELETE as deleteCustomer } from '@/app/api/v1/customers/[id]/route';
import { NextRequest } from 'next/server';
import type { AuthenticatedApiKey } from '@/lib/api/api-key-auth';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function createMockRequest(
  url: string,
  options: { headers?: Record<string, string>; body?: Record<string, unknown> } = {}
): NextRequest {
  const init: RequestInit = { headers: options.headers || {} };
  if (options.body) {
    init.method = 'POST';
    init.body = JSON.stringify(options.body);
  }
  return new NextRequest(url, init);
}

function createMockApiKey(overrides: Partial<AuthenticatedApiKey> = {}): AuthenticatedApiKey {
  return {
    id: 'key-id',
    tenantId: 'tenant-123',
    name: 'Test Key',
    keyHash: 'hashed-value',
    keyPrefix: 'vfy_abc12345',
    scopes: ['read:customers', 'write:customers'],
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

function createMockCustomer(overrides = {}) {
  return {
    id: 'cust-1',
    tenantId: 'tenant-123',
    locationId: null,
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    name: 'John Doe',
    phone: '555-1234',
    address: '123 Test St',
    preferredContactMethod: 'phone',
    notes: 'VIP customer',
    isActive: true,
    source: 'MANUAL',
    needsReview: false,
    reviewedAt: null,
    reviewedBy: null,
    mergedFrom: [],
    userId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

const validKey = 'vfy_12345678_abcdef1234567890abcdef1234567890';

describe('API v1 Customers', () => {
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

  describe('GET /api/v1/customers', () => {
    it('should return paginated list of customers', async () => {
      const mockApiKey = createMockApiKey();
      const mockCustomers = [
        createMockCustomer({ id: 'cust-1' }),
        createMockCustomer({ id: 'cust-2', name: 'Jane Doe' }),
      ];

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);
      (mockPrisma.customer.count as jest.Mock).mockResolvedValue(2);

      const request = createMockRequest('https://api.vetify.com/api/v1/customers', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await listCustomers(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toHaveLength(2);
      expect(body.meta.total).toBe(2);
      expect(body.data[0]).not.toHaveProperty('tenantId');
    });

    it('should return 401 for missing API key', async () => {
      const request = createMockRequest('https://api.vetify.com/api/v1/customers');
      const response = await listCustomers(request);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/customers', () => {
    it('should create a new customer', async () => {
      const mockApiKey = createMockApiKey();
      const newCustomer = createMockCustomer();

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.customer.create as jest.Mock).mockResolvedValue(newCustomer);

      const request = createMockRequest('https://api.vetify.com/api/v1/customers', {
        headers: { authorization: `Bearer ${validKey}` },
        body: { name: 'John Doe', email: 'john@example.com' },
      });

      const response = await createCustomer(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.data.name).toBe('John Doe');
    });

    it('should validate required name field', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest('https://api.vetify.com/api/v1/customers', {
        headers: { authorization: `Bearer ${validKey}` },
        body: { email: 'john@example.com' },
      });

      const response = await createCustomer(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/customers/:id', () => {
    it('should return a single customer', async () => {
      const mockApiKey = createMockApiKey();
      const mockCustomer = {
        ...createMockCustomer(),
        pets: [{ id: 'pet-1', name: 'Max', species: 'Dog', breed: 'Labrador' }],
      };

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer);

      const request = createMockRequest('https://api.vetify.com/api/v1/customers/cust-1', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await getCustomer(request, {
        params: Promise.resolve({ id: 'cust-1' }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.id).toBe('cust-1');
    });

    it('should return 404 for non-existent customer', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest('https://api.vetify.com/api/v1/customers/non-existent', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await getCustomer(request, {
        params: Promise.resolve({ id: 'non-existent' }),
      });
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/customers/:id', () => {
    it('should update a customer', async () => {
      const mockApiKey = createMockApiKey();
      const existingCustomer = createMockCustomer();
      const updatedCustomer = { ...existingCustomer, name: 'John Updated' };

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.customer.findFirst as jest.Mock).mockResolvedValue(existingCustomer);
      (mockPrisma.customer.update as jest.Mock).mockResolvedValue(updatedCustomer);

      const request = createMockRequest('https://api.vetify.com/api/v1/customers/cust-1', {
        headers: { authorization: `Bearer ${validKey}` },
        body: { name: 'John Updated' },
      });

      const response = await updateCustomer(request, {
        params: Promise.resolve({ id: 'cust-1' }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.name).toBe('John Updated');
    });
  });

  describe('DELETE /api/v1/customers/:id', () => {
    it('should soft delete customer by setting isActive to false', async () => {
      const mockApiKey = createMockApiKey();
      const existingCustomer = createMockCustomer();

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.customer.findFirst as jest.Mock).mockResolvedValue(existingCustomer);
      (mockPrisma.customer.update as jest.Mock).mockResolvedValue({ ...existingCustomer, isActive: false });

      const request = createMockRequest('https://api.vetify.com/api/v1/customers/cust-1', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await deleteCustomer(request, {
        params: Promise.resolve({ id: 'cust-1' }),
      });

      expect(response.status).toBe(204);
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'cust-1' },
        data: { isActive: false },
      });
    });
  });
});
