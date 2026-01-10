/**
 * Staff Invitation Token Management
 *
 * Handles generation, validation, and acceptance of staff invitations.
 * Invitations link new users to existing Staff records in the tenant.
 */

import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { addDays, isBefore } from 'date-fns';
import type { InviteStatus } from '@prisma/client';

// =============================================================================
// TYPES
// =============================================================================

export interface InvitationWithDetails {
  id: string;
  tenantId: string;
  staffId: string | null;
  email: string;
  roleKey: string;
  token: string;
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
  tenant: {
    id: string;
    name: string;
    logo: string | null;
  };
  staff: {
    id: string;
    name: string;
    position: string;
    email: string | null;
  } | null;
}

export type ValidationResult =
  | { valid: true; invitation: InvitationWithDetails }
  | { valid: false; reason: string };

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_EXPIRATION_DAYS = 7;
const TOKEN_LENGTH = 32;

// =============================================================================
// TOKEN GENERATION
// =============================================================================

/**
 * Generate a new staff invitation token or reuse an existing active one.
 *
 * @param staffId - The Staff record ID to link this invitation to
 * @param email - Email address of the staff member
 * @param tenantId - Tenant ID
 * @param position - Staff position/role (e.g., VETERINARIAN, RECEPTIONIST)
 * @param expirationDays - Number of days until expiration (default: 7)
 * @returns The invitation record
 */
export async function generateStaffInvitation(
  staffId: string,
  email: string,
  tenantId: string,
  position: string,
  expirationDays: number = DEFAULT_EXPIRATION_DAYS
) {
  const normalizedEmail = email.toLowerCase().trim();

  // Check for existing active invitation for this staff
  const existing = await prisma.tenantInvitation.findFirst({
    where: {
      staffId,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
  });

  if (existing) {
    // Update the existing invitation with new expiration
    return prisma.tenantInvitation.update({
      where: { id: existing.id },
      data: {
        expiresAt: addDays(new Date(), expirationDays),
        email: normalizedEmail, // Update email in case it changed
      },
    });
  }

  // Revoke any old invitations for this staff
  await prisma.tenantInvitation.updateMany({
    where: {
      staffId,
      status: 'PENDING',
    },
    data: {
      status: 'REVOKED',
    },
  });

  // Create new invitation
  const token = nanoid(TOKEN_LENGTH);
  const expiresAt = addDays(new Date(), expirationDays);

  return prisma.tenantInvitation.create({
    data: {
      tenantId,
      staffId,
      email: normalizedEmail,
      roleKey: position,
      token,
      status: 'PENDING',
      expiresAt,
    },
  });
}

// =============================================================================
// TOKEN VALIDATION
// =============================================================================

/**
 * Validate an invitation token.
 *
 * @param token - The invitation token to validate
 * @returns Validation result with invitation details or error reason
 */
export async function validateInvitation(token: string): Promise<ValidationResult> {
  const invitation = await prisma.tenantInvitation.findUnique({
    where: { token },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          logo: true,
        },
      },
      staff: {
        select: {
          id: true,
          name: true,
          position: true,
          email: true,
        },
      },
    },
  });

  if (!invitation) {
    return { valid: false, reason: 'Invitación no encontrada' };
  }

  if (invitation.status === 'ACCEPTED') {
    return { valid: false, reason: 'Esta invitación ya fue aceptada' };
  }

  if (invitation.status === 'REVOKED') {
    return { valid: false, reason: 'Esta invitación fue revocada' };
  }

  if (invitation.status === 'EXPIRED' || isBefore(invitation.expiresAt, new Date())) {
    // Mark as expired if not already
    if (invitation.status !== 'EXPIRED') {
      await prisma.tenantInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
    }
    return { valid: false, reason: 'Esta invitación ha expirado' };
  }

  return { valid: true, invitation: invitation as InvitationWithDetails };
}

// =============================================================================
// TOKEN ACCEPTANCE
// =============================================================================

/**
 * Accept an invitation and link the user to the staff record.
 *
 * This function:
 * 1. Validates the invitation
 * 2. Updates the User with the tenant ID
 * 3. Links the Staff record to the User
 * 4. Marks the invitation as accepted
 *
 * @param token - The invitation token
 * @param userId - The authenticated user's ID
 * @returns Success or error result
 */
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ success: true; staffId: string } | { success: false; error: string }> {
  const validation = await validateInvitation(token);

  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  const { invitation } = validation;

  // Verify staff exists and doesn't already have a user
  if (!invitation.staff) {
    return { success: false, error: 'El registro de personal no existe' };
  }

  // Check if staff is already linked to a user
  const existingStaff = await prisma.staff.findUnique({
    where: { id: invitation.staff.id },
    select: { userId: true },
  });

  if (existingStaff?.userId) {
    return { success: false, error: 'Este personal ya tiene una cuenta vinculada' };
  }

  // Perform all updates in a transaction
  await prisma.$transaction(async (tx) => {
    // 1. Update User with tenant ID
    await tx.user.update({
      where: { id: userId },
      data: { tenantId: invitation.tenantId },
    });

    // 2. Link Staff to User
    await tx.staff.update({
      where: { id: invitation.staff!.id },
      data: { userId },
    });

    // 3. Mark invitation as accepted
    await tx.tenantInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });
  });

  return { success: true, staffId: invitation.staff.id };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a pending invitation by email for a specific tenant.
 * Used during user login to auto-accept pending invitations.
 *
 * @param email - User's email address
 * @returns The pending invitation or null
 */
export async function getPendingInvitationByEmail(
  email: string
): Promise<InvitationWithDetails | null> {
  const normalizedEmail = email.toLowerCase().trim();

  const invitation = await prisma.tenantInvitation.findFirst({
    where: {
      email: normalizedEmail,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          logo: true,
        },
      },
      staff: {
        select: {
          id: true,
          name: true,
          position: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' }, // Get most recent
  });

  return invitation as InvitationWithDetails | null;
}

/**
 * Get invitation status for a staff member.
 *
 * @param staffId - Staff record ID
 * @returns Invitation info or null if no invitation exists
 */
export async function getInvitationForStaff(staffId: string) {
  return prisma.tenantInvitation.findFirst({
    where: { staffId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      createdAt: true,
    },
  });
}

/**
 * Revoke an invitation.
 *
 * @param invitationId - Invitation ID to revoke
 */
export async function revokeInvitation(invitationId: string) {
  return prisma.tenantInvitation.update({
    where: { id: invitationId },
    data: { status: 'REVOKED' },
  });
}

/**
 * Clean up expired invitations.
 * Should be called periodically via cron job.
 */
export async function cleanupExpiredInvitations() {
  const result = await prisma.tenantInvitation.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: new Date() },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  return result.count;
}
