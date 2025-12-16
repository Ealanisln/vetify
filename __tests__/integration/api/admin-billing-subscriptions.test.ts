/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Mock super-admin check
const mockRequireSuperAdmin = jest.fn();
jest.mock('@/lib/super-admin', () => ({
  requireSuperAdmin: () => mockRequireSuperAdmin(),
}));

// Import after mocks
import { GET } from '@/app/api/admin/billing/subscriptions/route';

// Test data factories
const createMockPlan = (overrides = {}) => ({
  id: 'plan-1',
  name: 'Profesional',
  monthlyPrice: new Decimal(599),
  ...overrides,
});

const createMockTenantSubscription = (overrides = {}) => ({
  id: 'sub-1',
  tenantId: 'tenant-1',
  planId: 'plan-1',
  status: 'ACTIVE',
  stripeSubscriptionId: 'sub_stripe_123',
  currentPeriodStart: new Date('2025-01-01'),
  currentPeriodEnd: new Date('2025-02-01'),
  cancelAtPeriodEnd: false,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-15'),
  tenant: {
    id: 'tenant-1',
    name: 'Test Clinic',
  },
  plan: createMockPlan(),
  ...overrides,
});

// Helper to create mock request
const createMockRequest = (params: Record<string, string | undefined> = {}) => {
  const url = new URL('http://localhost:3000/api/admin/billing/subscriptions');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  });
  return new Request(url.toString());
};

