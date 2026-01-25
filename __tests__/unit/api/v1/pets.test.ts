/**
 * Tests for API v1 Pets Endpoints
 *
 * VETIF-98: Unit tests for /api/v1/pets
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    pet: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
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

// Mock webhooks module to prevent actual webhook triggering
jest.mock('@/lib/webhooks', () => ({
  triggerWebhookEvent: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { GET as listPets, POST as createPet } from '@/app/api/v1/pets/route';
import { GET as getPet, PUT as updatePet, DELETE as deletePet } from '@/app/api/v1/pets/[id]/route';
import { NextRequest } from 'next/server';
import type { AuthenticatedApiKey } from '@/lib/api/api-key-auth';
import { Decimal } from '@prisma/client/runtime/library';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Helper to create mock NextRequest
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

// Helper to create mock API key
function createMockApiKey(overrides: Partial<AuthenticatedApiKey> = {}): AuthenticatedApiKey {
  return {
    id: 'key-id',
    tenantId: TEST_TENANT_ID,
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
    tenant: { id: TEST_TENANT_ID, name: 'Test Clinic' } as AuthenticatedApiKey['tenant'],
    location: null,
    ...overrides,
  };
}

// Helper to create mock pet
function createMockPet(overrides = {}) {
  return {
    id: TEST_PET_ID,
    tenantId: TEST_TENANT_ID,
    locationId: null,
    customerId: TEST_CUSTOMER_ID,
    internalId: 'PET-001',
    name: 'Max',
    species: 'Dog',
    breed: 'Labrador',
    dateOfBirth: new Date('2020-01-15'),
    gender: 'male',
    weight: new Decimal(25.5),
    weightUnit: 'kg',
    microchipNumber: '123456789',
    isNeutered: true,
    isDeceased: false,
    profileImage: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// Helper to create mock customer
function createMockCustomer(overrides = {}) {
  return {
    id: TEST_CUSTOMER_ID,
    tenantId: TEST_TENANT_ID,
    locationId: null,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
    isActive: true,
    ...overrides,
  };
}

const validKey = 'vfy_12345678_abcdef1234567890abcdef1234567890';

// Valid UUIDs for testing
const TEST_TENANT_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_CUSTOMER_ID = '123e4567-e89b-12d3-a456-426614174001';
const TEST_PET_ID = '123e4567-e89b-12d3-a456-426614174002';
const TEST_LOCATION_ID = '123e4567-e89b-12d3-a456-426614174003';

describe('API v1 Pets', () => {
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

  describe('GET /api/v1/pets', () => {
    it('should return paginated list of pets with customer info', async () => {
      const mockApiKey = createMockApiKey();
      const mockPets = [
        {
          ...createMockPet({ id: TEST_PET_ID }),
          customer: { id: TEST_CUSTOMER_ID, name: 'John', email: 'john@test.com', phone: '555-1234' },
        },
        {
          ...createMockPet({ id: '123e4567-e89b-12d3-a456-426614174099', name: 'Bella' }),
          customer: { id: TEST_CUSTOMER_ID, name: 'John', email: 'john@test.com', phone: '555-1234' },
        },
      ];

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.pet.findMany as jest.Mock).mockResolvedValue(mockPets);
      (mockPrisma.pet.count as jest.Mock).mockResolvedValue(2);

      const request = createMockRequest('https://api.vetify.com/api/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await listPets(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].customer).toBeDefined();
      expect(body.data[0]).not.toHaveProperty('tenantId');
    });

    it('should filter by customerId', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.pet.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.pet.count as jest.Mock).mockResolvedValue(0);

      const request = createMockRequest(
        `https://api.vetify.com/api/v1/pets?customerId=${TEST_CUSTOMER_ID}`,
        { headers: { authorization: `Bearer ${validKey}` } }
      );

      await listPets(request);

      expect(mockPrisma.pet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            customerId: TEST_CUSTOMER_ID,
          }),
        })
      );
    });

    it('should filter by species', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.pet.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.pet.count as jest.Mock).mockResolvedValue(0);

      const request = createMockRequest(
        'https://api.vetify.com/api/v1/pets?species=dog',
        { headers: { authorization: `Bearer ${validKey}` } }
      );

      await listPets(request);

      expect(mockPrisma.pet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            species: { equals: 'dog', mode: 'insensitive' },
          }),
        })
      );
    });

    it('should filter by isDeceased', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.pet.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.pet.count as jest.Mock).mockResolvedValue(0);

      const request = createMockRequest(
        'https://api.vetify.com/api/v1/pets?isDeceased=true',
        { headers: { authorization: `Bearer ${validKey}` } }
      );

      await listPets(request);

      expect(mockPrisma.pet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isDeceased: true,
          }),
        })
      );
    });
  });

  describe('POST /api/v1/pets', () => {
    it('should create a new pet', async () => {
      const mockApiKey = createMockApiKey();
      const mockCustomer = createMockCustomer();
      const newPet = {
        ...createMockPet(),
        customer: { id: TEST_CUSTOMER_ID, name: 'John', email: 'john@test.com', phone: '555-1234' },
      };

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer);
      (mockPrisma.pet.create as jest.Mock).mockResolvedValue(newPet);

      const request = createMockRequest('https://api.vetify.com/api/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
        body: {
          name: 'Max',
          species: 'Dog',
          breed: 'Labrador',
          dateOfBirth: '2020-01-15',
          gender: 'male',
          customerId: TEST_CUSTOMER_ID,
        },
      });

      const response = await createPet(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.data.name).toBe('Max');
      expect(mockPrisma.pet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: TEST_TENANT_ID,
            name: 'Max',
            customerId: TEST_CUSTOMER_ID,
          }),
        })
      );
    });

    it('should validate required fields', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest('https://api.vetify.com/api/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
        body: { name: 'Max' }, // Missing required fields
      });

      const response = await createPet(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent customer', async () => {
      const nonExistentCustomerId = '123e4567-e89b-12d3-a456-426614174999';
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest('https://api.vetify.com/api/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
        body: {
          name: 'Max',
          species: 'Dog',
          breed: 'Labrador',
          dateOfBirth: '2020-01-15',
          gender: 'male',
          customerId: nonExistentCustomerId,
        },
      });

      const response = await createPet(request);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toContain('Customer');
    });

    it('should validate gender enum', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest('https://api.vetify.com/api/v1/pets', {
        headers: { authorization: `Bearer ${validKey}` },
        body: {
          name: 'Max',
          species: 'Dog',
          breed: 'Labrador',
          dateOfBirth: '2020-01-15',
          gender: 'invalid-gender',
          customerId: TEST_CUSTOMER_ID,
        },
      });

      const response = await createPet(request);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/pets/:id', () => {
    it('should return a single pet with customer info', async () => {
      const mockApiKey = createMockApiKey();
      const mockPet = {
        ...createMockPet(),
        customer: { id: TEST_CUSTOMER_ID, name: 'John', email: 'john@test.com', phone: '555-1234' },
      };

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.pet.findFirst as jest.Mock).mockResolvedValue(mockPet);

      const request = createMockRequest(`https://api.vetify.com/api/v1/pets/${TEST_PET_ID}`, {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await getPet(request, {
        params: Promise.resolve({ id: TEST_PET_ID }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.id).toBe(TEST_PET_ID);
      expect(body.data.customer).toBeDefined();
      expect(body.data).not.toHaveProperty('tenantId');
    });

    it('should return 404 for non-existent pet', async () => {
      const nonExistentPetId = '123e4567-e89b-12d3-a456-426614174999';
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.pet.findFirst as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest(`https://api.vetify.com/api/v1/pets/${nonExistentPetId}`, {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await getPet(request, {
        params: Promise.resolve({ id: nonExistentPetId }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/pets/:id', () => {
    it('should update a pet', async () => {
      const mockApiKey = createMockApiKey();
      const existingPet = createMockPet();
      const updatedPet = {
        ...existingPet,
        name: 'Maximus',
        customer: { id: TEST_CUSTOMER_ID, name: 'John', email: 'john@test.com', phone: '555-1234' },
      };

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.pet.findFirst as jest.Mock).mockResolvedValue(existingPet);
      (mockPrisma.pet.update as jest.Mock).mockResolvedValue(updatedPet);

      const request = createMockRequest(`https://api.vetify.com/api/v1/pets/${TEST_PET_ID}`, {
        headers: { authorization: `Bearer ${validKey}` },
        body: { name: 'Maximus' },
      });

      const response = await updatePet(request, {
        params: Promise.resolve({ id: TEST_PET_ID }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.name).toBe('Maximus');
    });

    it('should allow marking pet as deceased', async () => {
      const mockApiKey = createMockApiKey();
      const existingPet = createMockPet();
      const deceasedPet = {
        ...existingPet,
        isDeceased: true,
        customer: { id: TEST_CUSTOMER_ID, name: 'John', email: 'john@test.com', phone: '555-1234' },
      };

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.pet.findFirst as jest.Mock).mockResolvedValue(existingPet);
      (mockPrisma.pet.update as jest.Mock).mockResolvedValue(deceasedPet);

      const request = createMockRequest(`https://api.vetify.com/api/v1/pets/${TEST_PET_ID}`, {
        headers: { authorization: `Bearer ${validKey}` },
        body: { isDeceased: true },
      });

      const response = await updatePet(request, {
        params: Promise.resolve({ id: TEST_PET_ID }),
      });

      expect(response.status).toBe(200);
      expect(mockPrisma.pet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isDeceased: true }),
        })
      );
    });
  });

  describe('DELETE /api/v1/pets/:id', () => {
    it('should mark pet as deceased instead of hard delete', async () => {
      const mockApiKey = createMockApiKey();
      const existingPet = createMockPet();
      const mockCustomer = createMockCustomer();

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.pet.findFirst as jest.Mock).mockResolvedValue(existingPet);
      // Include customer in update response for webhook serialization
      (mockPrisma.pet.update as jest.Mock).mockResolvedValue({
        ...existingPet,
        isDeceased: true,
        customer: mockCustomer,
      });

      const request = createMockRequest(`https://api.vetify.com/api/v1/pets/${TEST_PET_ID}`, {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await deletePet(request, {
        params: Promise.resolve({ id: TEST_PET_ID }),
      });

      expect(response.status).toBe(204);
      expect(mockPrisma.pet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: TEST_PET_ID },
          data: { isDeceased: true },
        })
      );
    });

    it('should return 404 for non-existent pet', async () => {
      const nonExistentPetId = '123e4567-e89b-12d3-a456-426614174999';
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.pet.findFirst as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest(`https://api.vetify.com/api/v1/pets/${nonExistentPetId}`, {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await deletePet(request, {
        params: Promise.resolve({ id: nonExistentPetId }),
      });

      expect(response.status).toBe(404);
    });
  });
});
