import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { 
  getUserRoles, 
  createUserRole,
  userRoleSchema,
  AVAILABLE_PERMISSIONS 
} from '@/lib/enhanced-settings';

export async function GET() {
  try {
    const { tenant } = await requireAuth();
    const roles = await getUserRoles(tenant.id);
    const permissions = AVAILABLE_PERMISSIONS;

    return NextResponse.json({ roles, permissions });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();

    const validatedData = userRoleSchema.parse(body);
    const role = await createUserRole(tenant.id, validatedData);

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    console.error('Error creating user role:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 