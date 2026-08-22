/**
 * @jest-environment jsdom
 */
import { type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import {
  CurrencyProvider,
  useCurrency,
  useCurrencyCode,
  useFormatMoney,
} from '@/components/providers/CurrencyProvider';

const wrapper = (currencyCode: string) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <CurrencyProvider currencyCode={currencyCode}>{children}</CurrencyProvider>;
  };

describe('useCurrency outside a provider', () => {
  /**
   * Load-bearing, deliberately unlike useLocation, which throws.
   *
   * Around forty component tests render money components bare and assert
   * Mexican-peso strings (ShiftCard, CustomerAnalytics, the caja reports...).
   * If this hook ever starts throwing outside a provider, all of them go red at
   * once and the cause will not be obvious from the failure output.
   */
  it('does not throw', () => {
    expect(() => renderHook(() => useCurrency())).not.toThrow();
  });

  it('falls back to the default currency', () => {
    const { result } = renderHook(() => useCurrency());
    expect(result.current.code).toBe('MXN');
  });

  it('still formats money, in the default currency', () => {
    const { result } = renderHook(() => useFormatMoney());
    expect(result.current(1234.5)).toBe('$1,234.50');
  });
});

describe('useCurrency inside a provider', () => {
  it('resolves the tenant currency', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper: wrapper('COP') });
    expect(result.current.code).toBe('COP');
    expect(result.current.displayDecimals).toBe(0);
  });

  it('exposes the raw code for callers that only need to pass it along', () => {
    const { result } = renderHook(() => useCurrencyCode(), { wrapper: wrapper('CLP') });
    expect(result.current).toBe('CLP');
  });

  it('falls back to the default when the stored code is unusable', () => {
    for (const bad of ['', 'XXX', 'not-a-currency']) {
      const { result } = renderHook(() => useCurrency(), { wrapper: wrapper(bad) });
      expect(result.current.code).toBe('MXN');
    }
  });
});

describe('useFormatMoney', () => {
  it('formats in the tenant currency', () => {
    const { result } = renderHook(() => useFormatMoney(), { wrapper: wrapper('COP') });
    expect(result.current(80000)).toBe('$ 80.000');
  });

  it('formats a zero-decimal currency without cents', () => {
    const { result } = renderHook(() => useFormatMoney(), { wrapper: wrapper('CLP') });
    expect(result.current(1234.56)).toBe('$1.235');
  });

  it('passes options through, so tickets can show the ISO code', () => {
    const { result } = renderHook(() => useFormatMoney(), { wrapper: wrapper('COP') });
    expect(result.current(80000, { showCode: true })).toBe('$ 80.000 COP');
  });

  it('accepts Prisma Decimal-ish values arriving as strings', () => {
    const { result } = renderHook(() => useFormatMoney(), { wrapper: wrapper('MXN') });
    expect(result.current('1234.5')).toBe('$1,234.50');
  });

  it('renders a dash for null and undefined instead of NaN', () => {
    const { result } = renderHook(() => useFormatMoney(), { wrapper: wrapper('MXN') });
    expect(result.current(null)).toBe('—');
    expect(result.current(undefined)).toBe('—');
  });
});
