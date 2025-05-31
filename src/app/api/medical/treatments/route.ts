import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createTreatment } from '@/lib/medical';
import { treatmentSchema } from '@/lib/medical-validation';

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();
    
    const { petId, tenantId, ...treatmentData } = body;
    
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
      // Handle validation errors
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { message: 'Datos de tratamiento inválidos', errors: error },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 