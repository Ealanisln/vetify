/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-function-type */
/**
 * Integration tests for V1 Inventory API routes
 *
 * Routes tested:
 * - GET/POST /api/v1/inventory
 * - GET/PUT/DELETE /api/v1/inventory/[id]
 * - GET/POST /api/v1/inventory/transfers
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
    scopes: ['read:inventory', 'write:inventory'],
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

jest.mock('@/app/api/v1/_shared/serializers', () => ({
  serializeInventoryItem: (item: any) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description,
    quantity: Number(item.quantity ?? 0),
    minStock: item.minStock ? Number(item.minStock) : null,
    status: item.status,
    locationId: item.locationId,
    cost: item.cost ? Number(item.cost) : null,
    price: item.price ? Number(item.price) : null,
    createdAt: item.createdAt?.toISOString?.() ?? item.createdAt,
    updatedAt: item.updatedAt?.toISOString?.() ?? item.updatedAt,
  }),
  serializeInventoryTransfer: (transfer: any) => ({
    id: transfer.id,
    inventoryItemId: transfer.inventoryItemId,
    fromLocationId: transfer.fromLocationId,
    toLocationId: transfer.toLocationId,
    quantity: Number(transfer.quantity),
    status: transfer.status,
    notes: transfer.notes,
    requestedById: transfer.requestedById,
    inventoryItem: transfer.inventoryItem,
    fromLocation: transfer.fromLocation,
    toLocation: transfer.toLocation,
    requestedBy: transfer.requestedBy,
    createdAt: transfer.createdAt?.toISOString?.() ?? transfer.createdAt,
    updatedAt: transfer.updatedAt?.toISOString?.() ?? transfer.updatedAt,
  }),
}));

// Import route handlers AFTER mocks
import { GET as getInventoryList, POST as createInventoryItem } from '@/app/api/v1/inventory/route';
import { GET as getInventoryItem, PUT as updateInventoryItem, DELETE as deleteInventoryItem } from '@/app/api/v1/inventory/[id]/route';
import { GET as getTransfers, POST as createTransfer } from '@/app/api/v1/inventory/transfers/route';

// --- Helpers ---
function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

const now = new Date();

const mockInventoryItem = {
  id: 'inv-1',
  tenantId: 'tenant-1',
  locationId: null,
  name: 'Amoxicillin 500mg',
  category: 'MEDICINE',
  description: 'Antibiotic',
  activeCompound: 'Amoxicillin',
  presentation: 'Tablet',
  measure: 'mg',
  brand: 'GenericVet',
  quantity: 100,
  minStock: 20,
  expirationDate: new Date('2027-01-01'),
  status: 'ACTIVE',
  batchNumber: 'B001',
  specialNotes: null,
  storageLocation: 'Shelf A',
  cost: 5.0,
  price: 12.0,
  createdAt: now,
  updatedAt: now,
};

// --- Suppress console ---
let consoleSpy: jest.SpyInstance;

beforeEach(() => {
  consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  mockApiKeyAuth.locationId = null;
});

afterEach(() => {
  consoleSpy.mockRestore();
});

// =============================================================================
// GET /api/v1/inventory
// =============================================================================
describe('GET /api/v1/inventory', () => {
  it('should return paginated inventory items', async () => {
    (prismaMock.inventoryItem.findMany as jest.Mock).mockResolvedValue([mockInventoryItem]);
    (prismaMock.inventoryItem.count as jest.Mock).mockResolvedValue(1);

    const req = makeRequest('http://localhost:3000/api/v1/inventory');
    const res = await getInventoryList(req, {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Amoxicillin 500mg');
    expect(body.meta).toBeDefined();
    expect(body.meta.total).toBe(1);
  });

  it('should filter by category', async () => {
    (prismaMock.inventoryItem.findMany as jest.Mock).mockResolvedValue([mockInventoryItem]);
    (prismaMock.inventoryItem.count as jest.Mock).mockResolvedValue(1);

    const req = makeRequest('http://localhost:3000/api/v1/inventory?category=MEDICINE');
    const res = await getInventoryList(req, {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    // Verify findMany was called with category in where clause
    expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: 'MEDICINE' }),
      })
    );
  });

  it('should filter low stock items', async () => {
    const lowStockItem = { ...mockInventoryItem, quantity: 5, minStock: 20 };
    const normalItem = { ...mockInventoryItem, id: 'inv-2', quantity: 100, minStock: 20 };

    // First call returns all items, second call (low stock re-fetch) returns items with minStock
    (prismaMock.inventoryItem.findMany as jest.Mock)
      .mockResolvedValueOnce([lowStockItem, normalItem]) // initial
      .mockResolvedValueOnce([lowStockItem, normalItem]); // low stock re-fetch
    (prismaMock.inventoryItem.count as jest.Mock).mockResolvedValue(2);

    const req = makeRequest('http://localhost:3000/api/v1/inventory?lowStock=true');
    const res = await getInventoryList(req, {});
    const body = await res.json();

    expect(res.status).toBe(200);
    // Only the low stock item should remain after post-filtering
    expect(body.data).toHaveLength(1);
    expect(body.data[0].quantity).toBe(5);
  });
});

// =============================================================================
// POST /api/v1/inventory
// =============================================================================
describe('POST /api/v1/inventory', () => {
  it('should create new inventory item', async () => {
    const created = { ...mockInventoryItem, id: 'inv-new' };
    (prismaMock.inventoryItem.create as jest.Mock).mockResolvedValue(created);

    const req = makeRequest('http://localhost:3000/api/v1/inventory', {
      method: 'POST',
      body: JSON.stringify({ name: 'Amoxicillin 500mg', category: 'MEDICINE' }),
    });
    const res = await createInventoryItem(req, {});
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.id).toBe('inv-new');
    expect(prismaMock.inventoryItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          name: 'Amoxicillin 500mg',
          category: 'MEDICINE',
        }),
      })
    );
  });

  it('should require name and category', async () => {
    const req = makeRequest('http://localhost:3000/api/v1/inventory', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await createInventoryItem(req, {});
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});

// =============================================================================
// GET /api/v1/inventory/[id]
// =============================================================================
describe('GET /api/v1/inventory/[id]', () => {
  it('should return single item', async () => {
    (prismaMock.inventoryItem.findFirst as jest.Mock).mockResolvedValue(mockInventoryItem);

    const req = makeRequest('http://localhost:3000/api/v1/inventory/inv-1');
    const res = await getInventoryItem(req, { params: Promise.resolve({ id: 'inv-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.id).toBe('inv-1');
    expect(body.data.name).toBe('Amoxicillin 500mg');
  });

  it('should return 404 for non-existent', async () => {
    (prismaMock.inventoryItem.findFirst as jest.Mock).mockResolvedValue(null);

    const req = makeRequest('http://localhost:3000/api/v1/inventory/inv-999');
    const res = await getInventoryItem(req, { params: Promise.resolve({ id: 'inv-999' }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.code).toBe('NOT_FOUND');
  });
});

// =============================================================================
// PUT /api/v1/inventory/[id]
// =============================================================================
describe('PUT /api/v1/inventory/[id]', () => {
  it('should update item', async () => {
    const updated = { ...mockInventoryItem, name: 'Amoxicillin 250mg' };
    (prismaMock.inventoryItem.findFirst as jest.Mock).mockResolvedValue(mockInventoryItem);
    (prismaMock.inventoryItem.update as jest.Mock).mockResolvedValue(updated);

    const req = makeRequest('http://localhost:3000/api/v1/inventory/inv-1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Amoxicillin 250mg' }),
    });
    const res = await updateInventoryItem(req, { params: Promise.resolve({ id: 'inv-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.name).toBe('Amoxicillin 250mg');
  });
});

// =============================================================================
// DELETE /api/v1/inventory/[id]
// =============================================================================
describe('DELETE /api/v1/inventory/[id]', () => {
  it('should soft delete (set DISCONTINUED)', async () => {
    (prismaMock.inventoryItem.findFirst as jest.Mock).mockResolvedValue(mockInventoryItem);
    (prismaMock.inventoryItem.update as jest.Mock).mockResolvedValue({
      ...mockInventoryItem,
      status: 'DISCONTINUED',
    });

    const req = makeRequest('http://localhost:3000/api/v1/inventory/inv-1', { method: 'DELETE' });
    const res = await deleteInventoryItem(req, { params: Promise.resolve({ id: 'inv-1' }) });

    expect(res.status).toBe(204);
    expect(prismaMock.inventoryItem.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { status: 'DISCONTINUED' },
    });
  });
});

// =============================================================================
// GET /api/v1/inventory/transfers
// =============================================================================
describe('GET /api/v1/inventory/transfers', () => {
  it('should return transfers list', async () => {
    const mockTransfer = {
      id: 'transfer-1',
      tenantId: 'tenant-1',
      inventoryItemId: 'inv-1',
      fromLocationId: 'loc-1',
      toLocationId: 'loc-2',
      quantity: 10,
      status: 'PENDING',
      notes: null,
      requestedById: 'staff-1',
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      inventoryItem: { id: 'inv-1', name: 'Amoxicillin', category: 'MEDICINE' },
      fromLocation: { id: 'loc-1', name: 'Main', slug: 'main' },
      toLocation: { id: 'loc-2', name: 'Branch', slug: 'branch' },
      requestedBy: { id: 'staff-1', name: 'Dr. Smith', position: 'Veterinarian' },
    };

    (prismaMock.inventoryTransfer.findMany as jest.Mock).mockResolvedValue([mockTransfer]);
    (prismaMock.inventoryTransfer.count as jest.Mock).mockResolvedValue(1);

    const req = makeRequest('http://localhost:3000/api/v1/inventory/transfers');
    const res = await getTransfers(req, {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('transfer-1');
    expect(body.meta.total).toBe(1);
  });
});

// =============================================================================
// POST /api/v1/inventory/transfers
// =============================================================================
describe('POST /api/v1/inventory/transfers', () => {
  const transferPayload = {
    inventoryItemId: '00000000-0000-0000-0000-000000000001',
    fromLocationId: '00000000-0000-0000-0000-000000000010',
    toLocationId: '00000000-0000-0000-0000-000000000020',
    quantity: 5,
    requestedById: '00000000-0000-0000-0000-000000000100',
  };

  it('should create transfer', async () => {
    (prismaMock.inventoryItem.findFirst as jest.Mock).mockResolvedValue({
      ...mockInventoryItem,
      id: '00000000-0000-0000-0000-000000000001',
      locationId: '00000000-0000-0000-0000-000000000010',
      quantity: 100,
    });
    (prismaMock.location.findFirst as jest.Mock)
      .mockResolvedValueOnce({ id: '00000000-0000-0000-0000-000000000010', tenantId: 'tenant-1', isActive: true })
      .mockResolvedValueOnce({ id: '00000000-0000-0000-0000-000000000020', tenantId: 'tenant-1', isActive: true });
    (prismaMock.staff.findFirst as jest.Mock).mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000100',
      tenantId: 'tenant-1',
      isActive: true,
    });

    const createdTransfer = {
      id: 'transfer-new',
      tenantId: 'tenant-1',
      ...transferPayload,
      status: 'PENDING',
      notes: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      inventoryItem: { id: '00000000-0000-0000-0000-000000000001', name: 'Amoxicillin', category: 'MEDICINE' },
      fromLocation: { id: '00000000-0000-0000-0000-000000000010', name: 'Main', slug: 'main' },
      toLocation: { id: '00000000-0000-0000-0000-000000000020', name: 'Branch', slug: 'branch' },
      requestedBy: { id: '00000000-0000-0000-0000-000000000100', name: 'Dr. Smith', position: 'Veterinarian' },
    };
    (prismaMock.inventoryTransfer.create as jest.Mock).mockResolvedValue(createdTransfer);

    const req = makeRequest('http://localhost:3000/api/v1/inventory/transfers', {
      method: 'POST',
      body: JSON.stringify(transferPayload),
    });
    const res = await createTransfer(req, {});
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.id).toBe('transfer-new');
    expect(body.data.status).toBe('PENDING');
  });

  it('should reject same from/to location', async () => {
    const sameLocationId = '00000000-0000-0000-0000-000000000010';
    const req = makeRequest('http://localhost:3000/api/v1/inventory/transfers', {
      method: 'POST',
      body: JSON.stringify({
        ...transferPayload,
        fromLocationId: sameLocationId,
        toLocationId: sameLocationId,
      }),
    });
    const res = await createTransfer(req, {});
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('different');
  });
});
