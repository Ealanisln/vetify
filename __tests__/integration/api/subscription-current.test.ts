/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { createTestTenant, createTestUser } from '../../utils/test-utils';

// Mock Kinde Auth
const mockGetUser = jest.fn();
jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: () => ({
    getUser: mockGetUser,
  }),
}));

// Mock the route handler
import { GET } from '@/app/api/subscription/current/route';

// Test data factories
const createTestTenantWithSubscription = (overrides = {}) => ({
  id: 'tenant-1',
  name: 'Test Clinic',
  stripeCustomerId: 'cus_test123',
  stripeSubscriptionId: 'sub_test123',
  stripeProductId: 'prod_test123',
  planName: 'PROFESIONAL',
  subscriptionStatus: 'ACTIVE',
  subscriptionEndsAt: new Date('2025-12-31'),
  isTrialPeriod: false,
  status: 'ACTIVE',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  tenantSubscription: {
    plan: {
      id: 'plan-1',
      key: 'PROFESIONAL',
      name: 'Profesional',
    },
  },
  ...overrides,
});

const createTestTrialTenant = (overrides = {}) => ({
  ...createTestTenantWithSubscription({
    subscriptionStatus: 'TRIALING',
    isTrialPeriod: true,
    subscriptionEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    ...overrides,
  }),
});

