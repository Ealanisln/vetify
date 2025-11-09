import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSecureResponse, createSecureErrorResponse } from '@/lib/security/input-sanitization';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/inventory/transfers/[id]
 * Get details of a specific inventory transfer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenant } = await requireAuth();
    const transferId = params.id;

    if (!transferId) {
      return createSecureErrorResponse('ID de transferencia requerido', 400);
    }

    // Fetch transfer with full details
    const transfer = await prisma.inventoryTransfer.findFirst({
      where: {
        id: transferId,
        tenantId: tenant.id,
      },
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            sku: true,
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
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!transfer) {
      return createSecureErrorResponse('Transferencia no encontrada', 404);
    }

    return createSecureResponse({
      transfer,
    });
  } catch (error) {
    console.error('[INVENTORY_TRANSFERS] Failed to fetch transfer:', error);
    return createSecureErrorResponse(
      'Error al cargar la transferencia',
      500
    );
  }
}
