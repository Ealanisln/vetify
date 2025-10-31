/**
 * Formatting utilities for the application
 */

import { Decimal } from '@prisma/client/runtime/library';

/**
 * Format weight value with unit
 * Handles both Prisma Decimal and number types
 *
 * @param weight - The weight value (can be Decimal or number or null)
 * @param weightUnit - The unit of measurement (defaults to 'kg')
 * @param fallback - The fallback string to return if weight is invalid (defaults to 'No registrado')
 * @returns Formatted weight string like "5.3 kg" or the fallback value
 *
 * @example
 * ```typescript
 * formatWeight(5.3, 'kg') // "5.3 kg"
 * formatWeight(null) // "No registrado"
 * formatWeight(null, 'lbs', 'N/A') // "N/A"
 * ```
 */
export function formatWeight(
  weight: Decimal | number | null | undefined,
  weightUnit: string | null | undefined = 'kg',
  fallback: string = 'No registrado'
): string {
  // Check if weight exists and is a valid number
  if (weight == null || isNaN(Number(weight))) {
    return fallback;
  }

  // Convert to number and format to 1 decimal place
  const weightValue = Number(weight).toFixed(1);
  const unit = weightUnit || 'kg';

  return `${weightValue} ${unit}`;
}

/**
 * Parse weight value to number
 * Handles both Prisma Decimal and number types
 *
 * @param weight - The weight value (can be Decimal or number or null)
 * @returns The weight as a number or null if invalid
 *
 * @example
 * ```typescript
 * parseWeight(5.3) // 5.3
 * parseWeight(null) // null
 * parseWeight(new Decimal(5.3)) // 5.3
 * ```
 */
export function parseWeight(
  weight: Decimal | number | null | undefined
): number | null {
  if (weight == null || isNaN(Number(weight))) {
    return null;
  }
  return Number(weight);
}
