import {
  formatBillingAmount,
  localizePlanPrices,
  resolveBillingCurrency,
} from '@/lib/pricing-localization';

describe('resolveBillingCurrency', () => {
  it('accepts supported billing currencies', () => {
    expect(resolveBillingCurrency('CLP')).toBe('CLP');
    expect(resolveBillingCurrency('cop')).toBe('COP');
    expect(resolveBillingCurrency('USD')).toBe('USD');
  });

  it('falls back to MXN for unknown or missing values', () => {
    expect(resolveBillingCurrency('PEN')).toBe('MXN');
    expect(resolveBillingCurrency(null)).toBe('MXN');
    expect(resolveBillingCurrency(undefined)).toBe('MXN');
    expect(resolveBillingCurrency('')).toBe('MXN');
  });
});

describe('localizePlanPrices', () => {
  const plans = [
    {
      id: 'basico',
      prices: {
        monthly: { id: 'p1', unitAmount: 59900 },
        yearly: { id: 'p2', unitAmount: 478800 },
      },
    },
    {
      id: 'profesional',
      prices: {
        monthly: { id: 'p3', unitAmount: 119900 },
        yearly: { id: 'p4', unitAmount: 958800 },
      },
    },
  ];

  it('swaps unit amounts to the local currency table (CLP)', () => {
    const localized = localizePlanPrices(plans, 'CLP');

    expect(localized[0].prices.monthly.unitAmount).toBe(29900);
    expect(localized[0].prices.yearly.unitAmount).toBe(239000);
    expect(localized[1].prices.monthly.unitAmount).toBe(59900);
    expect(localized[1].prices.yearly.unitAmount).toBe(479000);
  });

  it('keeps price IDs and other fields intact', () => {
    const localized = localizePlanPrices(plans, 'COP');

    expect(localized[0].prices.monthly.id).toBe('p1');
    expect(localized[0].id).toBe('basico');
  });

  it('returns plans unchanged for MXN', () => {
    expect(localizePlanPrices(plans, 'MXN')).toEqual(plans);
  });

  it('leaves plans without a known billing key unchanged', () => {
    const unknown = [
      { id: 'legacy-plan', prices: { monthly: { id: 'x', unitAmount: 100 }, yearly: { id: 'y', unitAmount: 1000 } } },
    ];

    expect(localizePlanPrices(unknown, 'CLP')).toEqual(unknown);
  });

  it('does not mutate the input array', () => {
    localizePlanPrices(plans, 'CLP');

    expect(plans[0].prices.monthly.unitAmount).toBe(59900);
  });
});

describe('formatBillingAmount', () => {
  it('formats zero-decimal CLP from minor units', () => {
    expect(formatBillingAmount(29900, 'CLP')).toContain('29.900');
  });

  it('formats two-decimal currencies from minor units', () => {
    expect(formatBillingAmount(3500, 'USD')).toContain('35');
    expect(formatBillingAmount(12990000, 'COP')).toContain('129.900');
  });

  it('formats MXN like the legacy pricing page (no decimals for whole amounts)', () => {
    expect(formatBillingAmount(59900, 'MXN')).toContain('599');
  });
});
