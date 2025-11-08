import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getLocationsByTenant,
  createLocation,
  type CreateLocationInput,
} from '@/lib/locations';
import { checkLocationLimit } from '@/lib/plan-limits';

// Force dynamic rendering to prevent static generation issues with Kinde Auth
export const dynamic = 'force-dynamic';

/**
 * GET /api/locations
 * List all locations for the authenticated tenant
 * Optional query params:
 * - isActive: boolean (filter by active status)
 * - search: string (search in name, address, phone)
 */
export async function GET(request: Request) {
  try {
    // Authenticate and get tenant
    const { tenant } = await requireAuth();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get('isActive');
    const search = searchParams.get('search');

    const options: {
      isActive?: boolean;
      search?: string;
    } = {};

    if (isActiveParam !== null) {
      options.isActive = isActiveParam === 'true';
    }

    if (search) {
      options.search = search;
    }

    // Get locations
    const locations = await getLocationsByTenant(tenant.id, options);

    return NextResponse.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error('Error fetching locations:', error);

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
        error: 'Error al obtener ubicaciones',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/locations
 * Create a new location for the authenticated tenant
 */
export async function POST(request: Request) {
  try {
    // Authenticate and get tenant
    const { tenant } = await requireAuth();

    // Check location limits based on plan
    const locationCheck = await checkLocationLimit(tenant.id);
    if (!locationCheck.canAdd) {
      return NextResponse.json(
        {
          success: false,
          error: 'Has alcanzado el límite de ubicaciones de tu plan',
          details: {
            current: locationCheck.current,
            limit: locationCheck.limit,
            requiresUpgrade: locationCheck.requiresUpgrade,
            message: locationCheck.requiresUpgrade
              ? 'El Plan Básico solo permite 1 ubicación. Actualiza a Plan Profesional para más ubicaciones.'
              : 'Has alcanzado el límite de ubicaciones'
          }
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Create location
    const location = await createLocation(
      tenant.id,
      body as CreateLocationInput
    );

    return NextResponse.json(
      {
        success: true,
        data: location,
        message: 'Ubicación creada exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating location:', error);

    if (error instanceof Error) {
      // Handle specific errors
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          {
            success: false,
            error: 'No autorizado',
          },
          { status: 401 }
        );
      }

      if (error.message.includes('Ya existe una ubicación con este slug')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 409 } // Conflict
        );
      }

      // Validation errors from Zod
      if (error.message.includes('validation')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear ubicación',
      },
      { status: 500 }
    );
  }
}
