import {
  ONBOARDING_COUNTRIES,
  tenantCurrencyDefaults,
} from '@/lib/onboarding-defaults';

describe('ONBOARDING_COUNTRIES', () => {
  it('starts with México (the default) and ends with Otro', () => {
    expect(ONBOARDING_COUNTRIES[0]).toEqual({ code: 'MX', name: 'México' });
    expect(ONBOARDING_COUNTRIES[ONBOARDING_COUNTRIES.length - 1].code).toBe('ZZ');
  });

  it('covers every country with a supported display currency', () => {
    const codes = ONBOARDING_COUNTRIES.map(c => c.code);
    for (const code of ['MX', 'CL', 'CO', 'PE', 'AR', 'BR', 'US', 'EC', 'PA', 'SV', 'GT', 'CR', 'DO', 'BO', 'UY', 'PY']) {
      expect(codes).toContain(code);
    }
  });

  it('has no duplicate codes', () => {
    const codes = ONBOARDING_COUNTRIES.map(c => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('tenantCurrencyDefaults', () => {
  it('keeps the legacy MXN defaults when no country is given', () => {
    expect(tenantCurrencyDefaults(undefined)).toEqual({
      countryCode: null,
      billingCurrency: 'MXN',
      currencyCode: 'MXN',
      currencySymbol: '$',
      taxRate: 0.16,
      currencyConfirmed: false,
    });
  });

  it('derives billing and display currency for a launch country (Chile)', () => {
    expect(tenantCurrencyDefaults('CL')).toEqual({
      countryCode: 'CL',
      billingCurrency: 'CLP',
      currencyCode: 'CLP',
      currencySymbol: '$',
      taxRate: 0.19,
      currencyConfirmed: true,
    });
  });

  it('derives billing and display currency for Colombia', () => {
    const defaults = tenantCurrencyDefaults('CO');
    expect(defaults.billingCurrency).toBe('COP');
    expect(defaults.currencyCode).toBe('COP');
    expect(defaults.taxRate).toBe(0.19);
  });

  it('keeps local display currency but bills USD for non-launch countries', () => {
    const defaults = tenantCurrencyDefaults('PE');
    expect(defaults.countryCode).toBe('PE');
    expect(defaults.billingCurrency).toBe('USD');
    expect(defaults.currencyCode).toBe('PEN');
    expect(defaults.taxRate).toBe(0.16);
    expect(defaults.currencyConfirmed).toBe(true);
  });

  it('falls back to USD display and billing for unknown countries (Otro)', () => {
    const defaults = tenantCurrencyDefaults('ZZ');
    expect(defaults.billingCurrency).toBe('USD');
    expect(defaults.currencyCode).toBe('USD');
    expect(defaults.currencyConfirmed).toBe(true);
  });

  it('normalizes lowercase input', () => {
    expect(tenantCurrencyDefaults('cl').billingCurrency).toBe('CLP');
    expect(tenantCurrencyDefaults('cl').countryCode).toBe('CL');
  });
});
