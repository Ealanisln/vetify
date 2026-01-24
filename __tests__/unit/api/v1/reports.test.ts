/**
 * Tests for API v1 Reports Endpoints
 *
 * VETIF-98: Unit tests for /api/v1/reports/sales and /api/v1/reports/inventory
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    sale: {
      findMany: jest.fn(),
    },
    inventoryItem: {
      findMany: jest.fn(),
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
import { GET as getSalesReport } from '@/app/api/v1/reports/sales/route';
import { GET as getInventoryReport } from '@/app/api/v1/reports/inventory/route';
import { NextRequest } from 'next/server';
import type { AuthenticatedApiKey } from '@/lib/api/api-key-auth';
import { Decimal } from '@prisma/client/runtime/library';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Helper to create mock NextRequest
function createMockRequest(
  url: string,
  options: { headers?: Record<string, string> } = {}
): NextRequest {
  return new NextRequest(url, { headers: options.headers || {} });
}

// Helper to create mock API key
function createMockApiKey(overrides: Partial<AuthenticatedApiKey> = {}): AuthenticatedApiKey {
  return {
    id: 'key-id',
    tenantId: 'tenant-123',
    name: 'Test Key',
    keyHash: 'hashed-value',
    keyPrefix: 'vfy_abc12345',
    scopes: ['read:reports'],
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

// Helper to create mock sale
function createMockSale(overrides = {}) {
  return {
    id: 'sale-1',
    tenantId: 'tenant-123',
    locationId: 'loc-1',
    total: new Decimal(150.00),
    status: 'COMPLETED',
    createdAt: new Date('2024-06-15T10:00:00Z'),
    items: [
      {
        id: 'item-1',
        total: new Decimal(100.00),
        inventoryItem: { category: 'MEDICINE' },
        service: null,
      },
      {
        id: 'item-2',
        total: new Decimal(50.00),
        inventoryItem: null,
        service: { category: 'CONSULTATION' },
      },
    ],
    location: { id: 'loc-1', name: 'Main Office' },
    ...overrides,
  };
}

// Helper to create mock inventory item
function createMockInventoryItemData(overrides = {}) {
  return {
    id: 'inv-1',
    tenantId: 'tenant-123',
    locationId: 'loc-1',
    name: 'Amoxicillin 500mg',
    category: 'MEDICINE',
    quantity: new Decimal(100),
    minStock: new Decimal(20),
    expirationDate: new Date('2025-12-31'),
    status: 'ACTIVE',
    cost: new Decimal(5.00),
    price: new Decimal(10.00),
    ...overrides,
  };
}

const validKey = 'vfy_12345678_abcdef1234567890abcdef1234567890';

describe('API v1 Reports', () => {
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

  describe('GET /api/v1/reports/sales', () => {
    it('should return sales report with summary and breakdown', async () => {
      const mockApiKey = createMockApiKey();
      const mockSales = [
        createMockSale({ id: 'sale-1', total: new Decimal(150) }),
        createMockSale({ id: 'sale-2', total: new Decimal(200) }),
      ];

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.sale.findMany as jest.Mock).mockResolvedValue(mockSales);

      const request = createMockRequest(
        'https://api.vetify.com/api/v1/reports/sales?start_date=2024-06-01&end_date=2024-06-30',
        { headers: { authorization: `Bearer ${validKey}` } }
      );

      const response = await getSalesReport(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.summary).toBeDefined();
      expect(body.data.summary.totalSales).toBe(2);
      expect(body.data.summary.totalRevenue).toBe(350);
      expect(body.data.breakdown).toBeDefined();
    });

    it('should require start_date and end_date', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest(
        'https://api.vetify.com/api/v1/reports/sales',
        { headers: { authorization: `Bearer ${validKey}` } }
      );

      const response = await getSalesReport(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.error).toContain('start_date');
    });

    it('should validate date order', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest(
        'https://api.vetify.com/api/v1/reports/sales?start_date=2024-06-30&end_date=2024-06-01',
        { headers: { authorization: `Bearer ${validKey}` } }
      );

      const response = await getSalesReport(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('before');
    });

    it('should support groupBy parameter', async () => {
      const mockApiKey = createMockApiKey();
      const mockSales = [createMockSale()];

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.sale.findMany as jest.Mock).mockResolvedValue(mockSales);

      const request = createMockRequest(
        'https://api.vetify.com/api/v1/reports/sales?start_date=2024-06-01&end_date=2024-06-30&groupBy=category',
        { headers: { authorization: `Bearer ${validKey}` } }
      );

      const response = await getSalesReport(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.breakdown.some((b: { category: string }) => b.category === 'MEDICINE')).toBe(true);
    });

    it('should reject invalid groupBy value', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest(
        'https://api.vetify.com/api/v1/reports/sales?start_date=2024-06-01&end_date=2024-06-30&groupBy=invalid',
        { headers: { authorization: `Bearer ${validKey}` } }
      );

      const response = await getSalesReport(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('groupBy');
    });

    it('should return 403 for wrong scope', async () => {
      const mockApiKey = createMockApiKey({ scopes: ['read:pets'] });
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest(
        'https://api.vetify.com/api/v1/reports/sales?start_date=2024-06-01&end_date=2024-06-30',
        { headers: { authorization: `Bearer ${validKey}` } }
      );

      const response = await getSalesReport(request);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/reports/inventory', () => {
    it('should return inventory report with summary and breakdowns', async () => {
      const mockApiKey = createMockApiKey();
      const mockItems = [
        createMockInventoryItemData({ id: 'inv-1', quantity: new Decimal(100), minStock: new Decimal(20) }),
        createMockInventoryItemData({
          id: 'inv-2',
          name: 'Vaccine',
          category: 'VACCINE',
          quantity: new Decimal(10),
          minStock: new Decimal(15),
        }),
        createMockInventoryItemData({
          id: 'inv-3',
          name: 'Expired Item',
          quantity: new Decimal(5),
          expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        }),
      ];

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.inventoryItem.findMany as jest.Mock).mockResolvedValue(mockItems);

      const request = createMockRequest('https://api.vetify.com/api/v1/reports/inventory', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await getInventoryReport(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.summary).toBeDefined();
      expect(body.data.summary.totalItems).toBe(3);
      expect(body.data.summary.lowStockCount).toBeGreaterThanOrEqual(1);
      expect(body.data.byCategory).toBeDefined();
      expect(body.data.lowStockItems).toBeDefined();
      expect(body.data.expiringItems).toBeDefined();
    });

    it('should filter by category', async () => {
      const mockApiKey = createMockApiKey();
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.inventoryItem.findMany as jest.Mock).mockResolvedValue([createMockInventoryItemData()]);

      const request = createMockRequest(
        'https://api.vetify.com/api/v1/reports/inventory?category=MEDICINE',
        { headers: { authorization: `Bearer ${validKey}` } }
      );

      await getInventoryReport(request);

      expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'MEDICINE',
          }),
        })
      );
    });

    it('should calculate total value correctly', async () => {
      const mockApiKey = createMockApiKey();
      const mockItems = [
        createMockInventoryItemData({
          quantity: new Decimal(10),
          cost: new Decimal(5.00),
          price: new Decimal(10.00),
        }),
        createMockInventoryItemData({
          quantity: new Decimal(20),
          cost: new Decimal(3.00),
          price: null,
        }),
      ];

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.inventoryItem.findMany as jest.Mock).mockResolvedValue(mockItems);

      const request = createMockRequest('https://api.vetify.com/api/v1/reports/inventory', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await getInventoryReport(request);
      const body = await response.json();

      // 10 * 5 + 20 * 3 = 50 + 60 = 110
      expect(body.data.summary.totalValue).toBe(110);
    });

    it('should identify expiring items within 30 days', async () => {
      const mockApiKey = createMockApiKey();
      const now = new Date();
      const mockItems = [
        createMockInventoryItemData({
          id: 'exp-soon',
          expirationDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days
        }),
        createMockInventoryItemData({
          id: 'exp-later',
          expirationDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days
        }),
      ];

      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.inventoryItem.findMany as jest.Mock).mockResolvedValue(mockItems);

      const request = createMockRequest('https://api.vetify.com/api/v1/reports/inventory', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await getInventoryReport(request);
      const body = await response.json();

      expect(body.data.summary.expiringSoonCount).toBe(1);
      expect(body.data.expiringItems).toHaveLength(1);
      expect(body.data.expiringItems[0].id).toBe('exp-soon');
    });

    it('should return 403 for wrong scope', async () => {
      const mockApiKey = createMockApiKey({ scopes: ['read:pets'] });
      (mockPrisma.tenantApiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const request = createMockRequest('https://api.vetify.com/api/v1/reports/inventory', {
        headers: { authorization: `Bearer ${validKey}` },
      });

      const response = await getInventoryReport(request);

      expect(response.status).toBe(403);
    });
  });
});
