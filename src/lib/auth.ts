import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";
import { serializeUser, serializeTenant } from "./serializers";

export async function getAuthenticatedUser() {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();
  
  if (!kindeUser) {
    throw new Error('No authenticated user');
  }

  // Buscar o crear usuario en tu DB
  let user = await prisma.user.findUnique({
    where: { id: kindeUser.id },
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
    // Crear usuario si no existe
    user = await prisma.user.create({
      data: {
        id: kindeUser.id,
        email: kindeUser.email || '',
        firstName: kindeUser.given_name,
        lastName: kindeUser.family_name,
        name: `${kindeUser.given_name || ''} ${kindeUser.family_name || ''}`.trim(),
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

  // Serialize the user data to convert Decimal fields to numbers
  return serializeUser(user);
}

export async function getTenantForUser(userId: string) {
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

  // Serialize the tenant data to convert Decimal fields to numbers
  return serializeTenant(user?.tenant);
}

/**
 * Check if user needs to complete onboarding (i.e., doesn't have a tenant)
 */
export async function checkUserNeedsOnboarding() {
  const user = await getAuthenticatedUser();
  return !user?.tenant;
}

/**
 * Check if user is a super admin (Vetify employee)
 * @deprecated Use isSuperAdmin from super-admin.ts instead
 */
export function isAdmin(email: string): boolean {
  return email.endsWith('@vetify.pro') || email.endsWith('@vetify.com') || email.endsWith('@alanis.dev');
}

/**
 * Require super admin access
 * @deprecated Use requireSuperAdmin from super-admin.ts instead
 */
export async function requireAdmin() {
  const user = await getAuthenticatedUser();
  
  if (!isAdmin(user.email)) {
    throw new Error('Access denied. Admin privileges required.');
  }
  
  return { user };
}

/**
 * Require authentication and tenant. If user doesn't have a tenant, redirect to onboarding.
 */
export async function requireAuth() {
  const user = await getAuthenticatedUser();
  
  if (!user?.tenant) {
    // Redirect to onboarding if user doesn't have a tenant
    redirect('/onboarding');
  }
  
  return { user, tenant: user.tenant };
}

/**
 * Get authenticated user and tenant, but allow users without tenants (for onboarding flow)
 */
export async function getAuthenticatedUserWithOptionalTenant() {
  const user = await getAuthenticatedUser();
  return { user, tenant: user?.tenant };
} 