import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createConsultation } from '@/lib/medical';
import { consultationSchema } from '@/lib/medical-validation';

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();
    
    const { petId, tenantId, ...consultationData } = body;
    
    // Validate tenant access
    if (tenantId !== tenant.id) {
      return NextResponse.json(
        { message: 'No tienes acceso a este tenant' },
        { status: 403 }
      );
    }
    
    // Validate the consultation data
    const validatedData = consultationSchema.parse(consultationData);
    
    // Create the consultation
    const consultation = await createConsultation(petId, tenantId, validatedData);
    
    return NextResponse.json(consultation, { status: 201 });
  } catch (error) {
    console.error('Error creating consultation:', error);
    
    if (error instanceof Error) {
      // Handle validation errors
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { message: 'Datos de consulta inválidos', errors: error },
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