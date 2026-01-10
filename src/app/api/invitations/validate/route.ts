/**
 * GET /api/invitations/validate
 *
 * Validate an invitation token and return invitation details.
 * This is a public endpoint (no auth required) for the invite page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateInvitation } from '@/lib/invitations/invitation-token';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de invitación requerido' },
        { status: 400 }
      );
    }

    const result = await validateInvitation(token);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.reason },
        { status: 400 }
      );
    }

    const { invitation } = result;

    // Return invitation details (sanitized)
    return NextResponse.json({
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        roleKey: invitation.roleKey,
        expiresAt: invitation.expiresAt.toISOString(),
        tenant: {
          name: invitation.tenant.name,
          logo: invitation.tenant.logo,
        },
        staff: invitation.staff
          ? {
              name: invitation.staff.name,
              position: invitation.staff.position,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[API /invitations/validate] Error:', error);

    return NextResponse.json(
      { error: 'Error al validar la invitación' },
      { status: 500 }
    );
  }
}
