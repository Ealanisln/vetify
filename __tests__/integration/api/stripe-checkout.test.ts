/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Track redirect calls
let redirectUrl: string | null = null;

// Mock next/navigation redirect
jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    redirectUrl = url;
    const error = new Error('NEXT_REDIRECT');
    (error as any).digest = 'NEXT_REDIRECT';
    throw error;
  }),
}));

// Mock Stripe
const mockStripe = {
  checkout: {
    sessions: {
      retrieve: jest.fn(),
    },
  },
  subscriptions: {
    retrieve: jest.fn(),
  },
};

const mockHandleSubscriptionChange = jest.fn();

jest.mock('@/lib/payments/stripe', () => ({
  stripe: mockStripe,
  handleSubscriptionChange: mockHandleSubscriptionChange,
}));

// Import after mocks
import { GET } from '@/app/api/stripe/checkout/route';

// Test data factories
const createMockSession = (overrides = {}): Partial<Stripe.Checkout.Session> => ({
  id: 'cs_test_123',
  status: 'complete',
  payment_status: 'paid',
  mode: 'subscription',
  subscription: 'sub_test_123',
  customer: 'cus_test_123',
  ...overrides,
});

const createMockSubscription = (overrides = {}): Partial<Stripe.Subscription> => ({
  id: 'sub_test_123',
  status: 'active',
  customer: 'cus_test_123',
  current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
  items: {
    data: [
      {
        plan: {
          product: 'prod_test_123',
        },
      },
    ],
  } as any,
  ...overrides,
});

const createMockTenant = (overrides = {}) => ({
  id: 'tenant-1',
  name: 'Test Clinic',
  slug: 'test-clinic',
  stripeCustomerId: 'cus_test_123',
  stripeSubscriptionId: 'sub_test_123',
  subscriptionStatus: 'ACTIVE',
  planName: 'PROFESIONAL',
  ...overrides,
});

// Helper to create mock request
const createMockRequest = (sessionId?: string) => {
  const url = sessionId
    ? `http://localhost:3000/api/stripe/checkout?session_id=${sessionId}`
    : 'http://localhost:3000/api/stripe/checkout';
  return new NextRequest(url);
};

