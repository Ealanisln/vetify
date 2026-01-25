/**
 * Tests for API v1 Inventory Endpoints
 *
 * VETIF-98: Unit tests for /api/v1/inventory and /api/v1/inventory/transfers
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    inventoryItem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    inventoryTransfer: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    location: {
      findFirst: jest.fn(),
    },
    staff: {
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
import { GET as listInventory, POST as createInventoryItem } from '@/app/api/v1/inventory/route';
import { GET as getInventoryItem, PUT as updateInventoryItem, DELETE as deleteInventoryItem } from '@/app/api/v1/inventory/[id]/route';
import { GET as listTransfers, POST as createTransfer } from '@/app/api/v1/inventory/transfers/route';
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

// Valid UUIDs for testing
const TEST_TENANT_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_INVENTORY_ID = '123e4567-e89b-12d3-a456-426614174001';
const TEST_LOCATION_1_ID = '123e4567-e89b-12d3-a456-426614174002';
const TEST_LOCATION_2_ID = '123e4567-e89b-12d3-a456-426614174003';
const TEST_STAFF_ID = '123e4567-e89b-12d3-a456-426614174004';
const TEST_TRANSFER_ID = '123e4567-e89b-12d3-a456-426614174005';
const TEST_KEY_ID = '123e4567-e89b-12d3-a456-426614174006';

// Helper to create mock API key
function createMockApiKey(overrides: Partial<AuthenticatedApiKey> = {}): AuthenticatedApiKey {
  return {
    id: TEST_KEY_ID,
    tenantId: TEST_TENANT_ID,
    name: 'Test Key',
    keyHash: 'hashed-value',
    keyPrefix: 'vfy_abc12345',
    scopes: ['read:inventory', 'write:inventory'],
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

// Helper to create mock inventory item
function createMockInventoryItemData(overrides = {}) {
  return {
    id: TEST_INVENTORY_ID,
    tenantId: TEST_TENANT_ID,
    locationId: TEST_LOCATION_1_ID,
    name: 'Amoxicillin 500mg',
    category: 'MEDICINE',
    description: 'Antibiotic',
    activeCompound: 'Amoxicillin',
    presentation: 'Tablets',
    measure: '500mg',
    brand: 'Generic',
    quantity: new Decimal(100),
    minStock: new Decimal(20),
    expirationDate: new Date('2025-12-31'),
    status: 'ACTIVE',
    batchNumber: 'BATCH-001',
    specialNotes: null,
    storageLocation: 'Shelf A-1',
    cost: new Decimal(5.00),
    price: new Decimal(10.00),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// Helper to create mock transfer
function createMockTransfer(overrides = {}) {
  return {
    id: TEST_TRANSFER_ID,
    tenantId: TEST_TENANT_ID,
    inventoryItemId: TEST_INVENTORY_ID,
    fromLocationId: TEST_LOCATION_1_ID,
    toLocationId: TEST_LOCATION_2_ID,
    quantity: new Decimal(10),
    status: 'PENDING',
    notes: 'Urgent transfer',
    requestedById: TEST_STAFF_ID,
    completedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    inventoryItem: { id: TEST_INVENTORY_ID, name: 'Amoxicillin', category: 'MEDICINE' },
    fromLocation: { id: TEST_LOCATION_1_ID, name: 'Main Office', slug: 'main' },
    toLocation: { id: TEST_LOCATION_2_ID, name: 'Branch', slug: 'branch' },
    requestedBy: { id: TEST_STAFF_ID, name: 'Dr. Smith', position: 'Veterinarian' },
    ...overrides,
  };
}

const validKey = 'vfy_12345678_abcdef1234567890abcdef1234567890';

describe('API v1 Inventory', () => {
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

  describe('GET /api/v1/inventory', () => {
    it('should return paginated list of inventory items', async () => {
      const mockApiKey = createMockApiKey();
      const mockItems = [
        createMockInventoryItemData({ id: TEST_INVENTORY_ID }),
        createMockInventoryItemData({ id: '123e4567-e89b-12d3-a456-426614174007', name: 'Ibuprofen' }),
      ];

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.inventoryItem.findMany as jest.Mock).mockResolvedValue(mockItems);
      (mockPrisma.inventoryItem.count as jest.Mock).mockResolvedValue(2);

      const request = createMockRequest('https://api.vetify.com/api/v1/inventory', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await listInventory(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toHaveLength(2);
      expect(body.data[0]).not.toHaveProperty('tenantId');
      expect(typeof body.data[0].quantity).toBe('number');
    });

    it('should filter by category', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.inventoryItem.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.inventoryItem.count as jest.Mock).mockResolvedValue(0);

      const request = createMockRequest(
        'https://api.vetify.com/api/v1/inventory?category=MEDICINE',
        { headers: { authorization: `Bearer ${validKey}` } }
      );

      await listInventory(request);

      expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'MEDICINE',
          }),
        })
      );
    });

    it('should filter by search query', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.inventoryItem.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.inventoryItem.count as jest.Mock).mockResolvedValue(0);

      const request = createMockRequest(
        'https://api.vetify.com/api/v1/inventory?search=amox',
        { headers: { authorization: `Bearer ${validKey}` } }
      );

      await listInventory(request);

      expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'amox', mode: 'insensitive' } }),
            ]),
          }),
        })
      );
    });
  });

  describe('POST /api/v1/inventory', () => {
    it('should create a new inventory item', async () => {
      const mockApiKey = createMockApiKey();
      const mockLocation = { id: TEST_LOCATION_1_ID, isActive: true };
      const newItem = createMockInventoryItemData();

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation);
      (mockPrisma.inventoryItem.create as jest.Mock).mockResolvedValue(newItem);

      const request = createMockRequest('https://api.vetify.com/api/v1/inventory', {
        headers: { authorization: `Bearer ${validKey}` },
        body: {
          name: 'Amoxicillin 500mg',
          category: 'MEDICINE',
          quantity: 100,
          locationId: TEST_LOCATION_1_ID,
        },
      });

      const response = await createInventoryItem(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.data.name).toBe('Amoxicillin 500mg');
    });

    it('should validate required fields', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest('https://api.vetify.com/api/v1/inventory', {
        headers: { authorization: `Bearer ${validKey}` },
        body: { name: 'Test' }, // Missing category
      });

      const response = await createInventoryItem(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('should validate category enum', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest('https://api.vetify.com/api/v1/inventory', {
        headers: { authorization: `Bearer ${validKey}` },
        body: { name: 'Test', category: 'INVALID_CATEGORY' },
      });

      const response = await createInventoryItem(request);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/inventory/:id', () => {
    it('should return a single inventory item', async () => {
      const mockApiKey = createMockApiKey();
      const mockItem = createMockInventoryItemData();

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.inventoryItem.findFirst as jest.Mock).mockResolvedValue(mockItem);

      const request = createMockRequest(`https://api.vetify.com/api/v1/inventory/${TEST_INVENTORY_ID}`, {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await getInventoryItem(request, {
        params: Promise.resolve({ id: TEST_INVENTORY_ID }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.id).toBe(TEST_INVENTORY_ID);
      expect(typeof body.data.quantity).toBe('number');
    });

    it('should return 404 for non-existent item', async () => {
      const mockApiKey = createMockApiKey();
      const NON_EXISTENT_ID = '123e4567-e89b-12d3-a456-426614174999';
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.inventoryItem.findFirst as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest(`https://api.vetify.com/api/v1/inventory/${NON_EXISTENT_ID}`, {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await getInventoryItem(request, {
        params: Promise.resolve({ id: NON_EXISTENT_ID }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/inventory/:id', () => {
    it('should update an inventory item', async () => {
      const mockApiKey = createMockApiKey();
      const existingItem = createMockInventoryItemData();
      const updatedItem = { ...existingItem, quantity: new Decimal(150) };

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.inventoryItem.findFirst as jest.Mock).mockResolvedValue(existingItem);
      (mockPrisma.inventoryItem.update as jest.Mock).mockResolvedValue(updatedItem);

      const request = createMockRequest(`https://api.vetify.com/api/v1/inventory/${TEST_INVENTORY_ID}`, {
        headers: { authorization: `Bearer ${validKey}` },
        body: { quantity: 150 },
      });

      const response = await updateInventoryItem(request, {
        params: Promise.resolve({ id: TEST_INVENTORY_ID }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.quantity).toBe(150);
    });
  });

  describe('DELETE /api/v1/inventory/:id', () => {
    it('should soft delete by setting status to DISCONTINUED', async () => {
      const mockApiKey = createMockApiKey();
      const existingItem = createMockInventoryItemData();

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.inventoryItem.findFirst as jest.Mock).mockResolvedValue(existingItem);
      (mockPrisma.inventoryItem.update as jest.Mock).mockResolvedValue({
        ...existingItem,
        status: 'DISCONTINUED',
      });

      const request = createMockRequest(`https://api.vetify.com/api/v1/inventory/${TEST_INVENTORY_ID}`, {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await deleteInventoryItem(request, {
        params: Promise.resolve({ id: TEST_INVENTORY_ID }),
      });

      expect(response.status).toBe(204);
      expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: TEST_INVENTORY_ID },
        data: { status: 'DISCONTINUED' },
      });
    });
  });

  describe('GET /api/v1/inventory/transfers', () => {
    it('should return paginated list of transfers', async () => {
      const mockApiKey = createMockApiKey();
      const mockTransfers = [createMockTransfer()];

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.inventoryTransfer.findMany as jest.Mock).mockResolvedValue(mockTransfers);
      (mockPrisma.inventoryTransfer.count as jest.Mock).mockResolvedValue(1);

      const request = createMockRequest('https://api.vetify.com/api/v1/inventory/transfers', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await listTransfers(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].inventoryItem).toBeDefined();
      expect(body.data[0].fromLocation).toBeDefined();
      expect(body.data[0].toLocation).toBeDefined();
    });

    it('should filter by status', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.inventoryTransfer.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.inventoryTransfer.count as jest.Mock).mockResolvedValue(0);

      const request = createMockRequest(
        'https://api.vetify.com/api/v1/inventory/transfers?status=PENDING',
        { headers: { authorization: `Bearer ${validKey}` } }
      );

      await listTransfers(request);

      expect(mockPrisma.inventoryTransfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
          }),
        })
      );
    });
  });

  describe('POST /api/v1/inventory/transfers', () => {
    it('should create a new transfer', async () => {
      const mockApiKey = createMockApiKey();
      const mockItem = createMockInventoryItemData({ locationId: TEST_LOCATION_1_ID });
      const mockFromLocation = { id: TEST_LOCATION_1_ID, isActive: true };
      const mockToLocation = { id: TEST_LOCATION_2_ID, isActive: true };
      const mockStaff = { id: TEST_STAFF_ID, isActive: true };
      const newTransfer = createMockTransfer();

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.inventoryItem.findFirst as jest.Mock).mockResolvedValue(mockItem);
      (mockPrisma.location.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockFromLocation)
        .mockResolvedValueOnce(mockToLocation);
      (mockPrisma.staff.findFirst as jest.Mock).mockResolvedValue(mockStaff);
      (mockPrisma.inventoryTransfer.create as jest.Mock).mockResolvedValue(newTransfer);

      const request = createMockRequest('https://api.vetify.com/api/v1/inventory/transfers', {
        headers: { authorization: `Bearer ${validKey}` },
        body: {
          inventoryItemId: TEST_INVENTORY_ID,
          fromLocationId: TEST_LOCATION_1_ID,
          toLocationId: TEST_LOCATION_2_ID,
          quantity: 10,
          requestedById: TEST_STAFF_ID,
        },
      });

      const response = await createTransfer(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.data.status).toBe('PENDING');
    });

    it('should reject transfer to same location', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest('https://api.vetify.com/api/v1/inventory/transfers', {
        headers: { authorization: `Bearer ${validKey}` },
        body: {
          inventoryItemId: TEST_INVENTORY_ID,
          fromLocationId: TEST_LOCATION_1_ID,
          toLocationId: TEST_LOCATION_1_ID, // Same location
          quantity: 10,
          requestedById: TEST_STAFF_ID,
        },
      });

      const response = await createTransfer(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('different');
    });

    it('should reject insufficient quantity', async () => {
      const mockApiKey = createMockApiKey();
      const mockItem = createMockInventoryItemData({ quantity: new Decimal(5), locationId: TEST_LOCATION_1_ID });

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.inventoryItem.findFirst as jest.Mock).mockResolvedValue(mockItem);

      const request = createMockRequest('https://api.vetify.com/api/v1/inventory/transfers', {
        headers: { authorization: `Bearer ${validKey}` },
        body: {
          inventoryItemId: TEST_INVENTORY_ID,
          fromLocationId: TEST_LOCATION_1_ID,
          toLocationId: TEST_LOCATION_2_ID,
          quantity: 10, // More than available
          requestedById: TEST_STAFF_ID,
        },
      });

      const response = await createTransfer(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('Insufficient');
    });
  });
});
