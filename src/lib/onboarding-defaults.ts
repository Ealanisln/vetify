import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  billingCurrencyForCountry,
  currencyForCountry,
  getCurrency,
  isSupportedCurrency,
  type BillingCurrency,
  type CurrencyCode,
} from './currency';

/**
 * Countries offered in the onboarding selector: every country with a
 * supported display currency, plus 'ZZ' (Otro país) which bills and
 * displays USD. Pre-selected from the x-vercel-ip-country header; the user
 * can always correct it (VPNs, proxies).
 */
export const ONBOARDING_COUNTRIES: ReadonlyArray<{ code: string; name: string }> = [
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'PA', name: 'Panamá' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Perú' },
  { code: 'DO', name: 'República Dominicana' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'ZZ', name: 'Otro país' },
];

// VAT defaults for countries where we are confident; everything else keeps
// the historic 16% default, editable in Configuración → Moneda y Región.
const TAX_RATE_BY_COUNTRY: Record<string, number> = {
  MX: 0.16,
  CL: 0.19,
  CO: 0.19,
};

const DEFAULT_TAX_RATE = 0.16;

export interface TenantCurrencyDefaults {
  countryCode: string | null;
  billingCurrency: BillingCurrency;
  currencyCode: CurrencyCode;
  currencySymbol: string;
  taxRate: number;
  currencyConfirmed: boolean;
}

/**
 * Currency-related tenant defaults derived from the onboarding country.
 *
 * No country (legacy clients) keeps today's MXN defaults with
 * currencyConfirmed=false so the settings UI keeps nudging. An explicit
 * country counts as a deliberate choice: local display currency when
 * supported (USD otherwise), billing currency per the launch table, and
 * currencyConfirmed=true.
 */
export function tenantCurrencyDefaults(countryCode: string | null | undefined): TenantCurrencyDefaults {
  if (!countryCode) {
    return {
      countryCode: null,
      billingCurrency: 'MXN',
      currencyCode: DEFAULT_CURRENCY,
      currencySymbol: CURRENCIES[DEFAULT_CURRENCY].symbol,
      taxRate: DEFAULT_TAX_RATE,
      currencyConfirmed: false,
    };
  }

  const normalized = countryCode.toUpperCase();

  // currencyForCountry falls back to MXN for unmapped countries; for an
  // explicit unknown country USD is the honest default for both surfaces.
  const mapped = currencyForCountry(normalized);
  const hasLocalCurrency = mapped !== DEFAULT_CURRENCY || normalized === 'MX';
  const displayCurrency: CurrencyCode =
    hasLocalCurrency && isSupportedCurrency(mapped) ? mapped : 'USD';

  return {
    countryCode: normalized,
    billingCurrency: billingCurrencyForCountry(normalized),
    currencyCode: displayCurrency,
    currencySymbol: getCurrency(displayCurrency).symbol,
    taxRate: TAX_RATE_BY_COUNTRY[normalized] ?? DEFAULT_TAX_RATE,
    currencyConfirmed: true,
  };
}
