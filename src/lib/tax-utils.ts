/**
 * Utilidades para cálculo de IVA en sistema de precios con impuesto incluido
 * Cumple con la ley mexicana donde los precios deben mostrarse con IVA incluido
 */

import { DEFAULT_CURRENCY, roundToCurrency } from './currency';

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
 * El redondeo respeta la precisión de la moneda: CLP y PYG no tienen decimales,
 * así que un ticket chileno no debe imprimir centavos que no existen.
 *
 * El IVA se DERIVA del subtotal ya redondeado en vez de redondearse por
 * separado. Redondear ambos de forma independiente puede dejarlos desfasados
 * por una unidad, y en un ticket impreso eso significa que las líneas no suman
 * el total que el cliente pagó.
 *
 * @param priceWithTax - Precio total (ya incluye IVA)
 * @param taxRate - Tasa de IVA (ej: 0.16 para México, 0.19 para Colombia)
 * @param currencyCode - Moneda del tenant (ISO-4217). Default MXN
 * @returns Desglose con subtotal, IVA y total
 *
 * @example
 * calculateTaxBreakdown(180, 0.16)
 * // { subtotalWithoutTax: 155.17, taxAmount: 24.83, total: 180, taxRate: 0.16 }
 *
 * @example
 * calculateTaxBreakdown(80000, 0.19, 'CLP')
 * // { subtotalWithoutTax: 67227, taxAmount: 12773, total: 80000, taxRate: 0.19 }
 */
export function calculateTaxBreakdown(
  priceWithTax: number,
  taxRate: number = 0.16,
  currencyCode: string = DEFAULT_CURRENCY
): TaxBreakdown {
  const total = roundToCurrency(priceWithTax, currencyCode);
  // Precio / (1 + tasa) = Subtotal sin IVA
  const subtotalWithoutTax = roundToCurrency(priceWithTax / (1 + taxRate), currencyCode);
  const taxAmount = roundToCurrency(total - subtotalWithoutTax, currencyCode);

  return {
    subtotalWithoutTax,
    taxAmount,
    total,
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
