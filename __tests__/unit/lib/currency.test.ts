import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  currencyForCountry,
  formatMoney,
  fromMinorUnits,
  getCurrency,
  isSupportedCurrency,
  moneyInputStep,
  moneyMaxValue,
  roundToCurrency,
  toMinorUnits,
} from '@/lib/currency';

describe('currency metadata', () => {
  it('exposes MXN as the default currency', () => {
    expect(DEFAULT_CURRENCY).toBe('MXN');
    expect(CURRENCIES[DEFAULT_CURRENCY]).toBeDefined();
  });

  it('keys every entry by its own code', () => {
    for (const [key, meta] of Object.entries(CURRENCIES)) {
      expect(meta.code).toBe(key);
    }
  });

  it('models zero-decimal currencies per ISO-4217', () => {
    expect(CURRENCIES.CLP.decimals).toBe(0);
    expect(CURRENCIES.PYG.decimals).toBe(0);
    expect(CURRENCIES.MXN.decimals).toBe(2);
    expect(CURRENCIES.USD.decimals).toBe(2);
  });

  it('separates COP display convention from its ISO minor units', () => {
    // COP is a two-decimal currency in ISO-4217 (and to Stripe), but Colombian
    // prices are universally written without cents.
    expect(CURRENCIES.COP.decimals).toBe(2);
    expect(CURRENCIES.COP.displayDecimals).toBe(0);
  });

  it('never gives a currency more display decimals than it has minor units', () => {
    for (const meta of Object.values(CURRENCIES)) {
      expect(meta.displayDecimals).toBeLessThanOrEqual(meta.decimals);
    }
  });

  it('assigns every currency a non-empty locale, symbol and Spanish name', () => {
    for (const meta of Object.values(CURRENCIES)) {
      expect(meta.locale).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      expect(meta.symbol.length).toBeGreaterThan(0);
      expect(meta.name.length).toBeGreaterThan(0);
    }
  });

  it('maps each country to exactly one currency', () => {
    const seen = new Map<string, string>();
    for (const meta of Object.values(CURRENCIES)) {
      for (const country of meta.countries) {
        expect(country).toMatch(/^[A-Z]{2}$/);
        expect(seen.has(country)).toBe(false);
        seen.set(country, meta.code);
      }
    }
  });
});

describe('getCurrency', () => {
  it('resolves a supported code', () => {
    expect(getCurrency('COP').code).toBe('COP');
  });

  it('is case-insensitive', () => {
    expect(getCurrency('cop').code).toBe('COP');
    expect(getCurrency('mXn').code).toBe('MXN');
  });

  it('falls back to the default instead of throwing', () => {
    expect(getCurrency('XXX').code).toBe(DEFAULT_CURRENCY);
    expect(getCurrency('').code).toBe(DEFAULT_CURRENCY);
    expect(getCurrency(null as unknown as string).code).toBe(DEFAULT_CURRENCY);
    expect(getCurrency(undefined as unknown as string).code).toBe(DEFAULT_CURRENCY);
  });
});

describe('isSupportedCurrency', () => {
  it('accepts supported codes and rejects everything else', () => {
    expect(isSupportedCurrency('MXN')).toBe(true);
    expect(isSupportedCurrency('CLP')).toBe(true);
    expect(isSupportedCurrency('BTC')).toBe(false);
    expect(isSupportedCurrency('mxn')).toBe(false); // exact ISO form only
    expect(isSupportedCurrency('')).toBe(false);
  });
});

describe('currencyForCountry', () => {
  it('maps LATAM countries to their local currency', () => {
    expect(currencyForCountry('MX')).toBe('MXN');
    expect(currencyForCountry('CO')).toBe('COP');
    expect(currencyForCountry('CL')).toBe('CLP');
    expect(currencyForCountry('PE')).toBe('PEN');
    expect(currencyForCountry('AR')).toBe('ARS');
  });

  it('maps dollarized countries to USD', () => {
    expect(currencyForCountry('EC')).toBe('USD');
    expect(currencyForCountry('PA')).toBe('USD');
    expect(currencyForCountry('SV')).toBe('USD');
  });

  it('is case-insensitive', () => {
    expect(currencyForCountry('co')).toBe('COP');
  });

  it('falls back to the default for unknown or missing countries', () => {
    expect(currencyForCountry('ZZ')).toBe(DEFAULT_CURRENCY);
    expect(currencyForCountry('')).toBe(DEFAULT_CURRENCY);
    expect(currencyForCountry(null as unknown as string)).toBe(DEFAULT_CURRENCY);
  });
});

