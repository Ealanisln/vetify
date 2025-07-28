import { prisma } from "@/lib/prisma";
import { serializeUser } from "@/lib/serializers";
import { UserWithTenant } from "@/types";
import { Prisma } from '@prisma/client';

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
    const user = await prisma.user.upsert({
      where: { id },
      update: {
        email,
        firstName,
        lastName,
        name: name || `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
        isActive: true,
      },
      create: {
        id,
        email,
        firstName,
        lastName,
        name: name || `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
        isActive: true,
      },
      include: {
        tenant: {
          include: {
            tenantSubscription: { include: { plan: true } },
          },
        },
      },
    });

    return serializeUser(user);
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

    return user ? serializeUser(user) : null;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw new Error(`Failed to find user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 