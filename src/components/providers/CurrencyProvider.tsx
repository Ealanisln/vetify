'use client';

import { createContext, useContext, type ReactNode } from 'react';
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  formatMoney,
  getCurrency,
  type CurrencyCode,
  type CurrencyMeta,
  type FormatMoneyOptions,
} from '@/lib/currency';

/**
 * The default value IS the fallback. There is no undefined sentinel and no
 * throw, deliberately unlike LocationProvider.
 *
 * Around forty component tests render money components bare and assert
 * Mexican-peso strings. Making this hook throw outside a provider turns any
 * money-formatting change into a forty-file test-wrapper refactor, and the
 * failures give no hint why. A tenant that somehow renders without the
 * provider gets today's behavior instead of a crashed page.
 */
const CurrencyContext = createContext<CurrencyMeta>(CURRENCIES[DEFAULT_CURRENCY]);

/**
 * Supplies the tenant's currency to the dashboard tree.
 *
 * Mounted in DashboardLayoutClient beside LocationProvider, which puts every
 * money surface — POS, caja, inventory, reports, the printed ticket — inside it.
 * `currencyCode` comes from TenantSettings.currencyCode on the server, so the
 * first paint is already correct; there is no fetch and no flash of the wrong
 * currency.
 */
export function CurrencyProvider({
  currencyCode,
  children,
}: {
  currencyCode: string;
  children: ReactNode;
}) {
  return (
    <CurrencyContext.Provider value={getCurrency(currencyCode)}>
      {children}
    </CurrencyContext.Provider>
  );
}

/** Full metadata for the tenant's currency: decimals, locale, symbol, name. */
export function useCurrency(): CurrencyMeta {
  return useContext(CurrencyContext);
}

/** Just the ISO code, for callers that only pass it along to a server action. */
export function useCurrencyCode(): CurrencyCode {
  return useContext(CurrencyContext).code;
}

/**
 * What money columns actually look like by the time they reach a component:
 * Prisma `Decimal` serializes to a string across the server/client boundary,
 * and plenty of price fields are nullable.
 */
export type MoneyInput = number | string | null | undefined;

/**
 * Returns a formatter bound to the tenant's currency.
 *
 * Each adopting component drops six lines of local `Intl.NumberFormat` for one
 * line of `const fmt = useFormatMoney()`. That ratio is what makes replacing
 * the ~19 duplicated formatters reviewable.
 */
export function useFormatMoney(): (amount: MoneyInput, options?: FormatMoneyOptions) => string {
  const { code } = useContext(CurrencyContext);

  return (amount, options) => {
    if (amount === null || amount === undefined) return '—';
    const numeric = typeof amount === 'string' ? Number(amount) : amount;
    if (!Number.isFinite(numeric)) return '—';
    return formatMoney(numeric, code, options);
  };
}
