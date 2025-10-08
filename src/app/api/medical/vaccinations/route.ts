import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { createVaccination } from '../../../../lib/medical';
import { vaccinationSchema } from '../../../../lib/medical-validation';

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();
    
    const { petId, tenantId, ...vaccinationData } = body;
    
    // Validate tenant access
    if (tenantId !== tenant.id) {
      return NextResponse.json(
        { message: 'No tienes acceso a este tenant' },
        { status: 403 }
      );
    }
    
    // Validate the vaccination data
    const validatedData = vaccinationSchema.parse(vaccinationData);
    
    // Create the vaccination
    const vaccination = await createVaccination(petId, tenantId, validatedData);
    
    return NextResponse.json(vaccination, { status: 201 });
  } catch (error) {
    console.error('Error creating vaccination:', error);
    
    if (error instanceof Error) {
      // Handle validation errors
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { message: 'Datos de vacunación inválidos', errors: error },
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