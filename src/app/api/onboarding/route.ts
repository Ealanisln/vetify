import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserWithOptionalTenant } from '@/lib/auth';
import { createTenantWithDefaults, isSlugAvailable } from '@/lib/tenant';
import { z } from 'zod';

const onboardingSchema = z.object({
  clinicName: z.string().min(1, 'El nombre de la clínica es requerido'),
  slug: z.string()
    .min(1, 'El slug es requerido')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUserWithOptionalTenant();
    
    // Check if user already has a tenant
    if (user.tenant) {
      return NextResponse.json(
        { message: 'El usuario ya tiene una clínica configurada' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = onboardingSchema.parse(body);

    // Check if slug is already taken
    if (!(await isSlugAvailable(validatedData.slug))) {
      return NextResponse.json(
        { message: 'Esta URL ya está en uso. Por favor, elige otra.' },
        { status: 400 }
      );
    }

    // Create tenant with all defaults
    const result = await createTenantWithDefaults({
      name: validatedData.clinicName,
      slug: validatedData.slug,
      userId: user.id,
      phone: validatedData.phone,
      address: validatedData.address,
    });

    return NextResponse.json({
      message: 'Clínica creada exitosamente',
      tenant: result.tenant,
    }, { status: 201 });

  } catch (error) {
    console.error('Error during onboarding:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 