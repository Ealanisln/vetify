import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getStaffForUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/staff/me
 * Get the current user's staff record
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      );
    }

    const staff = await getStaffForUser(user.id);

    if (!staff) {
      // User has no staff record - this is okay for tenant owners
      return NextResponse.json(
        { error: 'No staff record found' },
        { status: 404 }
      );
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching current staff:', error);

    if (error instanceof Error && error.message === 'No authenticated user') {
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
