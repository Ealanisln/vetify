import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { cancelInventoryTransfer } from '@/lib/locations';
import { createSecureResponse, createSecureErrorResponse } from '@/lib/security/input-sanitization';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/inventory/transfers/[id]/cancel
 * Cancel a pending or in-transit inventory transfer
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

    // Cancel the transfer
    const transfer = await cancelInventoryTransfer(transferId, tenant.id);

    return createSecureResponse({
      transfer,
      message: 'Transferencia cancelada exitosamente',
    });
  } catch (error) {
    console.error('[INVENTORY_TRANSFERS] Failed to cancel transfer:', error);

    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return createSecureErrorResponse('Transferencia no encontrada', 404);
      }
      if (error.message.includes('no puede ser cancelada')) {
        return createSecureErrorResponse(error.message, 400);
      }
    }

    return createSecureErrorResponse(
      'Error al cancelar la transferencia',
      500
    );
  }
}
