import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/super-admin';
import { getUsers, createUser, getUserStats, UserFilters } from '@/lib/admin/users';

/**
 * GET /api/admin/users
 * List users with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireSuperAdmin();
    
    const { searchParams } = new URL(request.url);
    
    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Parse filters
    const filters: UserFilters = {};
    
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!;
    }
    
    if (searchParams.get('tenantId')) {
      filters.tenantId = searchParams.get('tenantId')!;
    }
    
    if (searchParams.get('roleId')) {
      filters.roleId = searchParams.get('roleId')!;
    }
    
    if (searchParams.get('isActive')) {
      filters.isActive = searchParams.get('isActive') === 'true';
    }
    
    if (searchParams.get('dateFrom')) {
      filters.dateFrom = new Date(searchParams.get('dateFrom')!);
    }
    
    if (searchParams.get('dateTo')) {
      filters.dateTo = new Date(searchParams.get('dateTo')!);
    }

    // Get stats if requested
    const includeStats = searchParams.get('includeStats') === 'true';
    
    const [usersData, stats] = await Promise.all([
      getUsers(page, limit, filters),
      includeStats ? getUserStats() : Promise.resolve(null)
    ]);

    return NextResponse.json({
      success: true,
      data: usersData,
      stats
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    
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
 * POST /api/admin/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    const { user: currentUser } = await requireSuperAdmin();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.id || !body.email) {
      return NextResponse.json(
        { error: 'ID de usuario y email son requeridos' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    const userData = {
      id: body.id,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      name: body.name,
      phone: body.phone,
      address: body.address,
      tenantId: body.tenantId,
      isActive: body.isActive ?? true
    };

    const newUser = await createUser(userData, currentUser.id);

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'Usuario creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren privilegios de super administrador.' },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email o ID' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 