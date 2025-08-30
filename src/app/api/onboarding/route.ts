import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserWithOptionalTenant } from '../../../lib/auth';
import { createTenantWithDefaults, isSlugAvailable } from '../../../lib/tenant';
import { z } from 'zod';

const onboardingSchema = z.object({
  planKey: z.enum(['PROFESIONAL', 'CLINICA', 'EMPRESA'], {
    required_error: 'Debe seleccionar un plan',
  }),
  billingInterval: z.enum(['monthly', 'yearly'], {
    required_error: 'Debe seleccionar un intervalo de facturación',
  }),
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
    
    // Check if user exists and already has a tenant
    if (!user) {
      return NextResponse.json(
        { message: 'Usuario no autenticado' },
        { status: 401 }
      );
    }
    
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

    // Create tenant with selected plan
    const result = await createTenantWithDefaults({
      name: validatedData.clinicName,
      slug: validatedData.slug,
      userId: user.id,
      planKey: validatedData.planKey,
      billingInterval: validatedData.billingInterval,
      phone: validatedData.phone,
      address: validatedData.address,
    });

    return NextResponse.json({
      message: 'Clínica creada exitosamente',
      tenant: result.tenant,
    }, { status: 201 });

  } catch (error) {
    console.error('Onboarding error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos inválidos', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 