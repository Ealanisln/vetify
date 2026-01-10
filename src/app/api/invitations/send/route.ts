/**
 * POST /api/invitations/send
 *
 * Send an invitation email to a staff member.
 * Requires staff:write permission.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth';
import { sendStaffInvitationEmail } from '@/lib/invitations/invitation-email';
import { getInvitationForStaff } from '@/lib/invitations/invitation-token';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  staffId: z.string().uuid('ID de personal inválido'),
});

export async function POST(request: NextRequest) {
  try {
    // Require staff:write permission
    const { tenant } = await requirePermission('staff', 'write');

    // Parse and validate body
    const body = await request.json();
    const { staffId } = bodySchema.parse(body);

    // Verify staff exists and belongs to this tenant
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        name: true,
        email: true,
        userId: true,
        tenantId: true,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Personal no encontrado' },
        { status: 404 }
      );
    }

    if (staff.tenantId !== tenant.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para invitar a este personal' },
        { status: 403 }
      );
    }

    if (!staff.email) {
      return NextResponse.json(
        { error: 'El personal no tiene email configurado' },
        { status: 400 }
      );
    }

    if (staff.userId) {
      return NextResponse.json(
        { error: 'El personal ya tiene una cuenta vinculada' },
        { status: 400 }
      );
    }

    // Check for existing invitation
    const existingInvitation = await getInvitationForStaff(staffId);
    const isResend = existingInvitation?.status === 'PENDING';

    // Send invitation email
    const result = await sendStaffInvitationEmail({
      staffId,
      tenantId: tenant.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invitationId: result.invitationId,
      message: isResend
        ? 'Invitación reenviada exitosamente'
        : 'Invitación enviada exitosamente',
      staffName: staff.name,
      email: staff.email,
    });
  } catch (error) {
    console.error('[API /invitations/send] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Access denied')) {
        return NextResponse.json(
          { error: 'No tienes permiso para enviar invitaciones' },
          { status: 403 }
        );
      }
      if (error.message.includes('No authenticated')) {
        return NextResponse.json(
          { error: 'Debes iniciar sesión' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
