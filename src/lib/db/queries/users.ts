import { prisma } from '../../prisma';
import { serializeUser } from '../../serializers';
import { UserWithTenant } from "@/types";
import { getPendingInvitationByEmail } from '@/lib/invitations/invitation-token';

/**
 * Auto-accept a pending invitation for a user.
 * This links the user to the staff record and tenant.
 *
 * @param userId - The user ID to link
 * @param email - The user's email to find matching invitations
 * @returns Updated user with tenant or null if no invitation found
 */
async function autoAcceptPendingInvitation(userId: string, email: string) {
  try {
    const invitation = await getPendingInvitationByEmail(email);

    if (!invitation || !invitation.staff) {
      return null;
    }

    // Check if staff is already linked to a user
    const existingStaff = await prisma.staff.findUnique({
      where: { id: invitation.staff.id },
      select: { userId: true },
    });

    if (existingStaff?.userId) {
      return null;
    }

    // Perform auto-accept in a transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Update User with tenant ID
      const user = await tx.user.update({
        where: { id: userId },
        data: { tenantId: invitation.tenantId },
        include: {
          tenant: {
            include: {
              tenantSubscription: {
                include: { plan: true }
              }
            }
          }
        }
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

      return user;
    });

    return updatedUser;
  } catch (error) {
    console.error('[AutoAccept] Error auto-accepting invitation:', error);
    return null;
  }
}

export interface CreateOrUpdateUserData {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string;
}

/**
 * Check if user data has changed and needs updating
 * PERFORMANCE OPTIMIZATION: Only trigger updates when data actually changed
 * @exported for unit testing
 */
export function userDataNeedsUpdate(
  existingUser: { email: string; firstName: string | null; lastName: string | null; name: string | null; isActive: boolean },
  newData: { email: string; firstName?: string | null; lastName?: string | null; name?: string }
): boolean {
  const computedName = newData.name || `${newData.firstName || ''} ${newData.lastName || ''}`.trim() || newData.email.split('@')[0];

  return (
    existingUser.email !== newData.email ||
    existingUser.firstName !== (newData.firstName ?? null) ||
    existingUser.lastName !== (newData.lastName ?? null) ||
    existingUser.name !== computedName ||
    !existingUser.isActive
  );
}

/**
 * Find or create a user based on Kinde authentication data
 * Handles concurrent requests gracefully using upsert
 *
 * PERFORMANCE OPTIMIZED: Only updates user if data has actually changed
 *
 * @param data - User data from Kinde
 * @returns User with tenant information
 * @throws {Error} If Kinde data is invalid
 */
export async function findOrCreateUser(data: CreateOrUpdateUserData): Promise<UserWithTenant> {
  const { id, email, firstName, lastName, name } = data;

  // Validate required fields
  if (!id || !email) {
    throw new Error('User ID and email are required');
  }

  try {
    // Optimized: Fetch user WITH tenant in single query using include
    // This avoids separate RLS configuration and tenant query
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            tenantSubscription: {
              include: { plan: true }
            }
          }
        }
      }
    });

    // If user exists, only update if data has changed (PERFORMANCE: skip unnecessary writes)
    if (existingUser) {
      const needsUpdate = userDataNeedsUpdate(existingUser, { email, firstName, lastName, name });

      let userToReturn = existingUser;

      // Only perform UPDATE if data has actually changed
      if (needsUpdate) {
        userToReturn = await prisma.user.update({
          where: { id },
          data: {
            email,
            firstName,
            lastName,
            name: name || `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
            isActive: true,
          },
          include: {
            tenant: {
              include: {
                tenantSubscription: {
                  include: { plan: true }
                }
              }
            }
          }
        });
      }

      // If user doesn't have a tenant, check for pending invitations
      if (!userToReturn.tenantId) {
        const linkedUser = await autoAcceptPendingInvitation(id, email);
        if (linkedUser) {
          return serializeUser(linkedUser);
        }
      }

      return serializeUser(userToReturn);
    }

    // If user doesn't exist, try to create
    try {
      const newUser = await prisma.user.create({
        data: {
          id,
          email,
          firstName,
          lastName,
          name: name || `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
          isActive: true,
          tenantId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Check for pending invitations for new users
      const linkedUser = await autoAcceptPendingInvitation(id, email);
      if (linkedUser) {
        return serializeUser(linkedUser);
      }

      // New users don't have tenant yet (will be set during onboarding)
      return serializeUser({
        ...newUser,
        tenant: null,
      });
    } catch (createError: unknown) {
      // Handle race condition: if create fails due to duplicate, fetch the existing user
      if (createError && typeof createError === 'object' && 'code' in createError && createError.code === 'P2002') {
        const user = await prisma.user.findUnique({
          where: { id },
          include: {
            tenant: {
              include: {
                tenantSubscription: {
                  include: { plan: true }
                }
              }
            }
          }
        });

        if (user) {
          return serializeUser(user);
        }
      }
      throw createError;
    }
  } catch (error) {
    console.error('Error in findOrCreateUser:', error);
    throw new Error(`Failed to find or create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Find user by ID with tenant information
 *
 * @param userId - User ID to find
 * @returns User with tenant information or null if not found
 */
export async function findUserById(userId: string): Promise<UserWithTenant | null> {
  try {
    // Optimized: Fetch user WITH tenant in single query
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          include: {
            tenantSubscription: {
              include: { plan: true }
            }
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    return serializeUser(user);
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw new Error(`Failed to find user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 