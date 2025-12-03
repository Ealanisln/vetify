/**
 * Admin Billing API Tests
 * VETIF-51: Phase 1 - Admin API Route Tests
 *
 * Tests cover:
 * - Billing metrics retrieval
 * - Revenue calculations
 * - Subscription statistics
 * - Authorization enforcement
 */

import { Decimal } from '@prisma/client/runtime/library';

// Mock super-admin module
const mockRequireSuperAdmin = jest.fn();
jest.mock('@/lib/super-admin', () => ({
  requireSuperAdmin: (...args: unknown[]) => mockRequireSuperAdmin(...args),
}));

// Mock prisma - define inside factory to avoid hoisting issues
const mockTenantSubscriptionFindMany = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenantSubscription: {
      findMany: (...args: unknown[]) => mockTenantSubscriptionFindMany(...args),
    },
  },
}));

// Import route handlers after mocks
import { GET } from '@/app/api/admin/billing/route';

// Create a reference for easier use in tests
const mockPrisma = {
  tenantSubscription: {
    findMany: mockTenantSubscriptionFindMany,
  },
};

describe('Admin Billing API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/billing', () => {
    describe('Authorization', () => {
      it('should call requireSuperAdmin', async () => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
        mockPrisma.tenantSubscription.findMany.mockResolvedValue([]);

        await GET();

        expect(mockRequireSuperAdmin).toHaveBeenCalled();
      });

      it('should return 500 when not authorized', async () => {
        mockRequireSuperAdmin.mockRejectedValue(
          new Error('Access denied. Super admin privileges required.')
        );

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });
    });

    describe('Metrics Calculation', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
      });

      it('should return billing stats with no subscriptions', async () => {
        mockPrisma.tenantSubscription.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.totalRevenue).toBe(0);
        expect(data.monthlyRevenue).toBe(0);
        expect(data.activeSubscriptions).toBe(0);
        expect(data.pendingPayments).toBe(0);
      });

      it('should count active subscriptions correctly', async () => {
        mockPrisma.tenantSubscription.findMany.mockResolvedValue([
          { status: 'ACTIVE', plan: { monthlyPrice: new Decimal(599) }, tenant: { name: 'Tenant 1' } },
          { status: 'ACTIVE', plan: { monthlyPrice: new Decimal(599) }, tenant: { name: 'Tenant 2' } },
          { status: 'CANCELED', plan: { monthlyPrice: new Decimal(599) }, tenant: { name: 'Tenant 3' } },
          { status: 'ACTIVE', plan: { monthlyPrice: new Decimal(1199) }, tenant: { name: 'Tenant 4' } },
        ]);

        const response = await GET();
        const data = await response.json();

        expect(data.activeSubscriptions).toBe(3);
      });

      it('should calculate total revenue from active subscriptions', async () => {
        mockPrisma.tenantSubscription.findMany.mockResolvedValue([
          { status: 'ACTIVE', plan: { monthlyPrice: new Decimal(599) }, tenant: { name: 'Tenant 1' } },
          { status: 'ACTIVE', plan: { monthlyPrice: new Decimal(1199) }, tenant: { name: 'Tenant 2' } },
          { status: 'CANCELED', plan: { monthlyPrice: new Decimal(599) }, tenant: { name: 'Tenant 3' } },
        ]);

        const response = await GET();
        const data = await response.json();

        expect(data.totalRevenue).toBe(599 + 1199);
        expect(data.monthlyRevenue).toBe(599 + 1199);
      });

      it('should count pending payments (PAST_DUE status)', async () => {
        mockPrisma.tenantSubscription.findMany.mockResolvedValue([
          { status: 'ACTIVE', plan: { monthlyPrice: new Decimal(599) }, tenant: { name: 'Tenant 1' } },
          { status: 'PAST_DUE', plan: { monthlyPrice: new Decimal(599) }, tenant: { name: 'Tenant 2' } },
          { status: 'PAST_DUE', plan: { monthlyPrice: new Decimal(1199) }, tenant: { name: 'Tenant 3' } },
        ]);

        const response = await GET();
        const data = await response.json();

        expect(data.pendingPayments).toBe(2);
      });

      it('should include revenue data for charts', async () => {
        mockPrisma.tenantSubscription.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data.revenueData).toBeDefined();
        expect(Array.isArray(data.revenueData)).toBe(true);
        expect(data.revenueData.length).toBe(12); // 12 months
        expect(data.revenueData[0]).toHaveProperty('month');
        expect(data.revenueData[0]).toHaveProperty('revenue');
      });

      it('should handle subscriptions without plan data', async () => {
        mockPrisma.tenantSubscription.findMany.mockResolvedValue([
          { status: 'ACTIVE', plan: null, tenant: { name: 'Tenant 1' } },
          { status: 'ACTIVE', plan: { monthlyPrice: new Decimal(599) }, tenant: { name: 'Tenant 2' } },
        ]);

        const response = await GET();
        const data = await response.json();

        expect(data.totalRevenue).toBe(599);
        expect(data.activeSubscriptions).toBe(2);
      });
    });

    describe('Response Structure', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
        mockPrisma.tenantSubscription.findMany.mockResolvedValue([]);
      });

      it('should include all required fields', async () => {
        const response = await GET();
        const data = await response.json();

        expect(data).toHaveProperty('totalRevenue');
        expect(data).toHaveProperty('monthlyRevenue');
        expect(data).toHaveProperty('activeSubscriptions');
        expect(data).toHaveProperty('pendingPayments');
        expect(data).toHaveProperty('revenueGrowth');
        expect(data).toHaveProperty('revenueData');
      });

      it('should return revenueGrowth as 0 (placeholder)', async () => {
        const response = await GET();
        const data = await response.json();

        expect(data.revenueGrowth).toBe(0);
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
      });

      it('should return 500 for database errors', async () => {
        mockPrisma.tenantSubscription.findMany.mockRejectedValue(
          new Error('Database connection failed')
        );

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });
    });
  });
});

