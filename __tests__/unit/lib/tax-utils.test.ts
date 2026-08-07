import {
  calculateTaxBreakdown,
  formatTaxRateLabel,
  MEXICO_TAX_RATES,
} from '@/lib/tax-utils';

describe('tax-utils', () => {
  describe('calculateTaxBreakdown', () => {
    it('should calculate standard 16% IVA breakdown from tax-inclusive price', () => {
      const result = calculateTaxBreakdown(180, 0.16);

      expect(result.subtotalWithoutTax).toBe(155.17);
      expect(result.taxAmount).toBe(24.83);
      expect(result.total).toBe(180);
      expect(result.taxRate).toBe(0.16);
    });

    it('should use 16% as default tax rate', () => {
      const result = calculateTaxBreakdown(180);

      expect(result.taxRate).toBe(0.16);
      expect(result.subtotalWithoutTax).toBe(155.17);
    });

    it('should calculate border zone 8% IVA breakdown', () => {
      const result = calculateTaxBreakdown(180, 0.08);

      expect(result.subtotalWithoutTax).toBe(166.67);
      expect(result.taxAmount).toBe(13.33);
      expect(result.total).toBe(180);
      expect(result.taxRate).toBe(0.08);
    });

    it('should handle exempt (0%) tax rate', () => {
      const result = calculateTaxBreakdown(180, 0);

      expect(result.subtotalWithoutTax).toBe(180);
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(180);
      expect(result.taxRate).toBe(0);
    });

    it('should round to two decimal places', () => {
      // $100 with 16% IVA: subtotal = 86.206896... should round to 86.21
      const result = calculateTaxBreakdown(100, 0.16);

      expect(result.subtotalWithoutTax).toBe(86.21);
      expect(result.taxAmount).toBe(13.79);
      expect(result.total).toBe(100);
    });

    it('should ensure subtotal + taxAmount = total', () => {
      const prices = [50, 100, 180, 250.50, 999.99, 1199, 5000];
      const rates = [0.16, 0.08, 0];

      for (const price of prices) {
        for (const rate of rates) {
          const result = calculateTaxBreakdown(price, rate);
          // Allow for rounding differences of up to 0.01
          expect(
            Math.abs(result.subtotalWithoutTax + result.taxAmount - result.total)
          ).toBeLessThanOrEqual(0.01);
        }
      }
    });

    it('should handle zero price', () => {
      const result = calculateTaxBreakdown(0, 0.16);

      expect(result.subtotalWithoutTax).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should handle small amounts', () => {
      const result = calculateTaxBreakdown(1, 0.16);

      expect(result.subtotalWithoutTax).toBe(0.86);
      expect(result.taxAmount).toBe(0.14);
      expect(result.total).toBe(1);
    });

    it('should handle large amounts', () => {
      const result = calculateTaxBreakdown(100000, 0.16);

      expect(result.subtotalWithoutTax).toBe(86206.90);
      expect(result.taxAmount).toBe(13793.10);
      expect(result.total).toBe(100000);
    });

    it('should return correct TaxBreakdown interface shape', () => {
      const result = calculateTaxBreakdown(100);

      expect(result).toHaveProperty('subtotalWithoutTax');
      expect(result).toHaveProperty('taxAmount');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('taxRate');
      expect(typeof result.subtotalWithoutTax).toBe('number');
      expect(typeof result.taxAmount).toBe('number');
      expect(typeof result.total).toBe('number');
      expect(typeof result.taxRate).toBe('number');
    });
  });

  describe('formatTaxRateLabel', () => {
    it('should format 16% rate', () => {
      expect(formatTaxRateLabel(0.16)).toBe('16%');
    });

    it('should format 8% rate', () => {
      expect(formatTaxRateLabel(0.08)).toBe('8%');
    });

    it('should format 0% rate', () => {
      expect(formatTaxRateLabel(0)).toBe('0%');
    });

    it('should round to whole numbers', () => {
      expect(formatTaxRateLabel(0.165)).toBe('17%');
    });
  });

  describe('calculateTaxBreakdown across currencies', () => {
    it('rounds a zero-decimal currency to whole units', () => {
      // A Chilean clinic's ticket must not print centavos that do not exist.
      const result = calculateTaxBreakdown(80000, 0.19, 'CLP');

      expect(Number.isInteger(result.subtotalWithoutTax)).toBe(true);
      expect(Number.isInteger(result.taxAmount)).toBe(true);
      expect(Number.isInteger(result.total)).toBe(true);
    });

    it('keeps cents for a two-decimal currency', () => {
      const result = calculateTaxBreakdown(80000, 0.19, 'COP');

      expect(result.subtotalWithoutTax).toBe(67226.89);
      expect(result.taxAmount).toBe(12773.11);
    });

    /**
     * The load-bearing property. Rounding subtotal and tax independently can
     * drift a unit apart, which on a printed ticket means the lines visibly do
     * not add up to the total the customer paid.
     */
    it('always has subtotal + tax equal the total exactly', () => {
      const currencies = ['MXN', 'CLP', 'COP', 'PYG', 'USD'];
      const rates = [0, 0.08, 0.16, 0.19, 0.21];
      const totals = [1, 7, 99.99, 180, 1234.56, 80000, 350000];

      for (const currency of currencies) {
        for (const rate of rates) {
          for (const total of totals) {
            const r = calculateTaxBreakdown(total, rate, currency);
            expect(r.subtotalWithoutTax + r.taxAmount).toBeCloseTo(r.total, 6);
          }
        }
      }
    });

    it('defaults to MXN so existing two-argument callers are unaffected', () => {
      expect(calculateTaxBreakdown(180, 0.16)).toEqual(
        calculateTaxBreakdown(180, 0.16, 'MXN')
      );
    });

    it('falls back to the default currency for an unknown code', () => {
      expect(calculateTaxBreakdown(180, 0.16, 'XXX')).toEqual(
        calculateTaxBreakdown(180, 0.16, 'MXN')
      );
    });
  });

  describe('MEXICO_TAX_RATES', () => {
    it('should have standard rate of 16%', () => {
      expect(MEXICO_TAX_RATES.STANDARD).toBe(0.16);
    });

    it('should have border rate of 8%', () => {
      expect(MEXICO_TAX_RATES.BORDER).toBe(0.08);
    });

    it('should have exempt rate of 0', () => {
      expect(MEXICO_TAX_RATES.EXEMPT).toBe(0);
    });
  });
});