describe('Stripe Checkout API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redirectUrl = null;
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Session Validation', () => {
    it('should redirect to error when session_id is missing', async () => {
      const request = createMockRequest();

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toBe('/precios?error=session_missing');
    });

    it('should redirect to error when session retrieval fails', async () => {
      mockStripe.checkout.sessions.retrieve.mockRejectedValue(new Error('Session not found'));
      const request = createMockRequest('invalid_session_id');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toContain('/precios?error=processing_failed');
    });

    it('should redirect to error when session status is not complete', async () => {
      const incompleteSession = createMockSession({ status: 'open' });
      mockStripe.checkout.sessions.retrieve.mockResolvedValue(incompleteSession);
      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toBe('/precios?error=session_incomplete');
    });

    it('should redirect to error when session status is expired', async () => {
      const expiredSession = createMockSession({ status: 'expired' });
      mockStripe.checkout.sessions.retrieve.mockResolvedValue(expiredSession);
      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toBe('/precios?error=session_incomplete');
    });
  });

  describe('Subscription Mode Validation', () => {
    it('should redirect to error when session mode is not subscription', async () => {
      const paymentSession = createMockSession({ mode: 'payment' });
      mockStripe.checkout.sessions.retrieve.mockResolvedValue(paymentSession);
      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toBe('/precios?error=subscription_missing');
    });

    it('should redirect to error when subscription ID is missing in session', async () => {
      const noSubSession = createMockSession({ subscription: null });
      mockStripe.checkout.sessions.retrieve.mockResolvedValue(noSubSession);
      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toBe('/precios?error=subscription_missing');
    });
  });

  describe('Webhook Sync - Success Cases', () => {
    it('should redirect to dashboard on successful paid subscription sync', async () => {
      const session = createMockSession({ payment_status: 'paid' });
      const subscription = createMockSubscription();
      const tenant = createMockTenant();

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(session);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);

      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toContain('/dashboard?success=subscription_created');
      expect(redirectUrl).toContain('plan=PROFESIONAL');
    });

    it('should redirect with trial_started for no_payment_required (trial)', async () => {
      const trialSession = createMockSession({ payment_status: 'no_payment_required' });
      const subscription = createMockSubscription({ status: 'trialing' });
      const tenant = createMockTenant({ planName: 'BASICO' });

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(trialSession);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);

      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toContain('/dashboard?success=trial_started');
      expect(redirectUrl).toContain('plan=BASICO');
    });

    it('should redirect with trial_started for null payment_status (trial)', async () => {
      const trialSession = createMockSession({ payment_status: null });
      const subscription = createMockSubscription({ status: 'trialing' });
      const tenant = createMockTenant();

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(trialSession);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);

      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toContain('/dashboard?success=trial_started');
    });

    it('should URL encode special characters in plan name', async () => {
      const session = createMockSession({ payment_status: 'paid' });
      const subscription = createMockSubscription();
      const tenant = createMockTenant({ planName: 'Plan Profesional/Premium' });

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(session);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);

      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toContain('plan=Plan%20Profesional%2FPremium');
    });

    it('should use unknown plan name when tenant has no plan name', async () => {
      const session = createMockSession({ payment_status: 'paid' });
      const subscription = createMockSubscription();
      const tenant = createMockTenant({ planName: null });

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(session);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);

      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toContain('plan=unknown');
    });
  });

  describe('Webhook Sync - Polling Mechanism', () => {
    it('should poll multiple times before finding synced subscription', async () => {
      const session = createMockSession({ payment_status: 'paid' });
      const subscription = createMockSubscription();
      const tenantNotSynced = createMockTenant({ stripeSubscriptionId: null });
      const tenantSynced = createMockTenant();

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(session);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);

      // First two calls return not synced, third returns synced
      prismaMock.tenant.findUnique
        .mockResolvedValueOnce(tenantNotSynced as any)
        .mockResolvedValueOnce(tenantNotSynced as any)
        .mockResolvedValueOnce(tenantSynced as any);

      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toContain('/dashboard?success=subscription_created');
      expect(prismaMock.tenant.findUnique).toHaveBeenCalledTimes(3);
    }, 20000);
  });

  describe('Manual Sync Fallback', () => {
    it('should attempt manual sync when webhook times out', async () => {
      const session = createMockSession({ payment_status: 'paid' });
      const subscription = createMockSubscription();
      const tenantNotSynced = createMockTenant({ stripeSubscriptionId: null });

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(session);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      // Always return not synced to trigger timeout
      prismaMock.tenant.findUnique.mockResolvedValue(tenantNotSynced as any);
      mockHandleSubscriptionChange.mockResolvedValue(undefined);

      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      // Should have called handleSubscriptionChange for manual sync
      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(subscription);
      expect(redirectUrl).toContain('/dashboard?success=subscription_created');
      expect(redirectUrl).toContain('info=manual_sync');
    }, 30000);

    it('should redirect with warning when manual sync fails', async () => {
      const session = createMockSession({ payment_status: 'paid' });
      const subscription = createMockSubscription();
      const tenantNotSynced = createMockTenant({ stripeSubscriptionId: null });

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(session);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      prismaMock.tenant.findUnique.mockResolvedValue(tenantNotSynced as any);
      mockHandleSubscriptionChange.mockRejectedValue(new Error('Sync failed'));

      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toContain('/dashboard?success=subscription_created');
      expect(redirectUrl).toContain('warning=sync_pending');
      expect(redirectUrl).toContain('session_id=cs_test_123');
    }, 30000);

    it('should redirect with warning when manual sync fails for trial (always uses subscription_created)', async () => {
      // Note: The actual implementation always uses subscription_created when manual sync fails
      // This is the current behavior in the checkout route (line 181)
      const session = createMockSession({ payment_status: 'no_payment_required' });
      const subscription = createMockSubscription({ status: 'trialing' });
      const tenantNotSynced = createMockTenant({ stripeSubscriptionId: null });

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(session);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      prismaMock.tenant.findUnique.mockResolvedValue(tenantNotSynced as any);
      mockHandleSubscriptionChange.mockRejectedValue(new Error('Sync failed'));

      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      // The code uses subscription_created even for trials when manual sync fails
      expect(redirectUrl).toContain('/dashboard?success=subscription_created');
      expect(redirectUrl).toContain('warning=sync_pending');
    }, 30000);
  });

  describe('Payment Status Handling', () => {
    it('should redirect to error for unpaid payment status', async () => {
      const unpaidSession = createMockSession({ payment_status: 'unpaid' });
      const subscription = createMockSubscription();
      const tenant = createMockTenant();

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(unpaidSession);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);

      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toBe('/precios?error=payment_failed');
    });
  });

  describe('Error Handling', () => {
    it('should redirect with error details when Stripe API fails', async () => {
      mockStripe.checkout.sessions.retrieve.mockRejectedValue(
        new Error('Stripe API error')
      );
      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toContain('/precios?error=processing_failed');
      expect(redirectUrl).toContain('Stripe%20API%20error');
    });

    it('should redirect with error when subscription retrieval fails during polling', async () => {
      const session = createMockSession();
      mockStripe.checkout.sessions.retrieve.mockResolvedValue(session);
      mockStripe.subscriptions.retrieve.mockRejectedValue(new Error('Subscription not found'));

      const request = createMockRequest('cs_test_123');

      // The error propagates up and triggers the error redirect
      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toContain('/precios?error=processing_failed');
      expect(redirectUrl).toContain('Subscription%20not%20found');
    }, 30000);

    it('should handle subscription as string ID in session', async () => {
      const session = createMockSession({ subscription: 'sub_string_id' });
      const subscription = createMockSubscription({ id: 'sub_string_id' });
      const tenant = createMockTenant({ stripeSubscriptionId: 'sub_string_id' });

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(session);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);

      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_string_id');
      expect(redirectUrl).toContain('/dashboard?success=subscription_created');
    });

    it('should handle subscription as object in session', async () => {
      const subscriptionObject = { id: 'sub_object_id' };
      const session = createMockSession({ subscription: subscriptionObject as any });
      const subscription = createMockSubscription({ id: 'sub_object_id' });
      const tenant = createMockTenant({ stripeSubscriptionId: 'sub_object_id' });

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(session);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);

      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toContain('/dashboard?success=subscription_created');
    });
  });

  describe('Edge Cases', () => {
    it('should handle session with subscription but no tenant found', async () => {
      const session = createMockSession({ payment_status: 'paid' });
      const subscription = createMockSubscription();

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(session);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      prismaMock.tenant.findUnique.mockResolvedValue(null);
      mockHandleSubscriptionChange.mockResolvedValue(undefined);

      const request = createMockRequest('cs_test_123');

      // Should still succeed with manual sync attempt
      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toContain('/dashboard');
    }, 30000);

    it('should handle very long plan names', async () => {
      const longPlanName = 'A'.repeat(200);
      const session = createMockSession({ payment_status: 'paid' });
      const subscription = createMockSubscription();
      const tenant = createMockTenant({ planName: longPlanName });

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(session);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);

      const request = createMockRequest('cs_test_123');

      await expect(GET(request)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirectUrl).toContain(`plan=${encodeURIComponent(longPlanName)}`);
    });
  });
});
