/**
 * @jest-environment node
 *
 * Request-level validation for POST /api/subscription/upgrade.
 * Uses the real schema and price table — the previous version of this file
 * asserted against inline copies with legacy B2B plans (CLINICA/EMPRESA)
 * that no longer exist.
 */
import {
  UpgradeRequestSchema,
  isValidUpgrade,
} from '@/lib/payments/upgrade-validation';
import { PLAN_PRICES } from '@/lib/payments/stripe';

// Mock env so importing stripe.ts doesn't throw on missing keys
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key';

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({}))
);

describe('POST /api/subscription/upgrade request validation', () => {
  it('accepts a minimal valid request for each current plan', () => {
    for (const plan of ['BASICO', 'PROFESIONAL', 'CORPORATIVO']) {
      expect(UpgradeRequestSchema.safeParse({ targetPlan: plan }).success).toBe(true);
    }
  });

  it('rejects legacy B2B plan keys that the old UI used to send', () => {
    for (const plan of ['CLINICA', 'EMPRESA']) {
      const result = UpgradeRequestSchema.safeParse({ targetPlan: plan });
      expect(result.success).toBe(false);
    }
  });

  it('rejects missing targetPlan and invalid billing intervals', () => {
    expect(UpgradeRequestSchema.safeParse({}).success).toBe(false);
    expect(
      UpgradeRequestSchema.safeParse({ targetPlan: 'BASICO', billingInterval: 'weekly' }).success
    ).toBe(false);
  });
});

describe('upgrade tier rules used by the route', () => {
  it('allows BASICO subscribers to upgrade to both higher tiers', () => {
    expect(isValidUpgrade('BASICO', 'PROFESIONAL')).toBe(true);
    expect(isValidUpgrade('BASICO', 'CORPORATIVO')).toBe(true);
  });

  it('rejects downgrades so the route returns the support-contact message', () => {
    expect(isValidUpgrade('CORPORATIVO', 'BASICO')).toBe(false);
    expect(isValidUpgrade('PROFESIONAL', 'BASICO')).toBe(false);
  });
});

describe('annual billing savings (real PLAN_PRICES)', () => {
  function annualSavings(plan: keyof typeof PLAN_PRICES): number {
    const prices = PLAN_PRICES[plan];
    return prices.monthly * 12 - prices.annual;
  }

  it('annual price never exceeds 12 monthly payments', () => {
    for (const plan of Object.keys(PLAN_PRICES) as (keyof typeof PLAN_PRICES)[]) {
      expect(annualSavings(plan)).toBeGreaterThanOrEqual(0);
    }
  });

  it('self-serve plans offer a real annual discount', () => {
    // CORPORATIVO stays at parity (custom-quote placeholder pricing)
    expect(annualSavings('BASICO')).toBeGreaterThan(0);
    expect(annualSavings('PROFESIONAL')).toBeGreaterThan(0);
  });

  it('matches the advertised BASICO and PROFESIONAL savings', () => {
    expect(annualSavings('BASICO')).toBe(599 * 12 - 4788);
    expect(annualSavings('PROFESIONAL')).toBe(1199 * 12 - 9588);
  });
});

describe('trial conversion decision', () => {
  // Mirrors the route's branch: fromTrial || (isTrialPeriod && !stripeSubscriptionId)
  function isTrialConversion(fromTrial: boolean, isTrialPeriod: boolean, stripeSubscriptionId: string | null): boolean {
    return fromTrial || (isTrialPeriod && !stripeSubscriptionId);
  }

  it('routes trial tenants without a subscription to checkout', () => {
    expect(isTrialConversion(false, true, null)).toBe(true);
    expect(isTrialConversion(true, false, null)).toBe(true);
  });

  it('routes subscribed tenants to the in-place upgrade path', () => {
    expect(isTrialConversion(false, false, 'sub_123')).toBe(false);
    expect(isTrialConversion(false, true, 'sub_123')).toBe(false);
  });
});
