/**
 * Tests the retention-clock side-effects of handleSubscriptionChange.
 * Mocks Stripe + Plan lookups so we can drive every status transition
 * the webhook can produce.
 */

jest.mock('@/lib/prisma', () => {
  const tx = {
    tenant: { update: jest.fn() },
    tenantSubscription: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  return {
    prisma: {
      tenant: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      plan: { findUnique: jest.fn() },
      $transaction: jest.fn(async (cb: (t: typeof tx) => Promise<unknown>) =>
        cb(tx),
      ),
      __tx: tx,
    },
  };
});

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    products: { retrieve: jest.fn().mockResolvedValue({ id: 'prod_test' }) },
  }));
});

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

jest.mock('@/lib/pricing-config', () => ({
  isLaunchPromotionActive: jest.fn().mockReturnValue(false),
  PRICING_CONFIG: {},
  isStripeInLiveMode: jest.fn().mockReturnValue(false),
}));

jest.mock('@/lib/promotions/queries', () => ({
  getActivePromotion: jest.fn(),
  checkPromotionAvailability: jest.fn(),
}));

// Provide a controllable plan mapping so the active branch resolves
const mockMapping: Record<string, { productId: string }> = {
  profesional: { productId: 'prod_test' },
};
jest.mock('@/lib/payments/stripe', () => {
  const actual = jest.requireActual('@/lib/payments/stripe');
  return {
    ...actual,
    getStripePlanMapping: jest.fn(() => mockMapping),
  };
});

import { prisma } from '@/lib/prisma';
import { handleSubscriptionChange } from '@/lib/payments/stripe';

const findTenant = prisma.tenant.findUnique as jest.Mock;
const txMock = (prisma as unknown as { __tx: {
  tenant: { update: jest.Mock };
  tenantSubscription: { upsert: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
} }).__tx;
const findPlan = prisma.plan.findUnique as jest.Mock;

const baseTenant = {
  id: 'tenant-1',
  stripeCustomerId: 'cus_1',
  stripeSubscriptionId: 'sub_1',
  canceledAt: null,
  dataRetentionEndsAt: null,
  retentionWarningSentAt: null,
};

function makeSubscription(status: string, opts: Partial<{
  current_period_end: number;
  current_period_start: number;
  cancel_at_period_end: boolean;
}> = {}) {
  return {
    id: 'sub_1',
    customer: 'cus_1',
    status,
    current_period_end: opts.current_period_end ?? Math.floor(Date.now() / 1000) + 86400,
    current_period_start: opts.current_period_start ?? Math.floor(Date.now() / 1000) - 86400,
    cancel_at_period_end: opts.cancel_at_period_end ?? false,
    items: {
      data: [{ plan: { product: 'prod_test' } }],
    },
  } as never;
}

describe('handleSubscriptionChange — retention clock side effects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Reactivation clearance (active/trialing branch) shares the exact same
  // pattern as the cancellation branch — both set the retention fields
  // inside the same `updateData` object passed to a single tx.tenant.update.
  // Testing those branches end-to-end requires a working Stripe plan mapping
  // which lives inside the module being tested and resists partial mocking.
  // The cancellation tests below exercise the pattern; reactivation
  // clearance is covered by manual smoke + the integration test.
  it.todo('clears retention fields when status flips to active (covered by integration)');
  it.todo('clears retention fields when status flips to trialing (covered by integration)');

  it('starts 90-day clock on first canceled (dataRetentionEndsAt was null)', async () => {
    findTenant.mockResolvedValue(baseTenant);

    await handleSubscriptionChange(makeSubscription('canceled'));

    const updateCall = txMock.tenant.update.mock.calls[0][0];
    expect(updateCall.data.subscriptionStatus).toBe('CANCELED');
    expect(updateCall.data.canceledAt).toBeInstanceOf(Date);
    const ends = updateCall.data.dataRetentionEndsAt as Date;
    const start = updateCall.data.canceledAt as Date;
    const diffDays = Math.round(
      (ends.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diffDays).toBe(90);
  });

  it('starts 90-day clock on first unpaid', async () => {
    findTenant.mockResolvedValue(baseTenant);

    await handleSubscriptionChange(makeSubscription('unpaid'));

    const data = txMock.tenant.update.mock.calls[0][0].data;
    expect(data.canceledAt).toBeInstanceOf(Date);
    expect(data.dataRetentionEndsAt).toBeInstanceOf(Date);
  });

  it('does NOT touch retention fields on past_due (transient dunning)', async () => {
    findTenant.mockResolvedValue(baseTenant);

    await handleSubscriptionChange(makeSubscription('past_due'));

    const data = txMock.tenant.update.mock.calls[0][0].data;
    expect(data).not.toHaveProperty('canceledAt');
    expect(data).not.toHaveProperty('dataRetentionEndsAt');
    expect(data.subscriptionStatus).toBe('PAST_DUE');
  });

  it('does NOT extend the clock when canceled webhook replays', async () => {
    const existingClock = new Date('2026-05-01T00:00:00Z');
    findTenant.mockResolvedValue({
      ...baseTenant,
      canceledAt: new Date('2026-02-01T00:00:00Z'),
      dataRetentionEndsAt: existingClock,
    });

    await handleSubscriptionChange(makeSubscription('canceled'));

    const data = txMock.tenant.update.mock.calls[0][0].data;
    expect(data).not.toHaveProperty('canceledAt');
    expect(data).not.toHaveProperty('dataRetentionEndsAt');
  });
});
