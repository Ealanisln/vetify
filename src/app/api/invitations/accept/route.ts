/**
 * POST /api/invitations/accept
 *
 * Accept an invitation and link the authenticated user to the staff record.
 * Requires authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth';
import { acceptInvitation, validateInvitation } from '@/lib/invitations/invitation-token';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  token: z.string().min(1, 'Token requerido'),
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para aceptar la invitación' },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();
    const { token } = bodySchema.parse(body);

    // First validate the token
    const validation = await validateInvitation(token);

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.reason },
        { status: 400 }
      );
    }

    // Verify email matches
    const { invitation } = validation;
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: `Esta invitación es para ${invitation.email}. Debes iniciar sesión con ese email.`,
        },
        { status: 403 }
      );
    }

    // Accept the invitation
    const result = await acceptInvitation(token, user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '¡Invitación aceptada! Ahora tienes acceso al sistema.',
      staffId: result.staffId,
      tenantName: invitation.tenant.name,
    });
  } catch (error) {
    console.error('[API /invitations/accept] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'No authenticated user') {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para aceptar la invitación' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error al aceptar la invitación' },
      { status: 500 }
    );
  }
}
