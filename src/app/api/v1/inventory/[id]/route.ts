/**
 * API v1 Inventory Item Detail Endpoint
 *
 * GET /api/v1/inventory/:id - Get a specific inventory item
 * PUT /api/v1/inventory/:id - Update an inventory item
 * DELETE /api/v1/inventory/:id - Delete an inventory item (soft delete via status)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withApiAuth, apiError } from '@/lib/api/api-key-auth';
import { serializeInventoryItem } from '../../_shared/serializers';

// Valid inventory categories
const INVENTORY_CATEGORIES = [
  'MEDICINE',
  'VACCINE',
  'DEWORMER',
  'FLEA_TICK_PREVENTION',
  'FOOD_PRESCRIPTION',
  'FOOD_REGULAR',
  'SUPPLEMENT',
  'ACCESSORY',
  'CONSUMABLE_CLINIC',
  'SURGICAL_MATERIAL',
  'LAB_SUPPLIES',
  'HYGIENE_GROOMING',
  'OTHER',
] as const;

// Valid inventory statuses
const INVENTORY_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'LOW_STOCK',
  'OUT_OF_STOCK',
  'EXPIRED',
  'DISCONTINUED',
] as const;

// Validation schema for updating an inventory item
const updateInventoryItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.enum(INVENTORY_CATEGORIES).optional(),
  description: z.string().max(1000).optional().nullable(),
  activeCompound: z.string().max(255).optional().nullable(),
  presentation: z.string().max(100).optional().nullable(),
  measure: z.string().max(50).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  quantity: z.number().min(0).optional(),
  minStock: z.number().min(0).optional().nullable(),
  expirationDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .optional()
    .nullable(),
  status: z.enum(INVENTORY_STATUSES).optional(),
  batchNumber: z.string().max(100).optional().nullable(),
  specialNotes: z.string().max(500).optional().nullable(),
  storageLocation: z.string().max(100).optional().nullable(),
  cost: z.number().min(0).optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
});

export const GET = withApiAuth(
  async (request, { apiKey, locationId, params }) => {
    const id = params?.id;

    if (!id) {
      return apiError('Inventory item ID is required', 'BAD_REQUEST', 400);
    }

    // Build where clause
    const where: Record<string, unknown> = {
      id,
      tenantId: apiKey.tenantId,
    };

    if (locationId) {
      where.locationId = locationId;
    }

    const item = await prisma.inventoryItem.findFirst({
      where,
    });

    if (!item) {
      return apiError('Inventory item not found', 'NOT_FOUND', 404);
    }

    return NextResponse.json({ data: serializeInventoryItem(item) });
  },
  { requiredScope: 'read:inventory' }
);

export const PUT = withApiAuth(
  async (request, { apiKey, locationId, params }) => {
    const id = params?.id;

    if (!id) {
      return apiError('Inventory item ID is required', 'BAD_REQUEST', 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid JSON body', 'BAD_REQUEST', 400);
    }

    // Validate input
    const result = updateInventoryItemSchema.safeParse(body);
    if (!result.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const data = result.data;

    // Build where clause
    const where: Record<string, unknown> = {
      id,
      tenantId: apiKey.tenantId,
    };

    if (locationId) {
      where.locationId = locationId;
    }

    // Check if item exists
    const existing = await prisma.inventoryItem.findFirst({ where });
    if (!existing) {
      return apiError('Inventory item not found', 'NOT_FOUND', 404);
    }

    // Validate new locationId if provided
    if (data.locationId && data.locationId !== existing.locationId) {
      const location = await prisma.location.findFirst({
        where: {
          id: data.locationId,
          tenantId: apiKey.tenantId,
          isActive: true,
        },
      });

      if (!location) {
        return apiError('Location not found or inactive', 'NOT_FOUND', 404);
      }
    }

    // Update the item
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.activeCompound !== undefined && { activeCompound: data.activeCompound }),
        ...(data.presentation !== undefined && { presentation: data.presentation }),
        ...(data.measure !== undefined && { measure: data.measure }),
        ...(data.brand !== undefined && { brand: data.brand }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.minStock !== undefined && { minStock: data.minStock }),
        ...(data.expirationDate !== undefined && {
          expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.batchNumber !== undefined && { batchNumber: data.batchNumber }),
        ...(data.specialNotes !== undefined && { specialNotes: data.specialNotes }),
        ...(data.storageLocation !== undefined && { storageLocation: data.storageLocation }),
        ...(data.cost !== undefined && { cost: data.cost }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.locationId !== undefined && { locationId: data.locationId }),
      },
    });

    return NextResponse.json({ data: serializeInventoryItem(item) });
  },
  { requiredScope: 'write:inventory' }
);

export const DELETE = withApiAuth(
  async (request, { apiKey, locationId, params }) => {
    const id = params?.id;

    if (!id) {
      return apiError('Inventory item ID is required', 'BAD_REQUEST', 400);
    }

    // Build where clause
    const where: Record<string, unknown> = {
      id,
      tenantId: apiKey.tenantId,
    };

    if (locationId) {
      where.locationId = locationId;
    }

    // Check if item exists
    const existing = await prisma.inventoryItem.findFirst({ where });
    if (!existing) {
      return apiError('Inventory item not found', 'NOT_FOUND', 404);
    }

    // Soft delete by setting status to DISCONTINUED
    await prisma.inventoryItem.update({
      where: { id },
      data: { status: 'DISCONTINUED' },
    });

    return new NextResponse(null, { status: 204 });
  },
  { requiredScope: 'write:inventory' }
);