describe('Admin Billing Subscriptions API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSuperAdmin.mockResolvedValue({ user: { id: 'admin-1', email: 'admin@vetify.pro' } });
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/admin/billing/subscriptions', () => {
    describe('Authorization', () => {
      it('should return 500 when user is not super admin', async () => {
        mockRequireSuperAdmin.mockRejectedValue(new Error('Access denied'));

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });

      it('should proceed when user is super admin', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(0);

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('subscriptions');
      });
    });

    describe('Subscription Listing', () => {
      it('should return empty subscriptions array when none exist', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(0);

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscriptions).toEqual([]);
        expect(data.total).toBe(0);
      });

      it('should transform subscriptions with correct structure', async () => {
        const subscriptions = [createMockTenantSubscription()];
        prismaMock.tenantSubscription.findMany.mockResolvedValue(subscriptions as any);
        prismaMock.tenantSubscription.count.mockResolvedValue(1);

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscriptions).toHaveLength(1);
        expect(data.subscriptions[0]).toHaveProperty('id', 'sub-1');
        expect(data.subscriptions[0]).toHaveProperty('tenantName', 'Test Clinic');
        expect(data.subscriptions[0]).toHaveProperty('planName', 'Profesional');
        expect(data.subscriptions[0]).toHaveProperty('status', 'ACTIVE');
        expect(data.subscriptions[0]).toHaveProperty('currency', 'MXN');
      });

      it('should include currentPeriodEnd as ISO string', async () => {
        const subscriptions = [createMockTenantSubscription()];
        prismaMock.tenantSubscription.findMany.mockResolvedValue(subscriptions as any);
        prismaMock.tenantSubscription.count.mockResolvedValue(1);

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscriptions[0].currentPeriodEnd).toBe('2025-02-01T00:00:00.000Z');
      });

      it('should return multiple subscriptions', async () => {
        const subscriptions = [
          createMockTenantSubscription({ id: 'sub-1', tenant: { id: 't1', name: 'Clinic 1' } }),
          createMockTenantSubscription({ id: 'sub-2', tenant: { id: 't2', name: 'Clinic 2' } }),
          createMockTenantSubscription({ id: 'sub-3', tenant: { id: 't3', name: 'Clinic 3' } }),
        ];
        prismaMock.tenantSubscription.findMany.mockResolvedValue(subscriptions as any);
        prismaMock.tenantSubscription.count.mockResolvedValue(3);

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscriptions).toHaveLength(3);
        expect(data.total).toBe(3);
      });
    });

    describe('Status Filtering', () => {
      it('should filter by status when provided', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(0);

        await GET(createMockRequest({ status: 'ACTIVE' }));

        expect(prismaMock.tenantSubscription.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { status: 'ACTIVE' },
          })
        );
        expect(prismaMock.tenantSubscription.count).toHaveBeenCalledWith({
          where: { status: 'ACTIVE' },
        });
      });

      it('should not filter by status when not provided', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(0);

        await GET(createMockRequest());

        expect(prismaMock.tenantSubscription.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {},
          })
        );
      });

      it('should filter PAST_DUE subscriptions', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(0);

        await GET(createMockRequest({ status: 'PAST_DUE' }));

        expect(prismaMock.tenantSubscription.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { status: 'PAST_DUE' },
          })
        );
      });

      it('should filter CANCELED subscriptions', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(0);

        await GET(createMockRequest({ status: 'CANCELED' }));

        expect(prismaMock.tenantSubscription.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { status: 'CANCELED' },
          })
        );
      });
    });

    describe('Pagination', () => {
      it('should apply limit parameter', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(0);

        await GET(createMockRequest({ limit: '10' }));

        expect(prismaMock.tenantSubscription.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 10,
          })
        );
      });

      it('should apply offset parameter', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(0);

        await GET(createMockRequest({ offset: '20' }));

        expect(prismaMock.tenantSubscription.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 20,
          })
        );
      });

      it('should return pagination info in response', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(50);

        const response = await GET(createMockRequest({ limit: '10', offset: '20' }));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.total).toBe(50);
        expect(data.limit).toBe(10);
        expect(data.offset).toBe(20);
      });

      it('should default offset to 0', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(0);

        await GET(createMockRequest());

        expect(prismaMock.tenantSubscription.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 0,
          })
        );
      });

      it('should not apply limit when not provided', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(10);

        await GET(createMockRequest());

        expect(prismaMock.tenantSubscription.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: undefined,
          })
        );
      });

      it('should set limit to total when not provided in response', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(25);

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(data.limit).toBe(25);
      });
    });

    describe('Ordering', () => {
      it('should order by updatedAt descending', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(0);

        await GET(createMockRequest());

        expect(prismaMock.tenantSubscription.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: {
              updatedAt: 'desc',
            },
          })
        );
      });
    });

    describe('Data Includes', () => {
      it('should include tenant name and id', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(0);

        await GET(createMockRequest());

        expect(prismaMock.tenantSubscription.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            include: expect.objectContaining({
              tenant: {
                select: {
                  name: true,
                  id: true,
                },
              },
            }),
          })
        );
      });

      it('should include plan name and monthlyPrice', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(0);

        await GET(createMockRequest());

        expect(prismaMock.tenantSubscription.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            include: expect.objectContaining({
              plan: {
                select: {
                  name: true,
                  monthlyPrice: true,
                },
              },
            }),
          })
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle subscription without tenant', async () => {
        const subscriptions = [
          createMockTenantSubscription({ tenant: null }),
        ];
        prismaMock.tenantSubscription.findMany.mockResolvedValue(subscriptions as any);
        prismaMock.tenantSubscription.count.mockResolvedValue(1);

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscriptions[0].tenantName).toBe('N/A');
      });

      it('should handle subscription without plan', async () => {
        const subscriptions = [
          createMockTenantSubscription({ plan: null }),
        ];
        prismaMock.tenantSubscription.findMany.mockResolvedValue(subscriptions as any);
        prismaMock.tenantSubscription.count.mockResolvedValue(1);

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscriptions[0].planName).toBe('N/A');
        expect(data.subscriptions[0].amount).toBe(0);
      });

      it('should handle subscription without currentPeriodEnd', async () => {
        const subscriptions = [
          createMockTenantSubscription({ currentPeriodEnd: null }),
        ];
        prismaMock.tenantSubscription.findMany.mockResolvedValue(subscriptions as any);
        prismaMock.tenantSubscription.count.mockResolvedValue(1);

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscriptions[0].currentPeriodEnd).toBeDefined();
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        prismaMock.tenantSubscription.findMany.mockRejectedValue(new Error('Database error'));

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });

      it('should handle count query errors gracefully', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockRejectedValue(new Error('Count error'));

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });
    });
  });
});
