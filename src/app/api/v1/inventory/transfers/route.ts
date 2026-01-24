/**
 * API v1 Inventory Transfers Endpoint
 *
 * GET /api/v1/inventory/transfers - List inventory transfers
 * POST /api/v1/inventory/transfers - Create a new transfer request
 *
 * Query Parameters (GET):
 * - status: Filter by status (PENDING, IN_TRANSIT, COMPLETED, CANCELLED)
 * - fromLocationId: Filter by source location
 * - toLocationId: Filter by destination location
 * - inventoryItemId: Filter by inventory item
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
  apiError,
} from '@/lib/api/api-key-auth';
import { serializeInventoryTransfer } from '../../_shared/serializers';

// Validation schema for creating a transfer
const createTransferSchema = z.object({
  inventoryItemId: z.string().uuid('Invalid inventory item ID'),
  fromLocationId: z.string().uuid('Invalid source location ID'),
  toLocationId: z.string().uuid('Invalid destination location ID'),
  quantity: z.number().positive('Quantity must be positive'),
  notes: z.string().max(500).optional().nullable(),
  requestedById: z.string().uuid('Invalid staff ID'),
});

export const GET = withApiAuth(
  async (request, { apiKey, locationId }) => {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(request);

    // Parse filters
    const status = searchParams.get('status') as (typeof TRANSFER_STATUSES)[number] | null;
    const fromLocationId = searchParams.get('fromLocationId');
    const toLocationId = searchParams.get('toLocationId');
    const inventoryItemId = searchParams.get('inventoryItemId');

    // Build where clause
    const where: Record<string, unknown> = {
      tenantId: apiKey.tenantId,
    };

    // If API key is scoped to a location, only show transfers involving that location
    if (locationId) {
      where.OR = [{ fromLocationId: locationId }, { toLocationId: locationId }];
    }

    if (status) {
      where.status = status;
    }
    if (fromLocationId && !locationId) {
      where.fromLocationId = fromLocationId;
    }
    if (toLocationId && !locationId) {
      where.toLocationId = toLocationId;
    }
    if (inventoryItemId) {
      where.inventoryItemId = inventoryItemId;
    }

    // Fetch transfers and count in parallel
    const [transfers, total] = await Promise.all([
      prisma.inventoryTransfer.findMany({
        where,
        include: {
          inventoryItem: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          fromLocation: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          toLocation: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          requestedBy: {
            select: {
              id: true,
              name: true,
              position: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.offset,
        take: pagination.limit,
      }),
      prisma.inventoryTransfer.count({ where }),
    ]);

    const serializedTransfers = transfers.map(serializeInventoryTransfer);

    return NextResponse.json(paginatedResponse(serializedTransfers, total, pagination));
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
    const result = createTransferSchema.safeParse(body);
    if (!result.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const data = result.data;

    // Verify from and to locations are different
    if (data.fromLocationId === data.toLocationId) {
      return apiError(
        'Source and destination locations must be different',
        'VALIDATION_ERROR',
        400
      );
    }

    // If API key is scoped to a location, verify the transfer originates from that location
    if (locationId && data.fromLocationId !== locationId) {
      return apiError(
        'You can only create transfers from your assigned location',
        'FORBIDDEN',
        403
      );
    }

    // Verify inventory item exists and belongs to tenant
    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        id: data.inventoryItemId,
        tenantId: apiKey.tenantId,
      },
    });

    if (!inventoryItem) {
      return apiError('Inventory item not found', 'NOT_FOUND', 404);
    }

    // Verify the item is at the source location
    if (inventoryItem.locationId !== data.fromLocationId) {
      return apiError(
        'Inventory item is not at the source location',
        'VALIDATION_ERROR',
        400
      );
    }

    // Verify sufficient quantity
    const availableQty = Number(inventoryItem.quantity);
    if (availableQty < data.quantity) {
      return apiError(
        `Insufficient quantity. Available: ${availableQty}, Requested: ${data.quantity}`,
        'VALIDATION_ERROR',
        400
      );
    }

    // Verify both locations exist and belong to tenant
    const [fromLocation, toLocation] = await Promise.all([
      prisma.location.findFirst({
        where: {
          id: data.fromLocationId,
          tenantId: apiKey.tenantId,
          isActive: true,
        },
      }),
      prisma.location.findFirst({
        where: {
          id: data.toLocationId,
          tenantId: apiKey.tenantId,
          isActive: true,
        },
      }),
    ]);

    if (!fromLocation) {
      return apiError('Source location not found or inactive', 'NOT_FOUND', 404);
    }
    if (!toLocation) {
      return apiError('Destination location not found or inactive', 'NOT_FOUND', 404);
    }

    // Verify staff exists and belongs to tenant
    const staff = await prisma.staff.findFirst({
      where: {
        id: data.requestedById,
        tenantId: apiKey.tenantId,
        isActive: true,
      },
    });

    if (!staff) {
      return apiError('Staff not found or inactive', 'NOT_FOUND', 404);
    }

    // Create the transfer
    const transfer = await prisma.inventoryTransfer.create({
      data: {
        tenantId: apiKey.tenantId,
        inventoryItemId: data.inventoryItemId,
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        quantity: data.quantity,
        notes: data.notes,
        requestedById: data.requestedById,
        status: 'PENDING',
      },
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        fromLocation: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        toLocation: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
      },
    });

    return NextResponse.json({ data: serializeInventoryTransfer(transfer) }, { status: 201 });
  },
  { requiredScope: 'write:inventory' }
);
