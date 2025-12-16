/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Mock super-admin check
const mockRequireSuperAdmin = jest.fn();
jest.mock('@/lib/super-admin', () => ({
  requireSuperAdmin: () => mockRequireSuperAdmin(),
}));

// Import after mocks
import { GET } from '@/app/api/admin/billing/payments/route';

// Test data factories
const createMockPlan = (overrides = {}) => ({
  id: 'plan-1',
  key: 'PROFESIONAL',
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
const createMockRequest = (params = {}) => {
  const url = new URL('http://localhost:3000/api/admin/billing/payments');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  return new Request(url.toString());
};

describe('Admin Billing Payments API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSuperAdmin.mockResolvedValue({ user: { id: 'admin-1', email: 'admin@vetify.pro' } });
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/admin/billing/payments', () => {
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
        expect(data).toHaveProperty('payments');
      });
    });

    describe('Payment Listing', () => {
      it('should return empty payments array when no subscriptions', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(0);

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.payments).toEqual([]);
        expect(data.total).toBe(0);
      });

      it('should transform subscriptions to payment format', async () => {
        const subscriptions = [createMockTenantSubscription()];
        prismaMock.tenantSubscription.findMany.mockResolvedValue(subscriptions as any);
        prismaMock.tenantSubscription.count.mockResolvedValue(1);

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.payments).toHaveLength(1);
        expect(data.payments[0]).toHaveProperty('id');
        expect(data.payments[0]).toHaveProperty('tenantName', 'Test Clinic');
        expect(data.payments[0]).toHaveProperty('amount');
        expect(data.payments[0]).toHaveProperty('currency', 'MXN');
        expect(data.payments[0]).toHaveProperty('status', 'succeeded');
        expect(data.payments[0]).toHaveProperty('description');
      });

      it('should return failed status for PAST_DUE subscriptions', async () => {
        const subscriptions = [
          createMockTenantSubscription({ status: 'PAST_DUE' }),
        ];
        prismaMock.tenantSubscription.findMany.mockResolvedValue(subscriptions as any);
        prismaMock.tenantSubscription.count.mockResolvedValue(1);

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.payments[0].status).toBe('failed');
      });

      it('should filter by ACTIVE and PAST_DUE status only', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);
        prismaMock.tenantSubscription.count.mockResolvedValue(0);

        await GET(createMockRequest());

        expect(prismaMock.tenantSubscription.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              status: {
                in: ['ACTIVE', 'PAST_DUE'],
              },
            },
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
        expect(data.payments[0].tenantName).toBe('N/A');
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
        expect(data.payments[0].amount).toBe(0);
        expect(data.payments[0].description).toContain('Plan');
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
    });
  });
});
