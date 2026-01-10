/**
 * Staff Invitation Email Service
 *
 * Handles sending invitation emails to staff members.
 */

import { sendEmail } from '@/lib/email/email-service';
import type { StaffInvitationData } from '@/lib/email/types';
import { generateStaffInvitation } from './invitation-token';
import { prisma } from '@/lib/prisma';

// =============================================================================
// CONSTANTS
// =============================================================================

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const DEFAULT_EXPIRATION_DAYS = 7;

// =============================================================================
// MAIN FUNCTION
// =============================================================================

interface SendStaffInvitationParams {
  staffId: string;
  tenantId: string;
}

interface SendStaffInvitationResult {
  success: boolean;
  invitationId?: string;
  error?: string;
}

/**
 * Send an invitation email to a staff member.
 *
 * This function:
 * 1. Fetches staff and tenant details
 * 2. Generates or reuses an invitation token
 * 3. Sends the invitation email
 *
 * @param params - Staff ID and Tenant ID
 * @returns Result with invitation ID or error
 */
export async function sendStaffInvitationEmail(
  params: SendStaffInvitationParams
): Promise<SendStaffInvitationResult> {
  const { staffId, tenantId } = params;

  try {
    // Fetch staff details
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        userId: true,
        tenantId: true,
      },
    });

    if (!staff) {
      return { success: false, error: 'Personal no encontrado' };
    }

    if (!staff.email) {
      return { success: false, error: 'El personal no tiene email configurado' };
    }

    if (staff.userId) {
      return { success: false, error: 'El personal ya tiene una cuenta vinculada' };
    }

    if (staff.tenantId !== tenantId) {
      return { success: false, error: 'El personal no pertenece a esta clínica' };
    }

    // Fetch tenant details
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!tenant) {
      return { success: false, error: 'Clínica no encontrada' };
    }

    // Generate invitation token
    const invitation = await generateStaffInvitation(
      staffId,
      staff.email,
      tenantId,
      staff.position,
      DEFAULT_EXPIRATION_DAYS
    );

    // Build invite URL
    const inviteUrl = `${APP_URL}/invite?token=${invitation.token}`;

    // Prepare email data
    const emailData: StaffInvitationData = {
      to: {
        email: staff.email,
        name: staff.name,
      },
      subject: `${tenant.name} te ha invitado a unirte al equipo`,
      tenantId,
      template: 'staff-invitation',
      data: {
        staffName: staff.name,
        clinicName: tenant.name,
        position: staff.position,
        inviteUrl,
        expirationDays: DEFAULT_EXPIRATION_DAYS,
      },
    };

    // Send email
    const result = await sendEmail(emailData);

    if (!result.success) {
      console.error('[StaffInvitation] Failed to send email:', result.error);
      return { success: false, error: 'Error al enviar el email de invitación' };
    }

    console.log(`[StaffInvitation] Email sent successfully to ${staff.email}`);

    return {
      success: true,
      invitationId: invitation.id,
    };
  } catch (error) {
    console.error('[StaffInvitation] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Resend an invitation email.
 * Generates a new token with fresh expiration.
 */
export async function resendStaffInvitation(
  staffId: string,
  tenantId: string
): Promise<SendStaffInvitationResult> {
  return sendStaffInvitationEmail({ staffId, tenantId });
}
