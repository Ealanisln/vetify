/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-function-type */
/**
 * Integration tests for V1 Reports API routes
 *
 * Routes tested:
 * - GET /api/v1/reports/inventory
 * - GET /api/v1/reports/sales
 */

import { NextRequest, NextResponse } from 'next/server';
import { prismaMock } from '../../mocks/prisma';

// --- Mock API key auth ---
const mockApiKeyAuth = {
  apiKey: {
    id: 'key-1',
    key: 'vfy_test_key',
    tenantId: 'tenant-1',
    locationId: null,
    scopes: ['read:reports'],
    rateLimit: 1000,
    isActive: true,
    tenant: { id: 'tenant-1', name: 'Test Clinic' },
    location: null,
  },
  locationId: null as string | null,
};

jest.mock('@/lib/api/api-key-auth', () => ({
  withApiAuth: (handler: Function, _options?: any) => {
    return async (request: any, context?: any) => {
      const params = context?.params ? await context.params : undefined;
      return handler(request, { ...mockApiKeyAuth, params });
    };
  },
  apiError: (error: string, code: string, status: number, details?: string) => {
    return NextResponse.json({ error, code, ...(details && { details }) }, { status });
  },
  parsePaginationParams: (request: any) => {
    const url = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '50')), 100);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));
    return { limit, offset };
  },
  paginatedResponse: (data: any[], total: number, pagination: { limit: number; offset: number }) => ({
    data,
    meta: { total, limit: pagination.limit, offset: pagination.offset, hasMore: pagination.offset + data.length < total },
  }),
  buildWhereClause: (apiKey: any, locationId: string | null, additionalWhere: any = {}) => ({
    tenantId: apiKey.tenantId,
    ...(locationId && { locationId }),
    ...additionalWhere,
  }),
}));

// Import route handlers AFTER mocks
import { GET as getInventoryReport } from '@/app/api/v1/reports/inventory/route';
import { GET as getSalesReport } from '@/app/api/v1/reports/sales/route';

// --- Helpers ---
function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

const now = new Date();

const mockInventoryItems = [
  {
    id: 'inv-1',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    name: 'Amoxicillin',
    category: 'MEDICINE',
    quantity: 50,
    minStock: 20,
    cost: 5.0,
    price: 12.0,
    status: 'ACTIVE',
    expirationDate: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'inv-2',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    name: 'Rabies Vaccine',
    category: 'VACCINE',
    quantity: 5,
    minStock: 10,
    cost: 8.0,
    price: 25.0,
    status: 'ACTIVE',
    expirationDate: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'inv-3',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    name: 'Bandages',
    category: 'CONSUMABLE_CLINIC',
    quantity: 0,
    minStock: 5,
    cost: 2.0,
    price: 5.0,
    status: 'ACTIVE',
    expirationDate: null,
    createdAt: now,
    updatedAt: now,
  },
];

let consoleSpy: jest.SpyInstance;

beforeEach(() => {
  consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  mockApiKeyAuth.locationId = null;
});

afterEach(() => {
  consoleSpy.mockRestore();
});

// =============================================================================
// GET /api/v1/reports/inventory
// =============================================================================
describe('GET /api/v1/reports/inventory', () => {
  it('should return inventory summary with totals', async () => {
    (prismaMock.inventoryItem.findMany as jest.Mock).mockResolvedValue(mockInventoryItems);

    const req = makeRequest('http://localhost:3000/api/v1/reports/inventory');
    const res = await getInventoryReport(req, {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.summary).toBeDefined();
    expect(body.data.summary.totalItems).toBe(3);
    expect(body.data.summary.lowStockCount).toBeGreaterThanOrEqual(1); // inv-2 and inv-3 are low stock
    expect(body.data.summary.outOfStockCount).toBe(1); // inv-3 has quantity 0
    expect(body.data.byCategory).toBeDefined();
    expect(Array.isArray(body.data.byCategory)).toBe(true);
  });

  it('should filter by locationId', async () => {
    mockApiKeyAuth.locationId = 'loc-1';
    (prismaMock.inventoryItem.findMany as jest.Mock).mockResolvedValue(mockInventoryItems);

    const req = makeRequest('http://localhost:3000/api/v1/reports/inventory');
    const res = await getInventoryReport(req, {});

    expect(res.status).toBe(200);
    expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ locationId: 'loc-1' }),
      })
    );
  });

  it('should filter by category', async () => {
    const medicineOnly = mockInventoryItems.filter((i) => i.category === 'MEDICINE');
    (prismaMock.inventoryItem.findMany as jest.Mock).mockResolvedValue(medicineOnly);

    const req = makeRequest('http://localhost:3000/api/v1/reports/inventory?category=MEDICINE');
    const res = await getInventoryReport(req, {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.summary.totalItems).toBe(1);
    expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: 'MEDICINE' }),
      })
    );
  });
});