describe('formatMoney', () => {
  it('formats MXN with two decimals', () => {
    expect(formatMoney(1234.5, 'MXN')).toBe('$1,234.50');
  });

  it('formats COP with dot grouping and no cents', () => {
    expect(formatMoney(80000, 'COP')).toBe('$ 80.000');
  });

  it('formats CLP with no cents', () => {
    expect(formatMoney(1234.56, 'CLP')).toBe('$1.235');
  });

  it('formats USD unambiguously', () => {
    expect(formatMoney(34, 'USD')).toBe('$34.00');
  });

  it('uses each currency narrow symbol', () => {
    expect(formatMoney(1234.5, 'PEN')).toBe('S/ 1,234.50');
    expect(formatMoney(80000, 'PYG')).toBe('₲ 80.000');
  });

  // Regression: the default currencyDisplay renders MXN as "MX$", which is why
  // SaleDetailModal carried a stack of .replace('MX$','$') calls.
  it('never emits the MX$ symbol', () => {
    for (const code of Object.keys(CURRENCIES)) {
      expect(formatMoney(1234.5, code)).not.toContain('MX$');
    }
  });

  // Node's ICU emits U+00A0 / U+202F between symbol and digits in several es-*
  // locales, and as the group separator in es-CR. Normalizing keeps output
  // stable across Node versions and greppable in assertions.
  it('normalizes non-breaking spaces to plain spaces', () => {
    for (const code of Object.keys(CURRENCIES)) {
      const formatted = formatMoney(1234.5, code);
      expect(formatted).not.toMatch(/[\u00A0\u202F]/);
    }
  });

  it('appends the ISO code when showCode is set', () => {
    expect(formatMoney(1234.5, 'MXN', { showCode: true })).toBe('$1,234.50 MXN');
    expect(formatMoney(80000, 'COP', { showCode: true })).toBe('$ 80.000 COP');
  });

  it('formats negative amounts', () => {
    expect(formatMoney(-1234.5, 'MXN')).toContain('1,234.50');
  });

  it('falls back to the default currency for an unknown code', () => {
    expect(formatMoney(1234.5, 'XXX')).toBe(formatMoney(1234.5, DEFAULT_CURRENCY));
  });
});

describe('minor units', () => {
  it('converts two-decimal currencies through a factor of 100', () => {
    expect(toMinorUnits(599, 'MXN')).toBe(59900);
    expect(toMinorUnits(12.34, 'MXN')).toBe(1234);
    expect(fromMinorUnits(59900, 'MXN')).toBe(599);
  });

  it('leaves zero-decimal currencies unscaled', () => {
    expect(toMinorUnits(80000, 'CLP')).toBe(80000);
    expect(fromMinorUnits(80000, 'CLP')).toBe(80000);
    expect(toMinorUnits(80000, 'PYG')).toBe(80000);
  });

  it('treats COP as two-decimal, matching what Stripe expects', () => {
    expect(toMinorUnits(80000, 'COP')).toBe(8000000);
  });

  it('round-trips without float drift', () => {
    for (const code of Object.keys(CURRENCIES)) {
      for (const amount of [0, 1, 19.99, 599, 1234.56, 80000]) {
        const rounded = roundToCurrency(amount, code);
        expect(fromMinorUnits(toMinorUnits(rounded, code), code)).toBe(rounded);
      }
    }
  });

  it('returns integers from toMinorUnits', () => {
    expect(Number.isInteger(toMinorUnits(19.999, 'MXN'))).toBe(true);
    expect(Number.isInteger(toMinorUnits(1234.56, 'CLP'))).toBe(true);
  });
});

describe('roundToCurrency', () => {
  it('rounds two-decimal currencies to cents', () => {
    expect(roundToCurrency(1234.567, 'MXN')).toBe(1234.57);
    expect(roundToCurrency(155.1724, 'MXN')).toBe(155.17);
  });

  it('rounds zero-decimal currencies to whole units', () => {
    expect(roundToCurrency(1234.56, 'CLP')).toBe(1235);
    expect(roundToCurrency(80000.4, 'PYG')).toBe(80000);
  });

  it('rounds COP to cents, because storage and Stripe both use them', () => {
    expect(roundToCurrency(1234.567, 'COP')).toBe(1234.57);
  });
});

describe('money input helpers', () => {
  it('gives zero-decimal currencies a whole-unit step', () => {
    expect(moneyInputStep('CLP')).toBe('1');
    expect(moneyInputStep('PYG')).toBe('1');
  });

  it('gives two-decimal currencies a cent step', () => {
    expect(moneyInputStep('MXN')).toBe('0.01');
    expect(moneyInputStep('USD')).toBe('0.01');
  });

  // Regression: ServiceModal capped prices at 99999, which rejects a perfectly
  // ordinary 350.000 CLP service.
  it('caps at what Decimal(10,2) can store, not at a peso-shaped guess', () => {
    expect(moneyMaxValue('CLP')).toBeGreaterThan(350_000);
    expect(moneyMaxValue('MXN')).toBe(99_999_999.99);
    expect(moneyMaxValue('CLP')).toBe(99_999_999);
  });
});
