import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import {
  createInventoryTransfer,
  getInventoryTransfers,
} from '@/lib/locations';
import { createSecureResponse, createSecureErrorResponse } from '@/lib/security/input-sanitization';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/inventory/transfers
 * List inventory transfers for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED' | undefined;
    const fromLocationId = searchParams.get('fromLocationId') || undefined;
    const toLocationId = searchParams.get('toLocationId') || undefined;

    const transfers = await getInventoryTransfers(tenant.id, {
      status,
      fromLocationId,
      toLocationId,
    });

    return createSecureResponse({
      transfers,
    });
  } catch (error) {
    console.error('[INVENTORY_TRANSFERS] Failed to fetch transfers:', error);
    return createSecureErrorResponse(
      'Error al cargar las transferencias',
      500
    );
  }
}

/**
 * POST /api/inventory/transfers
 * Create a new inventory transfer
 */
const createTransferSchema = z.object({
  inventoryItemId: z.string().uuid('ID de artículo inválido'),
  fromLocationId: z.string().uuid('ID de ubicación origen inválida'),
  toLocationId: z.string().uuid('ID de ubicación destino inválida'),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  notes: z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { user, tenant } = await requireAuth();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTransferSchema.parse(body);

    // Validate that from and to locations are different
    if (validatedData.fromLocationId === validatedData.toLocationId) {
      return createSecureErrorResponse(
        'Las ubicaciones origen y destino deben ser diferentes',
        400
      );
    }

    // Create the transfer
    const transfer = await createInventoryTransfer(
      tenant.id,
      user.id,
      validatedData
    );

    return createSecureResponse(
      {
        transfer,
        message: 'Transferencia creada exitosamente',
      },
      201
    );
  } catch (error) {
    console.error('[INVENTORY_TRANSFERS] Failed to create transfer:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return createSecureErrorResponse(
        'Datos inválidos. Por favor verifica la información.',
        400
      );
    }

    // Handle specific error messages from the service
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return createSecureErrorResponse(error.message, 404);
      }
      if (error.message.includes('stock insuficiente')) {
        return createSecureErrorResponse(error.message, 400);
      }
    }

    return createSecureErrorResponse(
      'Error al crear la transferencia',
      500
    );
  }
}