describe('Billing Metrics Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSuperAdmin.mockResolvedValue({
      user: { id: 'admin_123', email: 'admin@vetify.pro' },
    });
  });

  it('should handle all subscription statuses', async () => {
    mockPrisma.tenantSubscription.findMany.mockResolvedValue([
      { status: 'ACTIVE', plan: { monthlyPrice: new Decimal(599) }, tenant: { name: 'T1' } },
      { status: 'TRIALING', plan: { monthlyPrice: new Decimal(599) }, tenant: { name: 'T2' } },
      { status: 'PAST_DUE', plan: { monthlyPrice: new Decimal(599) }, tenant: { name: 'T3' } },
      { status: 'CANCELED', plan: { monthlyPrice: new Decimal(599) }, tenant: { name: 'T4' } },
      { status: 'UNPAID', plan: { monthlyPrice: new Decimal(599) }, tenant: { name: 'T5' } },
    ]);

    const response = await GET();
    const data = await response.json();

    // Only ACTIVE counts for revenue and active count
    expect(data.activeSubscriptions).toBe(1);
    expect(data.totalRevenue).toBe(599);
    // Only PAST_DUE counts as pending payment
    expect(data.pendingPayments).toBe(1);
  });

  it('should handle large number of subscriptions', async () => {
    const manySubscriptions = Array.from({ length: 1000 }, (_, i) => ({
      status: i % 3 === 0 ? 'ACTIVE' : i % 3 === 1 ? 'CANCELED' : 'PAST_DUE',
      plan: { monthlyPrice: new Decimal(599) },
      tenant: { name: `Tenant ${i}` },
    }));

    mockPrisma.tenantSubscription.findMany.mockResolvedValue(manySubscriptions);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    // 334 active (indices 0, 3, 6, ... 999)
    expect(data.activeSubscriptions).toBe(334);
  });

  it('should handle subscriptions with different plan prices', async () => {
    mockPrisma.tenantSubscription.findMany.mockResolvedValue([
      { status: 'ACTIVE', plan: { monthlyPrice: new Decimal(599) }, tenant: { name: 'T1' } },
      { status: 'ACTIVE', plan: { monthlyPrice: new Decimal(1199) }, tenant: { name: 'T2' } },
      { status: 'ACTIVE', plan: { monthlyPrice: new Decimal(5000) }, tenant: { name: 'T3' } },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(data.totalRevenue).toBe(599 + 1199 + 5000);
  });
});
