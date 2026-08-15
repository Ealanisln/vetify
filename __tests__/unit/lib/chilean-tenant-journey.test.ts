/**
 * Cross-module contract for the multi-currency billing launch: follows a
 * Chilean clinic from onboarding to checkout and asserts the modules agree
 * with each other. If any single table or mapping drifts (currency tables,
 * onboarding defaults, checkout currency), this is the test that fails.
 */
import { tenantCurrencyDefaults } from '@/lib/onboarding-defaults';
import { BILLING_PRICES, checkoutCurrency, currencyOptionsForPlan } from '@/lib/payments/billing-prices';
import { formatBillingAmount, localizePlanPrices, resolveBillingCurrency } from '@/lib/pricing-localization';

describe('Chilean tenant journey (CL → CLP end to end)', () => {
  const defaults = tenantCurrencyDefaults('CL');

  it('onboarding with CL sets CLP for both billing and display', () => {
    expect(defaults.billingCurrency).toBe('CLP');
    expect(defaults.currencyCode).toBe('CLP');
    expect(defaults.taxRate).toBe(0.19);
    expect(defaults.currencyConfirmed).toBe(true);
  });

  it('/precios shows the confirmed CLP launch prices', () => {
    const mxnPlans = [
      { id: 'basico', prices: { monthly: { unitAmount: 59900 }, yearly: { unitAmount: 478800 } } },
      { id: 'profesional', prices: { monthly: { unitAmount: 119900 }, yearly: { unitAmount: 958800 } } },
    ];

    const viewerCurrency = resolveBillingCurrency(defaults.billingCurrency);
    const localized = localizePlanPrices(mxnPlans, viewerCurrency);

    expect(formatBillingAmount(localized[0].prices.monthly.unitAmount, viewerCurrency)).toContain('29.900');
    expect(formatBillingAmount(localized[1].prices.monthly.unitAmount, viewerCurrency)).toContain('59.900');
  });

  it('checkout charges in clp against a price that carries that option', () => {
    const sessionCurrency = checkoutCurrency(defaults.billingCurrency);

    expect(sessionCurrency).toBe('clp');

    // The Stripe catalog script derives its options from the same table, so
    // the option the session selects must exist for every self-serve plan
    for (const plan of ['BASICO', 'PROFESIONAL'] as const) {
      const options = currencyOptionsForPlan(plan, 'monthly');
      expect(options).toHaveProperty('clp');
      expect(options.clp.unit_amount).toBe(BILLING_PRICES[plan].monthly.CLP);
    }
  });

  it('what /precios shows is exactly what checkout charges', () => {
    // Display source and charge source are the same table entry
    expect(BILLING_PRICES.PROFESIONAL.monthly.CLP).toBe(59900);
    expect(currencyOptionsForPlan('PROFESIONAL', 'monthly').clp.unit_amount).toBe(59900);
  });
});
