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
    // Step 1: Find the user WITHOUT tenant relations (to avoid RLS blocking)
    // User table has permissive RLS policy, so this will work
    const existingUser = await prisma.user.findUnique({
      where: { id },
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

    // If user exists, update basic info
    if (existingUser) {
      const updatedUserBasic = await prisma.user.update({
        where: { id },
        data: {
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

      // Step 2: If user has a tenant, configure RLS and load tenant data
      if (updatedUserBasic.tenantId) {
        try {
          await setRLSTenantId(updatedUserBasic.tenantId);

          // Now we can safely load the tenant with RLS context set
          const tenant = await prisma.tenant.findUnique({
            where: { id: updatedUserBasic.tenantId },
            include: {
              tenantSubscription: { include: { plan: true } },
            },
          });

          return serializeUser({
            ...updatedUserBasic,
            tenant: tenant || null,
          });
        } catch (rlsError) {
          console.warn('Failed to load tenant with RLS:', rlsError);
          // If RLS fails, return user without tenant data
          return serializeUser({
            ...updatedUserBasic,
            tenant: null,
          });
        }
      }

      // User exists but has no tenant (onboarding not complete)
      return serializeUser({
        ...updatedUserBasic,
        tenant: null,
      });
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

        if (user) {
          // If user has tenant, configure RLS and load it
          if (user.tenantId) {
            try {
              await setRLSTenantId(user.tenantId);
              const tenant = await prisma.tenant.findUnique({
                where: { id: user.tenantId },
                include: {
                  tenantSubscription: { include: { plan: true } },
                },
              });

              return serializeUser({
                ...user,
                tenant: tenant || null,
              });
            } catch (rlsError) {
              console.warn('Failed to load tenant with RLS:', rlsError);
            }
          }

          return serializeUser({
            ...user,
            tenant: null,
          });
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
    // Step 1: Find user without tenant relations (avoids RLS blocking)
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return null;
    }

    // Step 2: If user has tenant, configure RLS and load tenant
    if (user.tenantId) {
      try {
        await setRLSTenantId(user.tenantId);
        const tenant = await prisma.tenant.findUnique({
          where: { id: user.tenantId },
          include: {
            tenantSubscription: {
              include: { plan: true }
            }
          }
        });

        return serializeUser({
          ...user,
          tenant: tenant || null,
        });
      } catch (rlsError) {
        console.warn('Failed to load tenant with RLS:', rlsError);
        return serializeUser({
          ...user,
          tenant: null,
        });
      }
    }

    // User exists but has no tenant
    return serializeUser({
      ...user,
      tenant: null,
    });
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw new Error(`Failed to find user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 