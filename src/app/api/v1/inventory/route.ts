/**
 * API v1 Inventory List/Create Endpoint
 *
 * GET /api/v1/inventory - List inventory items
 * POST /api/v1/inventory - Create a new inventory item
 *
 * Query Parameters (GET):
 * - locationId: Filter by location (string)
 * - category: Filter by category (string)
 * - status: Filter by status (string)
 * - search: Search by name or description (string)
 * - lowStock: Filter items with quantity <= minStock (boolean)
 * - limit: Number of results (default: 50, max: 100)
 * - offset: Number to skip (default: 0)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  withApiAuth,
  parsePaginationParams,
  paginatedResponse,
  buildWhereClause,
  apiError,
} from '@/lib/api/api-key-auth';
import { serializeInventoryItem } from '../_shared/serializers';

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

// Validation schema for creating an inventory item
const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  category: z.enum(INVENTORY_CATEGORIES),
  description: z.string().max(1000).optional().nullable(),
  activeCompound: z.string().max(255).optional().nullable(),
  presentation: z.string().max(100).optional().nullable(),
  measure: z.string().max(50).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  quantity: z.number().min(0).default(0),
  minStock: z.number().min(0).optional().nullable(),
  expirationDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .optional()
    .nullable(),
  status: z.enum(INVENTORY_STATUSES).default('ACTIVE'),
  batchNumber: z.string().max(100).optional().nullable(),
  specialNotes: z.string().max(500).optional().nullable(),
  storageLocation: z.string().max(100).optional().nullable(),
  cost: z.number().min(0).optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
});

export const GET = withApiAuth(
  async (request, { apiKey, locationId }) => {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(request);

    // Parse filters
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const lowStockParam = searchParams.get('lowStock');
    const lowStock = lowStockParam === 'true';

    // Build base where clause with tenant and location
    const baseWhere = buildWhereClause(apiKey, locationId, {});

    // Build search conditions
    const searchConditions = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { brand: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // For low stock filter, we need a raw query or post-filtering
    // Using Prisma's approach with a subquery-like condition
    const where = {
      ...baseWhere,
      ...(category && { category }),
      ...(status && { status }),
      ...searchConditions,
    };

    // Fetch items and count in parallel
    let [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: pagination.offset,
        take: pagination.limit,
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    // Post-filter for low stock if needed
    if (lowStock) {
      // Re-fetch with low stock filter
      const lowStockItems = await prisma.inventoryItem.findMany({
        where: {
          ...baseWhere,
          ...(category && { category }),
          ...(status && { status }),
          ...searchConditions,
          minStock: { not: null },
        },
        orderBy: { name: 'asc' },
      });

      // Filter where quantity <= minStock
      items = lowStockItems.filter((item) => {
        const qty = Number(item.quantity);
        const min = Number(item.minStock);
        return qty <= min;
      });

      // Apply pagination manually
      total = items.length;
      items = items.slice(pagination.offset, pagination.offset + pagination.limit);
    }

    const serializedItems = items.map(serializeInventoryItem);

    return NextResponse.json(paginatedResponse(serializedItems, total, pagination));
  },
  { requiredScope: 'read:inventory' }
);

export const POST = withApiAuth(
  async (request, { apiKey, locationId }) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid JSON body', 'BAD_REQUEST', 400);
    }

    // Validate input
    const result = createInventoryItemSchema.safeParse(body);
    if (!result.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const data = result.data;

    // Determine effective location ID
    const effectiveLocationId = locationId || data.locationId || null;

    // Validate location if provided
    if (effectiveLocationId) {
      const location = await prisma.location.findFirst({
        where: {
          id: effectiveLocationId,
          tenantId: apiKey.tenantId,
          isActive: true,
        },
      });

      if (!location) {
        return apiError('Location not found or inactive', 'NOT_FOUND', 404);
      }
    }

    // Create the inventory item
    const item = await prisma.inventoryItem.create({
      data: {
        tenantId: apiKey.tenantId,
        locationId: effectiveLocationId,
        name: data.name,
        category: data.category,
        description: data.description,
        activeCompound: data.activeCompound,
        presentation: data.presentation,
        measure: data.measure,
        brand: data.brand,
        quantity: data.quantity,
        minStock: data.minStock,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        status: data.status,
        batchNumber: data.batchNumber,
        specialNotes: data.specialNotes,
        storageLocation: data.storageLocation,
        cost: data.cost,
        price: data.price,
      },
    });

    return NextResponse.json({ data: serializeInventoryItem(item) }, { status: 201 });
  },
  { requiredScope: 'write:inventory' }
);
