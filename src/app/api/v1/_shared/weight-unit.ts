import { z } from 'zod';

/**
 * Pet weight units for the public API.
 *
 * The app stores pounds as 'lbs'. v1 originally documented 'lb', so 'lb' is
 * still accepted as an input alias and normalized to 'lbs' before storing.
 */
export function normalizeWeightUnit<T extends string | null | undefined>(unit: T): T | 'lbs' {
  return unit === 'lb' ? 'lbs' : unit;
}

export const weightUnitSchema = z
  .enum(['kg', 'lbs', 'lb'])
  .transform((unit) => normalizeWeightUnit(unit) as 'kg' | 'lbs');
