import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { setPrimaryLocation } from '@/lib/locations';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/locations/[id]/set-primary
 * Set a location as the primary location for the tenant
 * Ensures only one primary location exists per tenant using a transaction
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tenant } = await requireAuth();

    // Set as primary location
    const location = await setPrimaryLocation(id, tenant.id);

    return NextResponse.json({
      success: true,
      data: location,
      message: 'Ubicación principal actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error setting primary location:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          {
            success: false,
            error: 'No autorizado',
          },
          { status: 401 }
        );
      }

      if (error.message === 'Ubicación no encontrada') {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar ubicación principal',
      },
      { status: 500 }
    );
  }
}
