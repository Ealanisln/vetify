import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../../../lib/super-admin';
import { getAvailableRoles, assignUserRole, removeUserRole, getTenantsForUserAssignment } from '../../../../../lib/admin/users';

/**
 * GET /api/admin/users/roles
 * Get available roles and tenants for user assignment
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();
    
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || undefined;

    const [roles, tenants] = await Promise.all([
      getAvailableRoles(tenantId),
      getTenantsForUserAssignment()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        roles,
        tenants
      }
    });

  } catch (error) {
    console.error('Error fetching roles and tenants:', error);
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren privilegios de super administrador.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users/roles
 * Assign or remove role from user
 */
export async function POST(request: NextRequest) {
  try {
    const { user: currentUser } = await requireSuperAdmin();
    
    const body = await request.json();
    const { userId, roleId, action } = body;

    if (!userId || !roleId || !action) {
      return NextResponse.json(
        { error: 'userId, roleId y action son requeridos' },
        { status: 400 }
      );
    }

    if (!['assign', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'action debe ser "assign" o "remove"' },
        { status: 400 }
      );
    }

    let result;
    let message;

    if (action === 'assign') {
      result = await assignUserRole(userId, roleId, currentUser.id);
      message = 'Rol asignado exitosamente';
    } else {
      await removeUserRole(userId, roleId, currentUser.id);
      result = { success: true };
      message = 'Rol removido exitosamente';
    }

    return NextResponse.json({
      success: true,
      data: result,
      message
    });

  } catch (error) {
    console.error('Error managing user role:', error);
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren privilegios de super administrador.' },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message.includes('already has this role')) {
      return NextResponse.json(
        { error: 'El usuario ya tiene este rol asignado' },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message.includes('does not have this role')) {
      return NextResponse.json(
        { error: 'El usuario no tiene este rol asignado' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 