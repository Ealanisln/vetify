/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { createTestTenant, createTestUser } from '../../utils/test-utils';

// Mock Kinde Auth
const mockGetUser = jest.fn();
const mockIsAuthenticated = jest.fn();
jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: () => ({
    getUser: mockGetUser,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

// Mock Stripe
const mockStripeSubscriptionsRetrieve = jest.fn();
const mockStripeInvoicesRetrieveUpcoming = jest.fn();
const mockUpdateSubscription = jest.fn();
const mockCreateCheckoutSessionForAPI = jest.fn();
const mockGetPriceIdByPlan = jest.fn();
const mockGetStripePlanMapping = jest.fn();

jest.mock('@/lib/payments/stripe', () => ({
  stripe: {
    subscriptions: {
      retrieve: (...args: any[]) => mockStripeSubscriptionsRetrieve(...args),
    },
    invoices: {
      retrieveUpcoming: (...args: any[]) => mockStripeInvoicesRetrieveUpcoming(...args),
    },
  },
  updateSubscription: (...args: any[]) => mockUpdateSubscription(...args),
  createCheckoutSessionForAPI: (...args: any[]) => mockCreateCheckoutSessionForAPI(...args),
  getPriceIdByPlan: (...args: any[]) => mockGetPriceIdByPlan(...args),
  getStripePlanMapping: () => mockGetStripePlanMapping(),
  PLAN_PRICES: {
    PROFESIONAL: { monthly: 499, annual: 4990 },
    CLINICA: { monthly: 999, annual: 9990 },
    EMPRESA: { monthly: 1999, annual: 19990 },
  },
}));

// Import after mocks
import { GET, POST } from '@/app/api/subscription/upgrade/route';
import { NextRequest } from 'next/server';

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
    stripeSubscriptionId: null,
    subscriptionEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    tenantSubscription: null,
    ...overrides,
  }),
});

const createMockRequest = (body: any): NextRequest => {
  return {
    json: () => Promise.resolve(body),
    nextUrl: { pathname: '/api/subscription/upgrade' },
    headers: {
      get: (name: string) => {
        if (name === 'user-agent') return 'test-agent';
        if (name === 'x-forwarded-for') return '127.0.0.1';
        return null;
      },
    },
  } as unknown as NextRequest;
};

