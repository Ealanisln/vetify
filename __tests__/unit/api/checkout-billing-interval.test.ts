/**
 * @jest-environment node
 *
 * /precios sends billingInterval 'annual'. The checkout route must resolve it
 * to the plan's yearly Stripe price. Uses the REAL pricing-config so a
 * mismatch between the client's interval names and the price lookup shows up.
 */

import { NextRequest } from 'next/server';
import { PRICING_CONFIG } from '@/lib/pricing-config';

const mockCreateCheckoutSessionForAPI = jest.fn();
jest.mock('@/lib/payments/stripe', () => ({
  createCheckoutSessionForAPI: (...args: unknown[]) => mockCreateCheckoutSessionForAPI(...args),
  getPriceByLookupKey: jest.fn(),
  getPlanKeyByPriceId: jest.fn().mockReturnValue(undefined),
}));

jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: () => ({
    getUser: jest.fn().mockResolvedValue({
      id: 'kp_user_1',
      email: 'owner@example.test',
      given_name: 'Ana',
      family_name: 'Ruiz',
    }),
  }),
}));

jest.mock('@/lib/db/queries/users', () => ({
  findOrCreateUser: jest.fn().mockResolvedValue({ id: 'user-1' }),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: {
      findFirst: jest.fn().mockResolvedValue({ id: 'tenant-1', name: 'Clínica Norte' }),
    },
  },
}));

jest.mock('@/lib/referrals/queries', () => ({
  resolveReferralCode: jest.fn(),
}));

import { POST } from '@/app/api/checkout/route';

function createRequest(body: unknown): NextRequest {
  return new Request('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const PLAN_KEYS = ['BASICO', 'PROFESIONAL', 'CORPORATIVO'] as const;

beforeEach(() => {
  mockCreateCheckoutSessionForAPI.mockReset();
  mockCreateCheckoutSessionForAPI.mockResolvedValue({ url: 'https://checkout.stripe.test/s' });
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
});

describe('POST /api/checkout – billing interval', () => {
  it.each(PLAN_KEYS)("charges the yearly price of %s when /precios sends 'annual'", async (planKey) => {
    const yearlyPriceId = PRICING_CONFIG.PLANS[planKey].stripePriceYearly;
    const monthlyPriceId = PRICING_CONFIG.PLANS[planKey].stripePriceMonthly;
    expect(yearlyPriceId).not.toBe(monthlyPriceId);

    const response = await POST(createRequest({ planKey, billingInterval: 'annual' }));

    expect(response.status).toBe(200);
    expect(mockCreateCheckoutSessionForAPI).toHaveBeenCalledWith(
      expect.objectContaining({ priceId: yearlyPriceId, billingInterval: 'annual' })
    );
  });

  it.each(PLAN_KEYS)("keeps accepting 'yearly' for %s", async (planKey) => {
    const response = await POST(createRequest({ planKey, billingInterval: 'yearly' }));

    expect(response.status).toBe(200);
    expect(mockCreateCheckoutSessionForAPI).toHaveBeenCalledWith(
      expect.objectContaining({ priceId: PRICING_CONFIG.PLANS[planKey].stripePriceYearly })
    );
  });

  it.each(PLAN_KEYS)('charges the monthly price of %s for monthly or a missing interval', async (planKey) => {
    const monthlyPriceId = PRICING_CONFIG.PLANS[planKey].stripePriceMonthly;

    await POST(createRequest({ planKey, billingInterval: 'monthly' }));
    await POST(createRequest({ planKey }));

    expect(mockCreateCheckoutSessionForAPI).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ priceId: monthlyPriceId, billingInterval: 'monthly' })
    );
    expect(mockCreateCheckoutSessionForAPI).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ priceId: monthlyPriceId, billingInterval: 'monthly' })
    );
  });

  it('rejects an unknown interval with a 400 in Spanish and never opens a checkout', async () => {
    const response = await POST(createRequest({ planKey: 'PROFESIONAL', billingInterval: 'weekly' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/intervalo de facturación/i);
    expect(mockCreateCheckoutSessionForAPI).not.toHaveBeenCalled();
  });
});
