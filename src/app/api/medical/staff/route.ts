import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { z, ZodError } from 'zod';
import { getStaffMembers, createStaffMember } from '../../../../lib/medical';
import { getTenantByUserId } from '../../../../lib/tenant';

// Validation schema for inline staff creation (simplified for modal use)
const createStaffSchema = z.object({
  tenantId: z.string().uuid('ID de tenant inválido'),
  name: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre es demasiado largo').trim(),
  position: z.enum(
    ['VETERINARIAN', 'VETERINARY_TECHNICIAN', 'ASSISTANT', 'RECEPTIONIST', 'MANAGER', 'GROOMER', 'OTHER'],
    { errorMap: () => ({ message: 'Posición inválida' }) }
  ),
  licenseNumber: z.string().max(50, 'Número de licencia demasiado largo').regex(/^[a-zA-Z0-9-]*$/, 'Número de licencia contiene caracteres inválidos').optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'TenantId es requerido' },
        { status: 400 }
      );
    }

    // Verify user belongs to the tenant
    const userTenant = await getTenantByUserId(user.id);
    if (!userTenant || userTenant.id !== tenantId) {
      return NextResponse.json(
        { error: 'No tienes permiso para acceder a este tenant' },
        { status: 403 }
      );
    }

    const staff = await getStaffMembers(tenantId);

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request body with Zod
    const validatedData = createStaffSchema.parse(body);

    // Verify user belongs to the tenant (authorization check)
    const userTenant = await getTenantByUserId(user.id);
    if (!userTenant || userTenant.id !== validatedData.tenantId) {
      return NextResponse.json(
        { error: 'No tienes permiso para crear personal en este tenant' },
        { status: 403 }
      );
    }

    const staff = await createStaffMember(validatedData.tenantId, {
      name: validatedData.name,
      position: validatedData.position,
      licenseNumber: validatedData.licenseNumber || null,
    });

    return NextResponse.json(staff);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return NextResponse.json(
        {
          error: 'Datos de validación inválidos',
          details: errorMessages
        },
        { status: 400 }
      );
    }

    console.error('Error creating staff:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 