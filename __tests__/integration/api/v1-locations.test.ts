/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-function-type */
/**
 * Integration tests for V1 Locations API routes
 *
 * Routes tested:
 * - GET /api/v1/locations
 * - GET /api/v1/locations/[id]
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
    scopes: ['read:locations'],
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
  serializeLocation: (loc: any) => ({
    id: loc.id,
    name: loc.name,
    slug: loc.slug,
    address: loc.address,
    phone: loc.phone,
    email: loc.email,
    timezone: loc.timezone,
    isActive: loc.isActive,
    isPrimary: loc.isPrimary,
    createdAt: loc.createdAt?.toISOString?.() ?? loc.createdAt,
    updatedAt: loc.updatedAt?.toISOString?.() ?? loc.updatedAt,
  }),
}));

// Import route handlers AFTER mocks
import { GET as getLocations } from '@/app/api/v1/locations/route';
import { GET as getLocation } from '@/app/api/v1/locations/[id]/route';

// --- Helpers ---
function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

const now = new Date();

const mockLocation1 = {
  id: 'loc-1',
  tenantId: 'tenant-1',
  name: 'Main Clinic',
  slug: 'main-clinic',
  address: '123 Main St',
  phone: '555-0001',
  email: 'main@clinic.com',
  timezone: 'America/Mexico_City',
  isActive: true,
  isPrimary: true,
  createdAt: now,
  updatedAt: now,
};

const mockLocation2 = {
  id: 'loc-2',
  tenantId: 'tenant-1',
  name: 'Branch Office',
  slug: 'branch-office',
  address: '456 Branch Ave',
  phone: '555-0002',
  email: 'branch@clinic.com',
  timezone: 'America/Mexico_City',
  isActive: true,
  isPrimary: false,
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
// GET /api/v1/locations
// =============================================================================
describe('GET /api/v1/locations', () => {
  it('should return locations ordered by isPrimary DESC', async () => {
    (prismaMock.location.findMany as jest.Mock).mockResolvedValue([mockLocation1, mockLocation2]);
    (prismaMock.location.count as jest.Mock).mockResolvedValue(2);

    const req = makeRequest('http://localhost:3000/api/v1/locations');
    const res = await getLocations(req, {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].isPrimary).toBe(true);
    expect(prismaMock.location.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
      })
    );
  });

  it('should filter by isActive', async () => {
    (prismaMock.location.findMany as jest.Mock).mockResolvedValue([mockLocation1]);
    (prismaMock.location.count as jest.Mock).mockResolvedValue(1);

    const req = makeRequest('http://localhost:3000/api/v1/locations?isActive=true');
    const res = await getLocations(req, {});

    expect(res.status).toBe(200);
    expect(prismaMock.location.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      })
    );
  });

  it('should return only scoped location when API key has locationId', async () => {
    mockApiKeyAuth.locationId = 'loc-1';

    (prismaMock.location.findMany as jest.Mock).mockResolvedValue([mockLocation1]);
    (prismaMock.location.count as jest.Mock).mockResolvedValue(1);

    const req = makeRequest('http://localhost:3000/api/v1/locations');
    const res = await getLocations(req, {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    // When scoped, the where clause includes { id: locationId }
    expect(prismaMock.location.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'loc-1' }),
      })
    );
  });
});

// =============================================================================
// GET /api/v1/locations/[id]
// =============================================================================
describe('GET /api/v1/locations/[id]', () => {
  it('should return single location', async () => {
    (prismaMock.location.findFirst as jest.Mock).mockResolvedValue(mockLocation1);

    const req = makeRequest('http://localhost:3000/api/v1/locations/loc-1');
    const res = await getLocation(req, { params: Promise.resolve({ id: 'loc-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.id).toBe('loc-1');
    expect(body.data.name).toBe('Main Clinic');
  });

  it('should return 404 for non-existent', async () => {
    (prismaMock.location.findFirst as jest.Mock).mockResolvedValue(null);

    const req = makeRequest('http://localhost:3000/api/v1/locations/loc-999');
    const res = await getLocation(req, { params: Promise.resolve({ id: 'loc-999' }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.code).toBe('NOT_FOUND');
  });

  it('should reject access to different location when scoped', async () => {
    mockApiKeyAuth.locationId = 'loc-1';

    const req = makeRequest('http://localhost:3000/api/v1/locations/loc-2');
    const res = await getLocation(req, { params: Promise.resolve({ id: 'loc-2' }) });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe('FORBIDDEN');
  });
});
