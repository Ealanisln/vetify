/**
 * Canonical currency module.
 *
 * Single source of truth for currency metadata, formatting and minor-unit
 * conversion across BOTH money domains in Vetify:
 *
 *  - SaaS billing (Vetify charges the clinic, settled through Stripe)
 *  - Tenant POS (the clinic charges the pet owner, stored as Decimal(10,2))
 *
 * Do not add a second formatter anywhere. Every `Intl.NumberFormat` with
 * `style: 'currency'` outside this file is a bug waiting to disagree with it.
 */

export type CurrencyCode =
  | 'MXN'
  | 'USD'
  | 'COP'
  | 'CLP'
  | 'PEN'
  | 'ARS'
  | 'BRL'
  | 'GTQ'
  | 'CRC'
  | 'DOP'
  | 'BOB'
  | 'UYU'
  | 'PYG';

export interface CurrencyMeta {
  code: CurrencyCode;
  /** Narrow symbol, for reference. Formatting resolves its own via Intl. */
  symbol: string;
  /** Spanish display name, shown in the settings selector. */
  name: string;
  /** BCP-47 locale that drives grouping and decimal separators. */
  locale: string;
  /**
   * ISO-4217 minor units. This is what Stripe expects in `unit_amount` and
   * what `toMinorUnits` scales by. CLP and PYG are zero-decimal.
   */
  decimals: 0 | 2;
  /**
   * Decimals actually rendered to users. Usually equal to `decimals`, but COP
   * is a two-decimal currency that Colombians never write with cents.
   */
  displayDecimals: 0 | 2;
  /** ISO-3166-1 alpha-2 countries that use this currency as legal tender. */
  countries: string[];
}

export const DEFAULT_CURRENCY: CurrencyCode = 'MXN';

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  MXN: {
    code: 'MXN',
    symbol: '$',
    name: 'Peso mexicano',
    locale: 'es-MX',
    decimals: 2,
    displayDecimals: 2,
    countries: ['MX'],
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar estadounidense',
    locale: 'en-US',
    decimals: 2,
    displayDecimals: 2,
    // Dollarized economies. USD is also the billing currency Vetify presents
    // to every non-Mexican clinic, regardless of the country it operates in.
    countries: ['US', 'EC', 'PA', 'SV'],
  },
  COP: {
    code: 'COP',
    symbol: '$',
    name: 'Peso colombiano',
    locale: 'es-CO',
    decimals: 2,
    displayDecimals: 0,
    countries: ['CO'],
  },
  CLP: {
    code: 'CLP',
    symbol: '$',
    name: 'Peso chileno',
    locale: 'es-CL',
    decimals: 0,
    displayDecimals: 0,
    countries: ['CL'],
  },
  PEN: {
    code: 'PEN',
    symbol: 'S/',
    name: 'Sol peruano',
    locale: 'es-PE',
    decimals: 2,
    displayDecimals: 2,
    countries: ['PE'],
  },
  ARS: {
    code: 'ARS',
    symbol: '$',
    name: 'Peso argentino',
    locale: 'es-AR',
    decimals: 2,
    displayDecimals: 2,
    countries: ['AR'],
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Real brasileño',
    locale: 'pt-BR',
    decimals: 2,
    displayDecimals: 2,
    countries: ['BR'],
  },
  GTQ: {
    code: 'GTQ',
    symbol: 'Q',
    name: 'Quetzal guatemalteco',
    locale: 'es-GT',
    decimals: 2,
    displayDecimals: 2,
    countries: ['GT'],
  },
  CRC: {
    code: 'CRC',
    symbol: '₡',
    name: 'Colón costarricense',
    locale: 'es-CR',
    decimals: 2,
    displayDecimals: 2,
    countries: ['CR'],
  },
  DOP: {
    code: 'DOP',
    symbol: 'RD$',
    name: 'Peso dominicano',
    locale: 'es-DO',
    decimals: 2,
    displayDecimals: 2,
    countries: ['DO'],
  },
  BOB: {
    code: 'BOB',
    symbol: 'Bs',
    name: 'Boliviano',
    locale: 'es-BO',
    decimals: 2,
    displayDecimals: 2,
    countries: ['BO'],
  },
  UYU: {
    code: 'UYU',
    symbol: '$',
    name: 'Peso uruguayo',
    locale: 'es-UY',
    decimals: 2,
    displayDecimals: 2,
    countries: ['UY'],
  },
  PYG: {
    code: 'PYG',
    symbol: '₲',
    name: 'Guaraní paraguayo',
    locale: 'es-PY',
    decimals: 0,
    displayDecimals: 0,
    countries: ['PY'],
  },
};

