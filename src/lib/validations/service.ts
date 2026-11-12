import { z } from 'zod';
import { formatMoney, moneyMaxValue } from '../currency';
import { SERVICE_CATEGORIES } from '../service-categories';

/**
 * Service catalog validation, shared by the settings modal (client) and the
 * /api/services routes (server) so both enforce the same, currency-aware rules.
 */

export const SERVICE_DURATION_MAX_MINUTES = 480;

/** Price in major units, capped by what the Decimal(10,2) column can store. */
export function servicePriceSchema(currencyCode: string) {
  const max = moneyMaxValue(currencyCode);
  return z
    .number({ required_error: 'Ingresa el precio', invalid_type_error: 'Ingresa el precio' })
    .min(0, 'El precio no puede ser negativo')
    .max(max, `El precio no puede ser mayor a ${formatMoney(max, currencyCode)}`);
}

/** Optional duration in minutes. `null` clears a previously saved value. */
export const serviceDurationSchema = z
  .number({ invalid_type_error: 'La duración debe ser un número' })
  .int('La duración debe ser un número entero de minutos')
  .min(1, 'La duración mínima es 1 minuto')
  .max(SERVICE_DURATION_MAX_MINUTES, 'La duración máxima es 8 horas')
  .nullable()
  .optional();

/** Fields the settings form edits. */
export function buildServiceFormSchema(currencyCode: string) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    description: z.string().optional(),
    category: z.enum(SERVICE_CATEGORIES, { required_error: 'Selecciona una categoría' }),
    price: servicePriceSchema(currencyCode),
    duration: serviceDurationSchema,
    isActive: z.boolean(),
    locationId: z.string().nullable().optional(), // null = global (all locations)
    isFeatured: z.boolean().optional(),
    publicIcon: z.string().max(50).nullable().optional(),
    publicPriceLabel: z.string().max(100).nullable().optional(),
  });
}

/** Request body accepted by POST /api/services and PUT /api/services/[id]. */
export function buildServiceApiSchema(currencyCode: string) {
  return buildServiceFormSchema(currencyCode).extend({
    tenantId: z.string(),
    publicDisplayOrder: z.number().int().min(1).max(10).nullable().optional(),
  });
}

export type ServiceFormData = z.infer<ReturnType<typeof buildServiceFormSchema>>;

/**
 * Turns a number input's raw value into what the schema expects: an empty or
 * unparsable field becomes `emptyAs` instead of `NaN`, which zod would report
 * as an English "Expected number, received nan".
 */
export function parseNumberInput<T extends undefined | null>(emptyAs: T) {
  return (value: unknown): number | T => {
    if (value === '' || value === null || value === undefined) return emptyAs;
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : emptyAs;
  };
}
