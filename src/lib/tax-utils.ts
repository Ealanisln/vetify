/**
 * Utilidades para cálculo de IVA en sistema de precios con impuesto incluido
 * Cumple con la ley mexicana donde los precios deben mostrarse con IVA incluido
 */

export interface TaxBreakdown {
  /** Subtotal sin IVA (base gravable) */
  subtotalWithoutTax: number;
  /** Monto del IVA incluido */
  taxAmount: number;
  /** Total (igual al precio con IVA incluido) */
  total: number;
  /** Tasa de IVA usada (ej: 0.16) */
  taxRate: number;
}

/**
 * Calcula el desglose de IVA para un precio que YA incluye IVA
 *
 * @param priceWithTax - Precio total (ya incluye IVA)
 * @param taxRate - Tasa de IVA (ej: 0.16 para 16%, 0.08 para zonas fronterizas)
 * @returns Desglose con subtotal, IVA y total
 *
 * @example
 * // Precio: $180 con IVA 16% incluido
 * calculateTaxBreakdown(180, 0.16)
 * // Returns: { subtotalWithoutTax: 155.17, taxAmount: 24.83, total: 180, taxRate: 0.16 }
 */
export function calculateTaxBreakdown(priceWithTax: number, taxRate: number = 0.16): TaxBreakdown {
  // Precio / (1 + tasa) = Subtotal sin IVA
  const subtotalWithoutTax = priceWithTax / (1 + taxRate);
  const taxAmount = priceWithTax - subtotalWithoutTax;

  return {
    subtotalWithoutTax: roundToTwoDecimals(subtotalWithoutTax),
    taxAmount: roundToTwoDecimals(taxAmount),
    total: roundToTwoDecimals(priceWithTax),
    taxRate
  };
}

/**
 * Formatea el porcentaje de IVA para mostrar en UI
 * @example formatTaxRateLabel(0.16) // "16%"
 * @example formatTaxRateLabel(0.08) // "8%"
 */
export function formatTaxRateLabel(taxRate: number): string {
  return `${Math.round(taxRate * 100)}%`;
}

/**
 * Redondea a 2 decimales (standard para moneda)
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Tasas de IVA válidas en México
 */
export const MEXICO_TAX_RATES = {
  /** Tasa general - 16% */
  STANDARD: 0.16,
  /** Zonas fronterizas - 8% */
  BORDER: 0.08,
  /** Exento (algunos productos) */
  EXEMPT: 0
} as const;