// =============================================================================
// GET /api/v1/reports/sales
// =============================================================================
describe('GET /api/v1/reports/sales', () => {
  const mockSales = [
    {
      id: 'sale-1',
      tenantId: 'tenant-1',
      locationId: 'loc-1',
      total: 150.0,
      status: 'PAID',
      createdAt: new Date('2026-03-01T10:00:00Z'),
      items: [
        {
          total: 100.0,
          inventoryItem: { category: 'MEDICINE' },
          service: null,
        },
        {
          total: 50.0,
          inventoryItem: null,
          service: { category: 'CONSULTATION' },
        },
      ],
      location: { id: 'loc-1', name: 'Main' },
    },
    {
      id: 'sale-2',
      tenantId: 'tenant-1',
      locationId: 'loc-1',
      total: 75.0,
      status: 'COMPLETED',
      createdAt: new Date('2026-03-02T14:00:00Z'),
      items: [
        {
          total: 75.0,
          inventoryItem: { category: 'VACCINE' },
          service: null,
        },
      ],
      location: { id: 'loc-1', name: 'Main' },
    },
  ];

  it('should return sales report', async () => {
    (prismaMock.sale.findMany as jest.Mock).mockResolvedValue(mockSales);

    const req = makeRequest(
      'http://localhost:3000/api/v1/reports/sales?start_date=2026-03-01&end_date=2026-03-31'
    );
    const res = await getSalesReport(req, {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.summary).toBeDefined();
    expect(body.data.summary.totalSales).toBe(2);
    expect(body.data.summary.totalRevenue).toBe(225.0);
    expect(body.data.summary.averageOrderValue).toBe(112.5);
    expect(body.data.breakdown).toBeDefined();
  });

  it('should require start_date and end_date', async () => {
    const req = makeRequest('http://localhost:3000/api/v1/reports/sales');
    const res = await getSalesReport(req, {});
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.error).toContain('start_date');
  });

  it('should group by day (default)', async () => {
    (prismaMock.sale.findMany as jest.Mock).mockResolvedValue(mockSales);

    const req = makeRequest(
      'http://localhost:3000/api/v1/reports/sales?start_date=2026-03-01&end_date=2026-03-31'
    );
    const res = await getSalesReport(req, {});
    const body = await res.json();

    expect(res.status).toBe(200);
    // Each sale on different day should produce separate breakdown entries
    expect(body.data.breakdown.length).toBeGreaterThanOrEqual(1);
    // Breakdown items should have date field for day grouping
    if (body.data.breakdown.length > 0) {
      expect(body.data.breakdown[0].date).toBeDefined();
    }
  });

  it('should group by category when requested', async () => {
    (prismaMock.sale.findMany as jest.Mock).mockResolvedValue(mockSales);

    const req = makeRequest(
      'http://localhost:3000/api/v1/reports/sales?start_date=2026-03-01&end_date=2026-03-31&groupBy=category'
    );
    const res = await getSalesReport(req, {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.breakdown.length).toBeGreaterThanOrEqual(1);
    // Category breakdown items should have category field
    const categories = body.data.breakdown.map((b: any) => b.category);
    expect(categories).toContain('MEDICINE');
  });
});
