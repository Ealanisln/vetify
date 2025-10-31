import { NextRequest, NextResponse } from 'next/server';
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

    if (error instanceof Error) {
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        interface ZodError {
          errors: Array<{
            path: Array<string | number>;
            message: string;
          }>;
        }
        const zodError = error as Error & ZodError;
        const fieldErrors: Record<string, string> = {};

        if (zodError.errors) {
          zodError.errors.forEach((err) => {
            const field = err.path.join('.');
            fieldErrors[field] = err.message;
          });
        }

        return NextResponse.json(
          {
            message: 'Datos de tratamiento inválidos',
            errors: fieldErrors
          },
          { status: 400 }
        );
      }

      // Handle database/business logic errors
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