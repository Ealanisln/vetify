/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';

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
jest.mock('@/lib/payments/stripe', () => ({
  stripe: {
    subscriptions: {
      retrieve: (...args: any[]) => mockStripeSubscriptionsRetrieve(...args),
    },
  },
}));

// Import after mocks
import { GET } from '@/app/api/user/subscription/route';

// Test data factories
const createTestTenant = (overrides = {}) => ({
  id: 'tenant-1',
  name: 'Test Clinic',
  stripeCustomerId: 'cus_test123',
  stripeSubscriptionId: 'sub_test123',
  stripeProductId: 'prod_test123',
  planName: 'PROFESIONAL',
  subscriptionStatus: 'ACTIVE',
  subscriptionEndsAt: new Date('2025-12-31'),
  isTrialPeriod: false,
  trialEndsAt: null,
  status: 'ACTIVE',
  ...overrides,
});

const createTestTrialTenant = (overrides = {}) => {
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
  return createTestTenant({
    subscriptionStatus: 'TRIALING',
    isTrialPeriod: true,
    stripeSubscriptionId: null,
    subscriptionEndsAt: null,
    trialEndsAt,
    ...overrides,
  });
};

const createMockStripeSubscription = (overrides = {}) => ({
  id: 'sub_test123',
  status: 'active',
  current_period_start: Math.floor(Date.now() / 1000) - 15 * 24 * 60 * 60,
  current_period_end: Math.floor(Date.now() / 1000) + 15 * 24 * 60 * 60,
  trial_start: null,
  trial_end: null,
  cancel_at_period_end: false,
  canceled_at: null,
  items: {
    data: [
      {
        price: {
          id: 'price_test123',
          recurring: {
            interval: 'month',
            interval_count: 1,
          },
        },
        quantity: 1,
      },
    ],
  },
  ...overrides,
});

