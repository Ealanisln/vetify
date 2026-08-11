import { formatMoney, fromMinorUnits, isBillingCurrency, type BillingCurrency } from './currency';
import { BILLING_PRICES, type BillingPlanKey } from './payments/billing-prices';

/**
 * Helpers to show /precios in the viewer's billing currency. The pricing
 * page plumbs Stripe amounts in MXN minor units; when the viewer bills in
 * another currency these swap the amounts at the source (so discount and
 * savings math keeps working) and format minor units per currency
 * (CLP is zero-decimal).
 */

export function resolveBillingCurrency(value: string | null | undefined): BillingCurrency {
  if (value && isBillingCurrency(value)) {
    return value.toUpperCase() as BillingCurrency;
  }
  return 'MXN';
}

interface LocalizablePlan {
  id: string;
  prices: {
    monthly: { unitAmount: number };
    yearly: { unitAmount: number };
  };
}

export function localizePlanPrices<T extends LocalizablePlan>(
  plans: T[],
  billingCurrency: BillingCurrency
): T[] {
  if (billingCurrency === 'MXN') return plans;

  return plans.map(plan => {
    const planKey = plan.id.toUpperCase() as BillingPlanKey;
    const table = BILLING_PRICES[planKey];
    if (!table) return plan;

    return {
      ...plan,
      prices: {
        ...plan.prices,
        monthly: { ...plan.prices.monthly, unitAmount: table.monthly[billingCurrency] },
        yearly: { ...plan.prices.yearly, unitAmount: table.annual[billingCurrency] },
      },
    };
  });
}

/** Formats an amount in Stripe minor units for display, e.g. 29900 CLP → "$29.900". */
export function formatBillingAmount(minorUnits: number, billingCurrency: BillingCurrency): string {
  return formatMoney(fromMinorUnits(minorUnits, billingCurrency), billingCurrency);
}