const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = Object.values(CURRENCIES).reduce(
  (acc, meta) => {
    for (const country of meta.countries) {
      acc[country] = meta.code;
    }
    return acc;
  },
  {} as Record<string, CurrencyCode>
);

/** Narrows an arbitrary string to a supported ISO-4217 code (exact uppercase form). */
export function isSupportedCurrency(code: string): code is CurrencyCode {
  return typeof code === 'string' && Object.prototype.hasOwnProperty.call(CURRENCIES, code);
}

/**
 * Resolves currency metadata. Never throws — an unknown or missing code falls
 * back to {@link DEFAULT_CURRENCY} so a bad DB value degrades to today's
 * behavior instead of crashing a render.
 */
export function getCurrency(code: string): CurrencyMeta {
  const normalized = typeof code === 'string' ? code.toUpperCase() : '';
  return isSupportedCurrency(normalized) ? CURRENCIES[normalized] : CURRENCIES[DEFAULT_CURRENCY];
}

/** Maps an ISO-3166-1 alpha-2 country to its local currency. */
export function currencyForCountry(country: string): CurrencyCode {
  const normalized = typeof country === 'string' ? country.toUpperCase() : '';
  return COUNTRY_TO_CURRENCY[normalized] ?? DEFAULT_CURRENCY;
}

/**
 * Node's ICU separates the symbol from the digits with U+00A0, and uses it as
 * the group separator in es-CR. Collapsing those to a plain space keeps output
 * stable across Node/ICU versions and searchable in tests and snapshots.
 */
function normalizeSpaces(value: string): string {
  return value.replace(/[\u00A0\u202F]/g, ' ');
}

export interface FormatMoneyOptions {
  /** Append the ISO code, e.g. `$80.000 COP`. Use on tickets and exports. */
  showCode?: boolean;
}

/**
 * Formats an amount in major units for display.
 *
 * Uses `currencyDisplay: 'narrowSymbol'` deliberately: the default renders MXN
 * as `MX$`, which is the reason the sales UI accumulated `.replace('MX$','$')`
 * calls. Symbols are ambiguous across LATAM ($ means five different pesos), so
 * pass `showCode` anywhere the output leaves the screen.
 */
export function formatMoney(
  amount: number,
  code: string,
  options: FormatMoneyOptions = {}
): string {
  const meta = getCurrency(code);

  const formatted = normalizeSpaces(
    new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: meta.code,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: meta.displayDecimals,
      maximumFractionDigits: meta.displayDecimals,
    }).format(amount)
  );

  return options.showCode ? `${formatted} ${meta.code}` : formatted;
}

/** Scale factor between major units and ISO-4217 minor units. */
function minorUnitFactor(code: string): number {
  return getCurrency(code).decimals === 0 ? 1 : 100;
}

/**
 * Converts major units to the integer minor units Stripe and payment APIs
 * expect. Always returns an integer — 1234.56 CLP becomes 1235, not 1234.56.
 */
export function toMinorUnits(amount: number, code: string): number {
  return Math.round(amount * minorUnitFactor(code));
}

/** Converts integer minor units back to major units. */
export function fromMinorUnits(minor: number, code: string): number {
  return minor / minorUnitFactor(code);
}

/**
 * Rounds to the precision the currency can actually represent.
 *
 * Replaces the hardcoded two-decimal rounding in tax math, which produced
 * fractional cents on zero-decimal currencies (a CLP ticket printing
 * `subtotalWithoutTax: 67226.89`).
 */
export function roundToCurrency(amount: number, code: string): number {
  const factor = minorUnitFactor(code);
  return Math.round(amount * factor) / factor;
}

/** `step` attribute for a money `<input type="number">`. */
export function moneyInputStep(code: string): '1' | '0.01' {
  return getCurrency(code).decimals === 0 ? '1' : '0.01';
}

/**
 * Largest amount that fits the `Decimal(10, 2)` money columns.
 *
 * This is a storage limit, not a business rule — callers that need a semantic
 * cap should impose their own. It exists so validators stop rejecting ordinary
 * local prices: a 350.000 CLP service is unremarkable and used to fail a
 * hardcoded `max(99999)`.
 */
export function moneyMaxValue(code: string): number {
  return getCurrency(code).decimals === 0 ? 99_999_999 : 99_999_999.99;
}