describe('User Subscription API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: authenticated user
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    });
  });

  describe('GET /api/user/subscription', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockIsAuthenticated.mockReturnValue(false);

        const response = await GET();

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('No autorizado');
      });

      it('should return 401 when user is null', async () => {
        mockGetUser.mockResolvedValue(null);

        const response = await GET();

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('No autorizado');
      });

      it('should proceed when user is authenticated', async () => {
        const tenant = createTestTenant();
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
        mockStripeSubscriptionsRetrieve.mockResolvedValue(createMockStripeSubscription());

        const response = await GET();

        expect(response.status).toBe(200);
      });
    });

    describe('No Tenant', () => {
      it('should return 404 when tenant is not found', async () => {
        prismaMock.tenant.findFirst.mockResolvedValue(null);

        const response = await GET();

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data.error).toBe('Tenant no encontrado');
      });
    });

    describe('Active Subscription', () => {
      it('should return tenant and subscription info', async () => {
        const tenant = createTestTenant();
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
        mockStripeSubscriptionsRetrieve.mockResolvedValue(createMockStripeSubscription());

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.tenant).toBeDefined();
        expect(data.tenant.id).toBe('tenant-1');
        expect(data.tenant.name).toBe('Test Clinic');
        expect(data.tenant.status).toBe('ACTIVE');
      });

      it('should return subscription status and plan', async () => {
        const tenant = createTestTenant();
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
        mockStripeSubscriptionsRetrieve.mockResolvedValue(createMockStripeSubscription());

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscription).toBeDefined();
        expect(data.subscription.status).toBe('ACTIVE');
        expect(data.subscription.planName).toBe('PROFESIONAL');
        expect(data.subscription.isTrialPeriod).toBe(false);
      });

      it('should return Stripe IDs', async () => {
        const tenant = createTestTenant();
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
        mockStripeSubscriptionsRetrieve.mockResolvedValue(createMockStripeSubscription());

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.stripe).toBeDefined();
        expect(data.stripe.customerId).toBe('cus_test123');
        expect(data.stripe.subscriptionId).toBe('sub_test123');
        expect(data.stripe.productId).toBe('prod_test123');
      });

      it('should return Stripe subscription details', async () => {
        const tenant = createTestTenant();
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
        mockStripeSubscriptionsRetrieve.mockResolvedValue(createMockStripeSubscription());

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.stripe.details).toBeDefined();
        expect(data.stripe.details.id).toBe('sub_test123');
        expect(data.stripe.details.status).toBe('active');
        expect(data.stripe.details.cancelAtPeriodEnd).toBe(false);
      });

      it('should return subscription items with price details', async () => {
        const tenant = createTestTenant();
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
        mockStripeSubscriptionsRetrieve.mockResolvedValue(createMockStripeSubscription());

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.stripe.details.items).toBeDefined();
        expect(data.stripe.details.items[0].priceId).toBe('price_test123');
        expect(data.stripe.details.items[0].interval).toBe('month');
      });

      it('should calculate subscription days remaining', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const tenant = createTestTenant({
          subscriptionEndsAt: futureDate,
        });
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
        mockStripeSubscriptionsRetrieve.mockResolvedValue(createMockStripeSubscription());

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscription.subscriptionDaysRemaining).toBeGreaterThanOrEqual(29);
        expect(data.subscription.subscriptionDaysRemaining).toBeLessThanOrEqual(31);
      });
    });

    describe('Trial Period', () => {
      it('should return trial info for trial tenant', async () => {
        const trialTenant = createTestTrialTenant();
        prismaMock.tenant.findFirst.mockResolvedValue(trialTenant as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscription.isTrialPeriod).toBe(true);
        expect(data.subscription.status).toBe('TRIALING');
      });

      it('should calculate trial days remaining', async () => {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);

        const trialTenant = createTestTrialTenant({
          trialEndsAt,
        });
        prismaMock.tenant.findFirst.mockResolvedValue(trialTenant as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscription.trialDaysRemaining).toBeGreaterThanOrEqual(6);
        expect(data.subscription.trialDaysRemaining).toBeLessThanOrEqual(8);
      });

      it('should return trialEndsAt date', async () => {
        const trialTenant = createTestTrialTenant();
        prismaMock.tenant.findFirst.mockResolvedValue(trialTenant as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscription.trialEndsAt).toBeDefined();
      });

      it('should not have Stripe subscription for trial without subscription', async () => {
        const trialTenant = createTestTrialTenant();
        prismaMock.tenant.findFirst.mockResolvedValue(trialTenant as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.stripe.subscriptionId).toBeNull();
        expect(data.stripe.details).toBeNull();
      });
    });

    describe('Stripe Subscription with Trial', () => {
      it('should return trial dates from Stripe subscription', async () => {
        const tenant = createTestTenant({
          isTrialPeriod: true,
        });
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);

        const trialStart = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
        const trialEnd = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

        mockStripeSubscriptionsRetrieve.mockResolvedValue(
          createMockStripeSubscription({
            status: 'trialing',
            trial_start: trialStart,
            trial_end: trialEnd,
          })
        );

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.stripe.details.status).toBe('trialing');
        expect(data.stripe.details.trialStart).toBeDefined();
        expect(data.stripe.details.trialEnd).toBeDefined();
      });
    });

    describe('Canceled Subscription', () => {
      it('should return cancel information', async () => {
        const tenant = createTestTenant({
          subscriptionStatus: 'CANCELED',
        });
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);

        const canceledAt = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

        mockStripeSubscriptionsRetrieve.mockResolvedValue(
          createMockStripeSubscription({
            status: 'canceled',
            cancel_at_period_end: true,
            canceled_at: canceledAt,
          })
        );

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.stripe.details.status).toBe('canceled');
        expect(data.stripe.details.cancelAtPeriodEnd).toBe(true);
        expect(data.stripe.details.canceledAt).toBeDefined();
      });
    });

    describe('Annual Subscription', () => {
      it('should return annual interval for annual subscription', async () => {
        const tenant = createTestTenant();
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);

        mockStripeSubscriptionsRetrieve.mockResolvedValue(
          createMockStripeSubscription({
            items: {
              data: [
                {
                  price: {
                    id: 'price_annual_test',
                    recurring: {
                      interval: 'year',
                      interval_count: 1,
                    },
                  },
                  quantity: 1,
                },
              ],
            },
          })
        );

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.stripe.details.items[0].interval).toBe('year');
      });
    });

    describe('Stripe API Errors', () => {
      it('should handle Stripe API error gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const tenant = createTestTenant();
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);

        mockStripeSubscriptionsRetrieve.mockRejectedValue(
          new Error('Stripe API error')
        );

        const response = await GET();
        const data = await response.json();

        // Should still return 200 but without Stripe details
        expect(response.status).toBe(200);
        expect(data.stripe.details).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it('should return tenant info even if Stripe fails', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const tenant = createTestTenant();
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);

        mockStripeSubscriptionsRetrieve.mockRejectedValue(
          new Error('Network error')
        );

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.tenant.id).toBe('tenant-1');
        expect(data.subscription.planName).toBe('PROFESIONAL');

        consoleSpy.mockRestore();
      });
    });

    describe('Edge Cases', () => {
      it('should handle null subscriptionEndsAt', async () => {
        const tenant = createTestTenant({
          subscriptionEndsAt: null,
        });
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
        mockStripeSubscriptionsRetrieve.mockResolvedValue(createMockStripeSubscription());

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscription.subscriptionDaysRemaining).toBeNull();
        expect(data.subscription.endsAt).toBeNull();
      });

      it('should handle null trialEndsAt when in trial', async () => {
        const tenant = createTestTenant({
          isTrialPeriod: true,
          trialEndsAt: null,
        });
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
        mockStripeSubscriptionsRetrieve.mockResolvedValue(createMockStripeSubscription());

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscription.trialDaysRemaining).toBeNull();
      });

      it('should handle expired subscription', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 5);

        const tenant = createTestTenant({
          subscriptionEndsAt: pastDate,
          subscriptionStatus: 'PAST_DUE',
        });
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
        mockStripeSubscriptionsRetrieve.mockResolvedValue(
          createMockStripeSubscription({
            status: 'past_due',
          })
        );

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscription.subscriptionDaysRemaining).toBeLessThan(0);
        expect(data.subscription.status).toBe('PAST_DUE');
      });

      it('should handle tenant without Stripe IDs', async () => {
        const tenant = createTestTenant({
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          stripeProductId: null,
        });
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.stripe.customerId).toBeNull();
        expect(data.stripe.subscriptionId).toBeNull();
        expect(data.stripe.productId).toBeNull();
        expect(data.stripe.details).toBeNull();
      });
    });

    describe('Response Structure', () => {
      it('should return complete response structure', async () => {
        const tenant = createTestTenant();
        prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
        mockStripeSubscriptionsRetrieve.mockResolvedValue(createMockStripeSubscription());

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);

        // Tenant structure
        expect(data).toHaveProperty('tenant');
        expect(data.tenant).toHaveProperty('id');
        expect(data.tenant).toHaveProperty('name');
        expect(data.tenant).toHaveProperty('status');

        // Subscription structure
        expect(data).toHaveProperty('subscription');
        expect(data.subscription).toHaveProperty('status');
        expect(data.subscription).toHaveProperty('planName');
        expect(data.subscription).toHaveProperty('isTrialPeriod');
        expect(data.subscription).toHaveProperty('trialDaysRemaining');
        expect(data.subscription).toHaveProperty('subscriptionDaysRemaining');
        expect(data.subscription).toHaveProperty('endsAt');
        expect(data.subscription).toHaveProperty('trialEndsAt');

        // Stripe structure
        expect(data).toHaveProperty('stripe');
        expect(data.stripe).toHaveProperty('customerId');
        expect(data.stripe).toHaveProperty('subscriptionId');
        expect(data.stripe).toHaveProperty('productId');
        expect(data.stripe).toHaveProperty('details');
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        prismaMock.tenant.findFirst.mockRejectedValue(new Error('Database error'));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');

        consoleSpy.mockRestore();
      });
    });
  });
});
