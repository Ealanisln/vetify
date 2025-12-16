/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Mock super-admin check
const mockRequireSuperAdmin = jest.fn();
jest.mock('@/lib/super-admin', () => ({
  requireSuperAdmin: () => mockRequireSuperAdmin(),
}));

// Import after mocks
import { GET } from '@/app/api/admin/billing/route';

// Test data factories
const createMockPlan = (overrides = {}) => ({
  id: 'plan-1',
  key: 'PROFESIONAL',
  name: 'Profesional',
  monthlyPrice: new Decimal(599),
  annualPrice: new Decimal(5990),
  features: [],
  isActive: true,
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

describe('Admin Billing API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSuperAdmin.mockResolvedValue({ user: { id: 'admin-1', email: 'admin@vetify.pro' } });
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/admin/billing', () => {
    describe('Authorization', () => {
      it('should return 500 when user is not super admin', async () => {
        mockRequireSuperAdmin.mockRejectedValue(new Error('Access denied'));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });

      it('should proceed when user is super admin', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('totalRevenue');
      });
    });

    describe('Billing Stats Calculation', () => {
      it('should return zero stats when no subscriptions exist', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.activeSubscriptions).toBe(0);
        expect(data.totalRevenue).toBe(0);
        expect(data.pendingPayments).toBe(0);
      });

      it('should calculate active subscriptions correctly', async () => {
        const subscriptions = [
          createMockTenantSubscription({ status: 'ACTIVE' }),
          createMockTenantSubscription({ id: 'sub-2', status: 'ACTIVE' }),
          createMockTenantSubscription({ id: 'sub-3', status: 'CANCELED' }),
        ];
        prismaMock.tenantSubscription.findMany.mockResolvedValue(subscriptions as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.activeSubscriptions).toBe(2);
      });

      it('should calculate total revenue from active subscriptions', async () => {
        const subscriptions = [
          createMockTenantSubscription({
            status: 'ACTIVE',
            plan: createMockPlan({ monthlyPrice: new Decimal(599) }),
          }),
          createMockTenantSubscription({
            id: 'sub-2',
            status: 'ACTIVE',
            plan: createMockPlan({ id: 'plan-2', monthlyPrice: new Decimal(1199) }),
          }),
          createMockTenantSubscription({
            id: 'sub-3',
            status: 'CANCELED',
            plan: createMockPlan({ id: 'plan-3', monthlyPrice: new Decimal(5000) }),
          }),
        ];
        prismaMock.tenantSubscription.findMany.mockResolvedValue(subscriptions as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.totalRevenue).toBe(1798); // 599 + 1199 (canceled not counted)
      });

      it('should count pending payments (PAST_DUE status)', async () => {
        const subscriptions = [
          createMockTenantSubscription({ status: 'ACTIVE' }),
          createMockTenantSubscription({ id: 'sub-2', status: 'PAST_DUE' }),
          createMockTenantSubscription({ id: 'sub-3', status: 'PAST_DUE' }),
        ];
        prismaMock.tenantSubscription.findMany.mockResolvedValue(subscriptions as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.pendingPayments).toBe(2);
      });

      it('should handle subscriptions without plans gracefully', async () => {
        const subscriptions = [
          createMockTenantSubscription({ status: 'ACTIVE', plan: null }),
        ];
        prismaMock.tenantSubscription.findMany.mockResolvedValue(subscriptions as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.totalRevenue).toBe(0);
      });
    });

    describe('Response Structure', () => {
      it('should return all expected fields', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('totalRevenue');
        expect(data).toHaveProperty('monthlyRevenue');
        expect(data).toHaveProperty('activeSubscriptions');
        expect(data).toHaveProperty('pendingPayments');
        expect(data).toHaveProperty('revenueGrowth');
        expect(data).toHaveProperty('revenueData');
      });

      it('should return 12 months of revenue data', async () => {
        prismaMock.tenantSubscription.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.revenueData).toHaveLength(12);
        expect(data.revenueData[0]).toHaveProperty('month');
        expect(data.revenueData[0]).toHaveProperty('revenue');
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        prismaMock.tenantSubscription.findMany.mockRejectedValue(new Error('Database error'));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });
    });
  });
});
