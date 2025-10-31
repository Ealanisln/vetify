import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireAuth } from '../../../../lib/auth';
import { createTreatment } from '../../../../lib/medical';
import { treatmentSchema } from '../../../../lib/medical-validation';

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();

    const { petId, tenantId, ...treatmentData } = body;

    // Validate required fields
    if (!petId || !tenantId) {
      return NextResponse.json(
        {
          message: 'Datos incompletos',
          errors: {
            petId: !petId ? 'Pet ID es requerido' : undefined,
            tenantId: !tenantId ? 'Tenant ID es requerido' : undefined,
          }
        },
        { status: 400 }
      );
    }

    // Validate tenant access
    if (tenantId !== tenant.id) {
      return NextResponse.json(
        { message: 'No tienes acceso a este tenant' },
        { status: 403 }
      );
    }

    // Validate the treatment data
    const validatedData = treatmentSchema.parse(treatmentData);

    // Create the treatment
    const treatment = await createTreatment(petId, tenantId, validatedData);

    return NextResponse.json(treatment, { status: 201 });
  } catch (error) {
    console.error('Error creating treatment:', error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};

      error.errors.forEach((err) => {
        const field = err.path.join('.');
        fieldErrors[field] = err.message;
      });

      return NextResponse.json(
        {
          message: 'Datos de tratamiento inválidos',
          errors: fieldErrors
        },
        { status: 400 }
      );
    }

    // Handle other errors
    if (error instanceof Error) {
      return NextResponse.json(
        {
          message: error.message || 'Error al crear el tratamiento',
          error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 