describe('Subscription Current API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenantWithSubscription>;
  let mockUser: ReturnType<typeof createTestUser>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTenant = createTestTenantWithSubscription();
    mockUser = createTestUser({ tenantId: mockTenant.id });

    // Default: authenticated user
    mockGetUser.mockResolvedValue({
      id: mockUser.id,
      email: mockUser.email,
    });
  });

  describe('GET /api/subscription/current', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue(null);

        const response = await GET();

        expect(response.status).toBe(401);
        const text = await response.text();
        expect(text).toBe('Unauthorized');
      });

      it('should proceed when user is authenticated', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        const response = await GET();

        expect(response.status).toBe(200);
      });
    });

    describe('User with No Tenant', () => {
      it('should return hasSubscription: false when user has no tenant', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: null,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.hasSubscription).toBe(false);
        expect(data.subscriptionStatus).toBeNull();
        expect(data.planName).toBeNull();
        expect(data.error).toBe('No tenant found');
      });

      it('should return hasSubscription: false when user not found', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.hasSubscription).toBe(false);
        expect(data.error).toBe('No tenant found');
      });
    });

    describe('Active Subscription', () => {
      it('should return subscription info for active subscription', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.hasSubscription).toBe(true);
        expect(data.subscriptionStatus).toBe('ACTIVE');
        expect(data.planName).toBe('PROFESIONAL');
        expect(data.isTrialPeriod).toBe(false);
        expect(data.isInTrial).toBe(false);
        expect(data.stripeSubscriptionId).toBe('sub_test123');
        expect(data.stripeProductId).toBe('prod_test123');
        expect(data.planKey).toBe('PROFESIONAL');
      });

      it('should calculate days remaining correctly', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

        const tenantWith30Days = createTestTenantWithSubscription({
          subscriptionEndsAt: futureDate,
        });

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: tenantWith30Days,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.daysRemaining).toBeGreaterThanOrEqual(29);
        expect(data.daysRemaining).toBeLessThanOrEqual(31);
      });

      it('should return negative days for expired subscription', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 5); // 5 days ago

        const expiredTenant = createTestTenantWithSubscription({
          subscriptionEndsAt: pastDate,
        });

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: expiredTenant,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.daysRemaining).toBeLessThan(0);
      });
    });

    describe('Trial Subscription', () => {
      it('should return trial info for trialing subscription', async () => {
        const trialTenant = createTestTrialTenant();

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: trialTenant,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.hasSubscription).toBe(true);
        expect(data.subscriptionStatus).toBe('TRIALING');
        expect(data.isTrialPeriod).toBe(true);
        expect(data.isInTrial).toBe(true);
      });

      it('should not report isInTrial when not in trial period', async () => {
        // Status is TRIALING but isTrialPeriod is false (edge case)
        const inconsistentTenant = createTestTenantWithSubscription({
          subscriptionStatus: 'TRIALING',
          isTrialPeriod: false,
        });

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: inconsistentTenant,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscriptionStatus).toBe('TRIALING');
        expect(data.isInTrial).toBe(false);
      });
    });

    describe('Inactive/Canceled Subscription', () => {
      it('should return hasSubscription false for canceled subscription', async () => {
        const canceledTenant = createTestTenantWithSubscription({
          subscriptionStatus: 'CANCELED',
        });

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: canceledTenant,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.hasSubscription).toBe(false);
        expect(data.subscriptionStatus).toBe('CANCELED');
      });

      it('should return hasSubscription false for past due subscription', async () => {
        const pastDueTenant = createTestTenantWithSubscription({
          subscriptionStatus: 'PAST_DUE',
        });

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: pastDueTenant,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.hasSubscription).toBe(false);
        expect(data.subscriptionStatus).toBe('PAST_DUE');
      });

      it('should return hasSubscription false when no Stripe subscription ID', async () => {
        const noStripeTenant = createTestTenantWithSubscription({
          stripeSubscriptionId: null,
          subscriptionStatus: 'ACTIVE',
        });

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: noStripeTenant,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.hasSubscription).toBe(false);
      });
    });

    describe('Plan Name Resolution', () => {
      it('should use tenant planName when available', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(data.planName).toBe('PROFESIONAL');
      });

      it('should fall back to tenantSubscription plan name', async () => {
        const tenantWithoutPlanName = createTestTenantWithSubscription({
          planName: null,
          tenantSubscription: {
            plan: {
              id: 'plan-1',
              key: 'CLINICA',
              name: 'Clinica',
            },
          },
        });

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: tenantWithoutPlanName,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(data.planName).toBe('Clinica');
      });

      it('should return null planName when neither is available', async () => {
        const tenantWithNoPlan = createTestTenantWithSubscription({
          planName: null,
          tenantSubscription: null,
        });

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: tenantWithNoPlan,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(data.planName).toBeNull();
      });
    });

    describe('Response Structure', () => {
      it('should return all expected fields', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(data).toHaveProperty('hasSubscription');
        expect(data).toHaveProperty('subscriptionStatus');
        expect(data).toHaveProperty('planName');
        expect(data).toHaveProperty('isTrialPeriod');
        expect(data).toHaveProperty('isInTrial');
        expect(data).toHaveProperty('subscriptionEndsAt');
        expect(data).toHaveProperty('daysRemaining');
        expect(data).toHaveProperty('stripeSubscriptionId');
        expect(data).toHaveProperty('stripeProductId');
        expect(data).toHaveProperty('tenantStatus');
        expect(data).toHaveProperty('lastUpdated');
        expect(data).toHaveProperty('planKey');
      });

      it('should include tenant status', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(data.tenantStatus).toBe('ACTIVE');
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch subscription status');
        expect(data.hasSubscription).toBe(false);

        consoleSpy.mockRestore();
      });
    });

    describe('Edge Cases', () => {
      it('should handle null subscriptionEndsAt', async () => {
        const tenantWithNullEndDate = createTestTenantWithSubscription({
          subscriptionEndsAt: null,
        });

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: tenantWithNullEndDate,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.daysRemaining).toBeNull();
        expect(data.subscriptionEndsAt).toBeNull();
      });

      it('should handle EMPRESA plan correctly', async () => {
        const empresaTenant = createTestTenantWithSubscription({
          planName: 'EMPRESA',
          tenantSubscription: {
            plan: {
              id: 'plan-3',
              key: 'EMPRESA',
              name: 'Empresa',
            },
          },
        });

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: empresaTenant,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.planName).toBe('EMPRESA');
        expect(data.planKey).toBe('EMPRESA');
      });
    });
  });
});
