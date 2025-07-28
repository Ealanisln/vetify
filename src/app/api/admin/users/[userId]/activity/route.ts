import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/super-admin';
import { getUserActivity, getUserById } from '@/lib/admin/users';

interface RouteParams {
  params: {
    userId: string;
  };
}

/**
 * GET /api/admin/users/[userId]/activity
 * Get user activity history
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await requireSuperAdmin();
    
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const activityData = await getUserActivity(userId, page, limit);

    return NextResponse.json({
      success: true,
      data: activityData
    });

  } catch (error) {
    console.error('Error fetching user activity:', error);
    
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