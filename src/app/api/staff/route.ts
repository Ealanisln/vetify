import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import {
  createStaff,
  createStaffSchema,
  getStaffByTenant
} from '../../../lib/staff';
import { parsePagination } from '../../../lib/security/validation-schemas';

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();
    
    const validatedData = createStaffSchema.parse(body);
    const staff = await createStaff(tenant.id as string, validatedData);
    
    return NextResponse.json(staff, { status: 201 });

  } catch (error) {
    console.error('Error creating staff:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);

    // SECURITY FIX: Use validated pagination with enforced limits
    const { page, limit } = parsePagination(searchParams);

    // Parse query parameters
    const filters = {
      search: searchParams.get('search') || undefined,
      position: searchParams.get('position') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      locationId: searchParams.get('locationId') || undefined,
      page,
      limit,
    };

    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined)
    );

    const result = await getStaffByTenant(tenant.id as string, cleanFilters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 