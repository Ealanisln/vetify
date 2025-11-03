import { prisma, setRLSTenantId } from '../../prisma';
import { serializeUser } from '../../serializers';
import { UserWithTenant } from "@/types";

export interface CreateOrUpdateUserData {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string;
}

/**
 * Find or create a user based on Kinde authentication data
 * Handles concurrent requests gracefully using upsert
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

    // If user exists, update basic info and return with tenant
    if (existingUser) {
      const updatedUser = await prisma.user.update({
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

      // Set RLS tenant ID if user has a tenant (for subsequent queries)
      if (updatedUser.tenantId) {
        try {
          await setRLSTenantId(updatedUser.tenantId);
        } catch (rlsError) {
          console.warn('Failed to set RLS tenant ID:', rlsError);
          // Continue without RLS - not critical for auth
        }
      }

      return serializeUser(updatedUser);
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
          // Set RLS tenant ID if user has a tenant
          if (user.tenantId) {
            try {
              await setRLSTenantId(user.tenantId);
            } catch (rlsError) {
              console.warn('Failed to set RLS tenant ID:', rlsError);
            }
          }

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

    // Set RLS tenant ID if user has a tenant (for subsequent queries)
    if (user.tenantId) {
      try {
        await setRLSTenantId(user.tenantId);
      } catch (rlsError) {
        console.warn('Failed to set RLS tenant ID:', rlsError);
        // Continue without RLS - not critical for user lookup
      }
    }

    return serializeUser(user);
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw new Error(`Failed to find user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 