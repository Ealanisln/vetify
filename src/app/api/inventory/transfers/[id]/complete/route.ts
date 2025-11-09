import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { completeInventoryTransfer } from '@/lib/locations';
import { createSecureResponse, createSecureErrorResponse } from '@/lib/security/input-sanitization';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/inventory/transfers/[id]/complete
 * Complete an inventory transfer (moves stock between locations)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenant } = await requireAuth();
    const transferId = params.id;

    if (!transferId) {
      return createSecureErrorResponse('ID de transferencia requerido', 400);
    }

    // Complete the transfer (atomic transaction)
    const transfer = await completeInventoryTransfer(transferId, tenant.id);

    return createSecureResponse({
      transfer,
      message: 'Transferencia completada exitosamente',
    });
  } catch (error) {
    console.error('[INVENTORY_TRANSFERS] Failed to complete transfer:', error);

    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return createSecureErrorResponse('Transferencia no encontrada', 404);
      }
      if (error.message.includes('no puede ser completada')) {
        return createSecureErrorResponse(error.message, 400);
      }
      if (error.message.includes('stock insuficiente')) {
        return createSecureErrorResponse(error.message, 400);
      }
    }

    return createSecureErrorResponse(
      'Error al completar la transferencia',
      500
    );
  }
}
