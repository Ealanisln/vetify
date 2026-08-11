import {
  BILLING_PRICES,
  checkoutCurrency,
  currencyOptionsForPlan,
} from '@/lib/payments/billing-prices';

describe('BILLING_PRICES', () => {
  it('matches the confirmed monthly price table (minor units)', () => {
    // Básico: $599 MXN / $29.900 CLP / $129.900 COP / $35 USD
    expect(BILLING_PRICES.BASICO.monthly).toEqual({
      MXN: 59900,
      CLP: 29900, // CLP is zero-decimal in Stripe
      COP: 12990000,
      USD: 3500,
    });

    // Profesional: $1,199 MXN / $59.900 CLP / $259.900 COP / $69 USD
    expect(BILLING_PRICES.PROFESIONAL.monthly).toEqual({
      MXN: 119900,
      CLP: 59900,
      COP: 25990000,
      USD: 6900,
    });
  });

  it('keeps the MXN amounts in sync with the existing catalog', () => {
    // Same amounts PLAN_PRICES has always charged (599/1199 monthly, 8x annual)
    expect(BILLING_PRICES.BASICO.annual.MXN).toBe(478800);
    expect(BILLING_PRICES.PROFESIONAL.annual.MXN).toBe(958800);
  });

  it('prices annual at roughly 8x monthly for self-serve plans, never more', () => {
    for (const plan of ['BASICO', 'PROFESIONAL'] as const) {
      for (const ccy of ['MXN', 'CLP', 'COP', 'USD'] as const) {
        const ratio = BILLING_PRICES[plan].annual[ccy] / BILLING_PRICES[plan].monthly[ccy];
        expect(ratio).toBeGreaterThan(7.5);
        expect(ratio).toBeLessThanOrEqual(8);
      }
    }
  });

  it('defines every billing currency for every plan and interval', () => {
    for (const plan of Object.values(BILLING_PRICES)) {
      for (const interval of ['monthly', 'annual'] as const) {
        expect(Object.keys(plan[interval]).sort()).toEqual(['CLP', 'COP', 'MXN', 'USD']);
      }
    }
  });
});

describe('currencyOptionsForPlan', () => {
  it('builds Stripe currency_options excluding the MXN base currency', () => {
    expect(currencyOptionsForPlan('BASICO', 'monthly')).toEqual({
      clp: { unit_amount: 29900 },
      cop: { unit_amount: 12990000 },
      usd: { unit_amount: 3500 },
    });
  });

  it('covers annual intervals', () => {
    const options = currencyOptionsForPlan('PROFESIONAL', 'annual');
    expect(options.usd).toEqual({ unit_amount: 54900 });
    expect(options).not.toHaveProperty('mxn');
  });
});

describe('checkoutCurrency', () => {
  it('returns the lowercase currency for non-MXN billing currencies', () => {
    expect(checkoutCurrency('CLP')).toBe('clp');
    expect(checkoutCurrency('COP')).toBe('cop');
    expect(checkoutCurrency('USD')).toBe('usd');
  });

  it('returns undefined for MXN so the price base currency applies', () => {
    expect(checkoutCurrency('MXN')).toBeUndefined();
  });

  it('returns undefined for unknown or missing values', () => {
    expect(checkoutCurrency('PEN')).toBeUndefined();
    expect(checkoutCurrency('')).toBeUndefined();
    expect(checkoutCurrency(null)).toBeUndefined();
    expect(checkoutCurrency(undefined)).toBeUndefined();
  });
});
