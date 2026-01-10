/**
 * POST /api/invitations/accept
 *
 * Accept an invitation and link the authenticated user to the staff record.
 * Requires authentication.
 *
 * Note: This endpoint handles the race condition where autoAcceptPendingInvitation
 * (in findOrCreateUser) may have already accepted the invitation during the
 * getAuthenticatedUser() call. In that case, we check if the user is already
 * linked and return success instead of an error.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth';
import { acceptInvitation, validateInvitation } from '@/lib/invitations/invitation-token';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  token: z.string().min(1, 'Token requerido'),
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    // NOTE: This call may trigger autoAcceptPendingInvitation which could
    // accept the invitation before we get to the manual acceptance below
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

    // Handle already-accepted invitation
    // This can happen due to race condition with autoAcceptPendingInvitation
    if (!validation.valid && validation.reason === 'Esta invitación ya fue aceptada') {
      // Check if the current user is already linked to a tenant
      // If so, the invitation was successfully processed (just by autoAccept instead of manually)
      if (user.tenantId) {
        // Get the tenant name for the success message
        const tenant = await prisma.tenant.findUnique({
          where: { id: user.tenantId },
          select: { name: true },
        });

        return NextResponse.json({
          success: true,
          message: '¡Invitación aceptada! Ahora tienes acceso al sistema.',
          tenantName: tenant?.name || 'la clínica',
          alreadyAccepted: true, // Flag to indicate this was auto-accepted
        });
      }

      // User is not linked, so this is a genuine error
      return NextResponse.json(
        { success: false, error: validation.reason },
        { status: 400 }
      );
    }

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
      // One more check: if it failed because "already linked", and user has tenant, treat as success
      if (result.error === 'Este personal ya tiene una cuenta vinculada' && user.tenantId) {
        return NextResponse.json({
          success: true,
          message: '¡Invitación aceptada! Ahora tienes acceso al sistema.',
          tenantName: invitation.tenant.name,
          alreadyAccepted: true,
        });
      }

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
