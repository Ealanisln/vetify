/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-function-type */
/**
 * Integration tests for V1 Customers API routes
 *
 * Routes tested:
 * - GET/POST /api/v1/customers
 * - GET/PUT/DELETE /api/v1/customers/[id]
 *
 * Note: duplicates/merge/resolve-duplicate routes use Kinde auth and are not tested here.
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
    scopes: ['read:customers', 'write:customers'],
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
  serializeCustomer: (customer: any) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    address: customer.address,
    preferredContactMethod: customer.preferredContactMethod,
    notes: customer.notes,
    isActive: customer.isActive,
    source: customer.source,
    locationId: customer.locationId,
    createdAt: customer.createdAt?.toISOString?.() ?? customer.createdAt,
    updatedAt: customer.updatedAt?.toISOString?.() ?? customer.updatedAt,
  }),
}));

// Import route handlers AFTER mocks
import { GET as getCustomers, POST as createCustomer } from '@/app/api/v1/customers/route';
import { GET as getCustomer, PUT as updateCustomer, DELETE as deleteCustomer } from '@/app/api/v1/customers/[id]/route';

// --- Helpers ---
function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

const now = new Date();

const mockCustomer = {
  id: 'cust-1',
  tenantId: 'tenant-1',
  locationId: null,
  name: 'Maria Garcia',
  email: 'maria@test.com',
  firstName: 'Maria',
  lastName: 'Garcia',
  phone: '555-1234',
  address: '123 Main St',
  preferredContactMethod: 'email',
  notes: null,
  isActive: true,
  source: 'MANUAL',
  createdAt: now,
  updatedAt: now,
};

let consoleSpy: jest.SpyInstance;

beforeEach(() => {
  consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  mockApiKeyAuth.locationId = null;
});

afterEach(() => {
  consoleSpy.mockRestore();
});

// =============================================================================
// GET /api/v1/customers
// =============================================================================
describe('GET /api/v1/customers', () => {
  it('should return customer list', async () => {
    (prismaMock.customer.findMany as jest.Mock).mockResolvedValue([mockCustomer]);
    (prismaMock.customer.count as jest.Mock).mockResolvedValue(1);

    const req = makeRequest('http://localhost:3000/api/v1/customers');
    const res = await getCustomers(req, {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Maria Garcia');
    expect(body.meta.total).toBe(1);
  });

  it('should search by name', async () => {
    (prismaMock.customer.findMany as jest.Mock).mockResolvedValue([mockCustomer]);
    (prismaMock.customer.count as jest.Mock).mockResolvedValue(1);

    const req = makeRequest('http://localhost:3000/api/v1/customers?search=Maria');
    const res = await getCustomers(req, {});

    expect(res.status).toBe(200);
    expect(prismaMock.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: expect.objectContaining({ contains: 'Maria' }) }),
          ]),
        }),
      })
    );
  });

  it('should filter by isActive', async () => {
    (prismaMock.customer.findMany as jest.Mock).mockResolvedValue([]);
    (prismaMock.customer.count as jest.Mock).mockResolvedValue(0);

    const req = makeRequest('http://localhost:3000/api/v1/customers?isActive=false');
    const res = await getCustomers(req, {});

    expect(res.status).toBe(200);
    expect(prismaMock.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: false }),
      })
    );
  });
});

// =============================================================================
// POST /api/v1/customers
// =============================================================================
describe('POST /api/v1/customers', () => {
  it('should create customer', async () => {
    const created = { ...mockCustomer, id: 'cust-new', source: 'API' };
    (prismaMock.customer.create as jest.Mock).mockResolvedValue(created);

    const req = makeRequest('http://localhost:3000/api/v1/customers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Maria Garcia', email: 'maria@test.com' }),
    });
    const res = await createCustomer(req, {});
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.id).toBe('cust-new');
  });

  it('should require name field', async () => {
    const req = makeRequest('http://localhost:3000/api/v1/customers', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com' }),
    });
    const res = await createCustomer(req, {});
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('should set source to API', async () => {
    const created = { ...mockCustomer, id: 'cust-new', source: 'API' };
    (prismaMock.customer.create as jest.Mock).mockResolvedValue(created);

    const req = makeRequest('http://localhost:3000/api/v1/customers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Customer' }),
    });
    await createCustomer(req, {});

    expect(prismaMock.customer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: 'API' }),
      })
    );
  });
});

// =============================================================================
// GET /api/v1/customers/[id]
// =============================================================================
describe('GET /api/v1/customers/[id]', () => {
  it('should return customer with pets', async () => {
    const customerWithPets = {
      ...mockCustomer,
      pets: [
        { id: 'pet-1', name: 'Luna', species: 'Dog', breed: 'Labrador' },
        { id: 'pet-2', name: 'Michi', species: 'Cat', breed: 'Siamese' },
      ],
    };
    (prismaMock.customer.findFirst as jest.Mock).mockResolvedValue(customerWithPets);

    const req = makeRequest('http://localhost:3000/api/v1/customers/cust-1');
    const res = await getCustomer(req, { params: Promise.resolve({ id: 'cust-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.id).toBe('cust-1');
    expect(body.data.pets).toHaveLength(2);
    expect(body.data.pets[0].name).toBe('Luna');
  });
});

// =============================================================================
// PUT /api/v1/customers/[id]
// =============================================================================
describe('PUT /api/v1/customers/[id]', () => {
  it('should update customer', async () => {
    const updated = { ...mockCustomer, phone: '555-9999' };
    (prismaMock.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer);
    (prismaMock.customer.update as jest.Mock).mockResolvedValue(updated);

    const req = makeRequest('http://localhost:3000/api/v1/customers/cust-1', {
      method: 'PUT',
      body: JSON.stringify({ phone: '555-9999' }),
    });
    const res = await updateCustomer(req, { params: Promise.resolve({ id: 'cust-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.phone).toBe('555-9999');
  });
});

// =============================================================================
// DELETE /api/v1/customers/[id]
// =============================================================================
describe('DELETE /api/v1/customers/[id]', () => {
  it('should soft delete (isActive=false)', async () => {
    (prismaMock.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer);
    (prismaMock.customer.update as jest.Mock).mockResolvedValue({ ...mockCustomer, isActive: false });

    const req = makeRequest('http://localhost:3000/api/v1/customers/cust-1', { method: 'DELETE' });
    const res = await deleteCustomer(req, { params: Promise.resolve({ id: 'cust-1' }) });

    expect(res.status).toBe(204);
    expect(prismaMock.customer.update).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
      data: { isActive: false },
    });
  });
});
