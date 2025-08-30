import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { recordVitalSigns } from '../../../../lib/medical';
import { vitalSignsSchema } from '../../../../lib/medical-validation';

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();
    
    const { petId, tenantId, ...vitalSignsData } = body;
    
    // Validate tenant access
    if (tenantId !== tenant.id) {
      return NextResponse.json(
        { message: 'No tienes acceso a este tenant' },
        { status: 403 }
      );
    }
    
    // Validate the vital signs data
    const validatedData = vitalSignsSchema.parse(vitalSignsData);
    
    // Record the vital signs
    const vitals = await recordVitalSigns(petId, tenantId, validatedData);
    
    return NextResponse.json(vitals, { status: 201 });
  } catch (error) {
    console.error('Error recording vital signs:', error);
    
    if (error instanceof Error) {
      // Handle validation errors
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { message: 'Datos de signos vitales inválidos', errors: error },
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