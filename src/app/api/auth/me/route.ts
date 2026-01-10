/**
 * Auth Status Endpoint
 *
 * Returns the current user's authentication status.
 * Used by the invite page to check if user is logged in.
 */

import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    const user = await getUser();

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.given_name ? `${user.given_name} ${user.family_name || ''}`.trim() : null,
      },
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Failed to check authentication' },
      { status: 500 }
    );
  }
}
