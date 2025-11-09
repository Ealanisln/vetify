import { z } from 'zod';

// ============================================================================
// Location Validation Schemas (Client & Server Safe)
// ============================================================================

export const createLocationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  timezone: z.string().default('America/Mexico_City'),
  isActive: z.boolean().default(true),
  isPrimary: z.boolean().default(false),
});

export const updateLocationSchema = createLocationSchema.partial();

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

// ============================================================================
// Client-Safe Utility Functions
// ============================================================================

/**
 * Generate a URL-safe slug from a location name
 * Handles Spanish characters and converts to lowercase with hyphens
 *
 * @param name - The location name to convert to a slug
 * @returns URL-safe slug string
 *
 * @example
 * generateSlug('Clínica Veterinaria Centro') // 'clinica-veterinaria-centro'
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// ============================================================================
// Transfer Validation Schema (Client & Server Safe)
// ============================================================================

export const createTransferSchema = z.object({
  inventoryItemId: z.string().uuid('ID de inventario inválido'),
  fromLocationId: z.string().uuid('ID de ubicación origen inválido'),
  toLocationId: z.string().uuid('ID de ubicación destino inválido'),
  quantity: z.number().positive('La cantidad debe ser positiva'),
  notes: z.string().optional(),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
