/**
 * V1 Customer Duplicates API Tests
 * Tests for moved endpoints from /api/admin/customers/ to /api/v1/customers/.
 * Verifies auth via requireAuth() and tenant scoping.
 */

const mockRequireAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}));

const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: {
    customer: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/customers/duplicates/route';

function createMockRequest(url: string): NextRequest {
  return new Request(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as NextRequest;
}

describe('GET /api/v1/customers/duplicates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 500 (redirect) when user is not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new Error('No authenticated user'));

    const request = createMockRequest('http://localhost:3000/api/v1/customers/duplicates');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it('returns data scoped to tenant', async () => {
    mockRequireAuth.mockResolvedValue({
      user: { id: 'user-1', tenantId: 'tenant-1' },
      tenant: { id: 'tenant-1' },
    });

    mockFindMany.mockResolvedValue([]);

    const request = createMockRequest('http://localhost:3000/api/v1/customers/duplicates');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.customers).toEqual([]);
    expect(body.stats).toBeDefined();

    // Verify tenant scoping in the query
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
        }),
      })
    );
  });

  it('uses requireAuth instead of getAuthenticatedUser', async () => {
    mockRequireAuth.mockResolvedValue({
      user: { id: 'user-1', tenantId: 'tenant-1' },
      tenant: { id: 'tenant-1' },
    });
    mockFindMany.mockResolvedValue([]);

    const request = createMockRequest('http://localhost:3000/api/v1/customers/duplicates');
    await GET(request);

    expect(mockRequireAuth).toHaveBeenCalledTimes(1);
  });
});
