import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getLocationById,
  updateLocation,
  deleteLocation,
  type UpdateLocationInput,
} from '@/lib/locations';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/locations/[id]
 * Get a single location by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tenant } = await requireAuth();

    const location = await getLocationById(id, tenant.id);

    if (!location) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ubicación no encontrada',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error('Error fetching location:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener ubicación',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/locations/[id]
 * Update a location
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tenant } = await requireAuth();

    // Parse request body
    const body = await request.json();

    // Update location
    const location = await updateLocation(
      id,
      tenant.id,
      body as UpdateLocationInput
    );

    return NextResponse.json({
      success: true,
      data: location,
      message: 'Ubicación actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error updating location:', error);

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

      if (error.message.includes('Ya existe una ubicación con este slug')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar ubicación',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/locations/[id]
 * Soft delete a location (set isActive to false)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tenant } = await requireAuth();

    // Soft delete location
    await deleteLocation(id, tenant.id);

    return NextResponse.json({
      success: true,
      message: 'Ubicación eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting location:', error);

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

      if (
        error.message.includes('No puedes eliminar la ubicación principal')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 400 }
        );
      }

      if (error.message.includes('Esta ubicación tiene')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 409 } // Conflict - has related data
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar ubicación',
      },
      { status: 500 }
    );
  }
}
