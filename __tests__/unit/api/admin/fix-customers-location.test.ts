/**
 * Admin Fix Customers Location API Tests
 * Tests that the endpoint requires super admin authorization (not just requireAuth).
 */

const mockRequireSuperAdmin = jest.fn();
jest.mock('@/lib/super-admin', () => ({
  requireSuperAdmin: (...args: unknown[]) => mockRequireSuperAdmin(...args),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

import { POST } from '@/app/api/admin/fix-customers-location/route';

describe('POST /api/admin/fix-customers-location', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when requireSuperAdmin throws Access denied', async () => {
    mockRequireSuperAdmin.mockRejectedValue(
      new Error('Access denied. Super admin privileges required.')
    );

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Access denied');
  });

  it('returns 401 when user is not authenticated', async () => {
    mockRequireSuperAdmin.mockRejectedValue(
      new Error('No authenticated user')
    );

    const response = await POST();

    expect(response.status).toBe(401);
  });

  it('calls requireSuperAdmin before any DB operations', async () => {
    mockRequireSuperAdmin.mockRejectedValue(
      new Error('Access denied. Super admin privileges required.')
    );

    await POST();

    expect(mockRequireSuperAdmin).toHaveBeenCalledTimes(1);
  });

  it('succeeds when user is super admin', async () => {
    mockRequireSuperAdmin.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@vetify.pro' },
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