describe('Subscription Upgrade API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenantWithSubscription>;
  let mockUser: ReturnType<typeof createTestUser>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTenant = createTestTenantWithSubscription();
    mockUser = createTestUser({ tenantId: mockTenant.id });

    // Default: authenticated user
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetUser.mockResolvedValue({
      id: mockUser.id,
      email: mockUser.email,
    });

    // Default Stripe mocks
    mockGetPriceIdByPlan.mockReturnValue('price_test123');
    mockGetStripePlanMapping.mockReturnValue({
      PROFESIONAL: {
        limits: { locations: 1, staff: 5, pets: 500 },
      },
      CLINICA: {
        limits: { locations: 3, staff: 15, pets: 2000 },
      },
      EMPRESA: {
        limits: { locations: 10, staff: 50, pets: 10000 },
      },
    });
  });

  describe('GET /api/subscription/upgrade', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockIsAuthenticated.mockResolvedValue(false);

        const response = await GET();

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 401 when user ID is not found', async () => {
        mockGetUser.mockResolvedValue(null);

        const response = await GET();

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('User not found');
      });
    });

    describe('No Tenant', () => {
      it('should return 404 when user has no tenant', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: null,
        } as any);

        const response = await GET();

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data.error).toBe('No tenant found');
      });
    });

    describe('Available Upgrades', () => {
      it('should return available upgrades for PROFESIONAL plan', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.currentPlan.key).toBe('PROFESIONAL');
        expect(data.currentPlan.tier).toBe(1);
        expect(data.canUpgrade).toBe(true);
        expect(data.availableUpgrades).toHaveLength(2);
        expect(data.availableUpgrades[0].planKey).toBe('CLINICA');
        expect(data.availableUpgrades[1].planKey).toBe('EMPRESA');
      });

      it('should return available upgrades for CLINICA plan', async () => {
        const clinicaTenant = createTestTenantWithSubscription({
          planName: 'CLINICA',
          tenantSubscription: {
            plan: {
              id: 'plan-2',
              key: 'CLINICA',
              name: 'Clinica',
            },
          },
        });

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: clinicaTenant,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.currentPlan.key).toBe('CLINICA');
        expect(data.currentPlan.tier).toBe(2);
        expect(data.canUpgrade).toBe(true);
        expect(data.availableUpgrades).toHaveLength(1);
        expect(data.availableUpgrades[0].planKey).toBe('EMPRESA');
      });

      it('should return no upgrades for EMPRESA plan', async () => {
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
        expect(data.currentPlan.key).toBe('EMPRESA');
        expect(data.currentPlan.tier).toBe(3);
        expect(data.canUpgrade).toBe(false);
        expect(data.availableUpgrades).toHaveLength(0);
      });

      it('should return all upgrades for trial users without a plan', async () => {
        const trialTenant = createTestTrialTenant();

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: trialTenant,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.currentPlan.key).toBeUndefined();
        expect(data.currentPlan.tier).toBe(0);
        expect(data.currentPlan.isTrialPeriod).toBe(true);
        expect(data.canUpgrade).toBe(true);
        expect(data.availableUpgrades).toHaveLength(3);
      });

      it('should include pricing for each upgrade option', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        data.availableUpgrades.forEach((upgrade: any) => {
          expect(upgrade.pricing).toBeDefined();
          expect(upgrade.pricing.monthly).toBeDefined();
          expect(upgrade.pricing.annual).toBeDefined();
        });
      });

      it('should include limits for each upgrade option', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        data.availableUpgrades.forEach((upgrade: any) => {
          expect(upgrade.limits).toBeDefined();
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Internal server error');

        consoleSpy.mockRestore();
      });
    });
  });

  describe('POST /api/subscription/upgrade', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockIsAuthenticated.mockResolvedValue(false);

        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 401 when user ID is not found', async () => {
        mockGetUser.mockResolvedValue(null);

        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('User not found');
      });
    });

    describe('Request Validation', () => {
      it('should return 400 for invalid targetPlan', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        const request = createMockRequest({
          targetPlan: 'INVALID_PLAN',
          billingInterval: 'monthly',
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Invalid request');
      });

      it('should return 400 for invalid billingInterval', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'weekly',
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Invalid request');
      });

      it('should accept valid request body', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        mockStripeSubscriptionsRetrieve.mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
        });

        mockUpdateSubscription.mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });

        mockStripeInvoicesRetrieveUpcoming.mockResolvedValue({
          amount_due: 50000,
          currency: 'mxn',
          period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });

        prismaMock.trialAccessLog.create.mockResolvedValue({} as any);

        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
      });
    });

    describe('No Tenant', () => {
      it('should return 404 when user has no tenant', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: null,
        } as any);

        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data.error).toBe('No tenant found');
      });
    });

    describe('Trial to Paid Conversion', () => {
      it('should create checkout session for trial conversion', async () => {
        const trialTenant = createTestTrialTenant();

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: trialTenant,
        } as any);

        mockCreateCheckoutSessionForAPI.mockResolvedValue({
          url: 'https://checkout.stripe.com/session123',
        });

        const request = createMockRequest({
          targetPlan: 'PROFESIONAL',
          billingInterval: 'monthly',
          fromTrial: true,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.type).toBe('trial_conversion');
        expect(data.checkoutUrl).toBe('https://checkout.stripe.com/session123');
      });

      it('should handle trial conversion even without fromTrial flag', async () => {
        const trialTenant = createTestTrialTenant();

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: trialTenant,
        } as any);

        mockCreateCheckoutSessionForAPI.mockResolvedValue({
          url: 'https://checkout.stripe.com/session123',
        });

        const request = createMockRequest({
          targetPlan: 'PROFESIONAL',
          billingInterval: 'annual',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.type).toBe('trial_conversion');
      });

      it('should return 400 if price ID not found for trial conversion', async () => {
        const trialTenant = createTestTrialTenant();

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: trialTenant,
        } as any);

        mockGetPriceIdByPlan.mockReturnValue(null);

        const request = createMockRequest({
          targetPlan: 'PROFESIONAL',
          billingInterval: 'monthly',
          fromTrial: true,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid plan');
      });
    });

    describe('Existing Subscription Upgrade', () => {
      it('should return 400 when no active subscription exists', async () => {
        const noSubscriptionTenant = createTestTenantWithSubscription({
          stripeSubscriptionId: null,
          isTrialPeriod: false,
        });

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: noSubscriptionTenant,
        } as any);

        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('No active subscription');
      });

      it('should return 400 for canceled subscription', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        mockStripeSubscriptionsRetrieve.mockResolvedValue({
          id: 'sub_test123',
          status: 'canceled',
        });

        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid subscription status');
      });

      it('should allow upgrade from active subscription', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        mockStripeSubscriptionsRetrieve.mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
        });

        mockUpdateSubscription.mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });

        mockStripeInvoicesRetrieveUpcoming.mockResolvedValue({
          amount_due: 50000,
          currency: 'mxn',
          period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });

        prismaMock.trialAccessLog.create.mockResolvedValue({} as any);

        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.type).toBe('subscription_upgrade');
      });

      it('should allow upgrade from trialing subscription', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        mockStripeSubscriptionsRetrieve.mockResolvedValue({
          id: 'sub_test123',
          status: 'trialing',
        });

        mockUpdateSubscription.mockResolvedValue({
          id: 'sub_test123',
          status: 'trialing',
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });

        mockStripeInvoicesRetrieveUpcoming.mockResolvedValue({
          amount_due: 50000,
          currency: 'mxn',
          period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });

        prismaMock.trialAccessLog.create.mockResolvedValue({} as any);

        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('Upgrade Validation', () => {
      it('should reject downgrade (CLINICA to PROFESIONAL)', async () => {
        const clinicaTenant = createTestTenantWithSubscription({
          planName: 'CLINICA',
          tenantSubscription: {
            plan: {
              id: 'plan-2',
              key: 'CLINICA',
              name: 'Clinica',
            },
          },
        });

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: clinicaTenant,
        } as any);

        mockStripeSubscriptionsRetrieve.mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
        });

        const request = createMockRequest({
          targetPlan: 'PROFESIONAL',
          billingInterval: 'monthly',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid upgrade');
      });

      it('should reject same plan upgrade', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        mockStripeSubscriptionsRetrieve.mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
        });

        const request = createMockRequest({
          targetPlan: 'PROFESIONAL',
          billingInterval: 'monthly',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid upgrade');
      });

      it('should allow upgrade to higher tier (PROFESIONAL to CLINICA)', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        mockStripeSubscriptionsRetrieve.mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
        });

        mockUpdateSubscription.mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });

        mockStripeInvoicesRetrieveUpcoming.mockResolvedValue({
          amount_due: 50000,
          currency: 'mxn',
          period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });

        prismaMock.trialAccessLog.create.mockResolvedValue({} as any);

        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should allow upgrade to highest tier (PROFESIONAL to EMPRESA)', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        mockStripeSubscriptionsRetrieve.mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
        });

        mockUpdateSubscription.mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });

        mockStripeInvoicesRetrieveUpcoming.mockResolvedValue({
          amount_due: 150000,
          currency: 'mxn',
          period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });

        prismaMock.trialAccessLog.create.mockResolvedValue({} as any);

        const request = createMockRequest({
          targetPlan: 'EMPRESA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.subscription.plan).toBe('EMPRESA');
      });
    });

    describe('Successful Upgrade Response', () => {
      beforeEach(() => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        mockStripeSubscriptionsRetrieve.mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
        });

        mockUpdateSubscription.mockResolvedValue({
          id: 'sub_updated',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });

        mockStripeInvoicesRetrieveUpcoming.mockResolvedValue({
          amount_due: 50000,
          currency: 'mxn',
          period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });

        prismaMock.trialAccessLog.create.mockResolvedValue({} as any);
      });

      it('should return subscription details', async () => {
        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscription).toBeDefined();
        expect(data.subscription.id).toBe('sub_updated');
        expect(data.subscription.status).toBe('active');
        expect(data.subscription.plan).toBe('CLINICA');
        expect(data.subscription.billingInterval).toBe('monthly');
      });

      it('should return proration details', async () => {
        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.proration).toBeDefined();
        expect(data.proration.amount).toBe(500); // 50000 cents / 100
        expect(data.proration.currency).toBe('mxn');
      });

      it('should return new pricing details', async () => {
        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.newPricing).toBeDefined();
        expect(data.newPricing.amount).toBe(999);
        expect(data.newPricing.interval).toBe('monthly');
        expect(data.newPricing.currency).toBe('MXN');
      });

      it('should return annual pricing for annual interval', async () => {
        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'annual',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.newPricing.amount).toBe(9990);
        expect(data.newPricing.interval).toBe('annual');
      });

      it('should log the upgrade action', async () => {
        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        await POST(request);

        expect(prismaMock.trialAccessLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            tenantId: mockTenant.id,
            userId: mockUser.id,
            feature: 'subscription_upgrade',
            action: 'upgrade',
            allowed: true,
            denialReason: 'Upgraded from PROFESIONAL to CLINICA',
          }),
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle Stripe subscription not found error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        mockStripeSubscriptionsRetrieve.mockRejectedValue(
          new Error('No such subscription: sub_test123')
        );

        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Subscription not found');

        consoleSpy.mockRestore();
      });

      it('should handle Stripe price not found error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        mockStripeSubscriptionsRetrieve.mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
        });

        mockUpdateSubscription.mockRejectedValue(
          new Error('No such price: price_invalid')
        );

        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Price not found');

        consoleSpy.mockRestore();
      });

      it('should handle generic errors gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        mockStripeSubscriptionsRetrieve.mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
        });

        mockUpdateSubscription.mockRejectedValue(new Error('Network error'));

        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Internal server error');

        consoleSpy.mockRestore();
      });

      it('should return 400 when price ID not found', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: mockTenant,
        } as any);

        mockStripeSubscriptionsRetrieve.mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
        });

        mockGetPriceIdByPlan.mockReturnValue(null);

        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Price not found');
      });

      it('should return 400 when current plan is not found', async () => {
        const noPlanTenant = createTestTenantWithSubscription({
          tenantSubscription: null,
          isTrialPeriod: false,
        });

        prismaMock.user.findUnique.mockResolvedValue({
          ...mockUser,
          tenant: noPlanTenant,
        } as any);

        mockStripeSubscriptionsRetrieve.mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
        });

        const request = createMockRequest({
          targetPlan: 'CLINICA',
          billingInterval: 'monthly',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Current plan not found');
      });
    });
  });
});
