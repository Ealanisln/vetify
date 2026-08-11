import { isBillingCurrency, type BillingCurrency } from '../currency';

/**
 * Canonical subscription price table across billing currencies, in Stripe
 * minor units (CLP is zero-decimal; MXN/COP/USD are two-decimal).
 *
 * MXN amounts mirror the live Stripe catalog (PLAN_PRICES). CLP/COP/USD
 * monthly amounts are the confirmed launch table; annual keeps the same
 * ~8x-monthly discount structure the MXN catalog uses, rounded down to a
 * clean local figure. CORPORATIVO is a contact-sales placeholder priced at
 * the FX implied by the launch table.
 *
 * The Stripe prices carry these as currency_options
 * (scripts/add-currency-options.mjs); this module is the source of truth
 * both for that script and for displaying local prices in the UI.
 */
export type BillingPlanKey = 'BASICO' | 'PROFESIONAL' | 'CORPORATIVO';
export type BillingInterval = 'monthly' | 'annual';

export const BILLING_PRICES: Record<
  BillingPlanKey,
  Record<BillingInterval, Record<BillingCurrency, number>>
> = {
  BASICO: {
    monthly: { MXN: 59900, CLP: 29900, COP: 12990000, USD: 3500 },
    annual: { MXN: 478800, CLP: 239000, COP: 103900000, USD: 27900 },
  },
  PROFESIONAL: {
    monthly: { MXN: 119900, CLP: 59900, COP: 25990000, USD: 6900 },
    annual: { MXN: 958800, CLP: 479000, COP: 207900000, USD: 54900 },
  },
  CORPORATIVO: {
    monthly: { MXN: 500000, CLP: 249900, COP: 108900000, USD: 28900 },
    annual: { MXN: 6000000, CLP: 2998800, COP: 1306800000, USD: 346800 },
  },
};

/**
 * Stripe currency_options payload for a plan/interval. Excludes MXN because
 * it is the price's base currency, not an option.
 */
export function currencyOptionsForPlan(
  plan: BillingPlanKey,
  interval: BillingInterval
): Record<string, { unit_amount: number }> {
  const amounts = BILLING_PRICES[plan][interval];
  const options: Record<string, { unit_amount: number }> = {};

  for (const [currency, unitAmount] of Object.entries(amounts)) {
    if (currency === 'MXN') continue;
    options[currency.toLowerCase()] = { unit_amount: unitAmount };
  }

  return options;
}

/**
 * Currency to pass to Checkout Session creation for a tenant. Undefined for
 * MXN (the base currency applies without the param) and for anything not in
 * BILLING_CURRENCIES, so an unexpected value degrades to MXN instead of
 * failing session creation against a missing currency_option.
 */
export function checkoutCurrency(
  billingCurrency: string | null | undefined
): string | undefined {
  if (!billingCurrency || !isBillingCurrency(billingCurrency)) return undefined;
  const normalized = billingCurrency.toUpperCase();
  return normalized === 'MXN' ? undefined : normalized.toLowerCase();
}
