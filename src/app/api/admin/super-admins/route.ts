import { NextRequest, NextResponse } from 'next/server';
import { 
  assignSuperAdmin, 
  removeSuperAdmin, 
  listSuperAdmins,
  requireSuperAdmin 
} from '../../../../lib/super-admin';

/**
 * GET - Listar todos los super administradores
 */
export async function GET() {
  try {
    const superAdmins = await listSuperAdmins();
    return NextResponse.json({ superAdmins });
  } catch (error) {
    console.error('Error listing super admins:', error);
    return NextResponse.json(
      { error: 'Error al obtener la lista de super administradores' },
      { status: 500 }
    );
  }
}

/**
 * POST - Asignar un usuario como super administrador
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar permisos
    await requireSuperAdmin();

    const body = await request.json();
    const { userIdOrEmail } = body;

    if (!userIdOrEmail) {
      return NextResponse.json(
        { error: 'Se requiere el ID o email del usuario' },
        { status: 400 }
      );
    }

    const result = await assignSuperAdmin(userIdOrEmail);

    if (result.success) {
      return NextResponse.json({ 
        message: result.message,
        success: true 
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error assigning super admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remover rol de super administrador de un usuario
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar permisos
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const userIdOrEmail = searchParams.get('userIdOrEmail');

    if (!userIdOrEmail) {
      return NextResponse.json(
        { error: 'Se requiere el ID o email del usuario' },
        { status: 400 }
      );
    }

    const result = await removeSuperAdmin(userIdOrEmail);

    if (result.success) {
      return NextResponse.json({ 
        message: result.message,
        success: true 
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error removing super admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 