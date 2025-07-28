import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { serializeTenant } from "./serializers";
import { findOrCreateUser, findUserById } from "./db/queries/users";
import { UserWithTenant } from "@/types";

export async function getAuthenticatedUser(): Promise<UserWithTenant> {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();
  
  if (!kindeUser) {
    throw new Error('No authenticated user');
  }

  // Use centralized findOrCreateUser function to handle concurrent requests
  return findOrCreateUser({
    id: kindeUser.id,
    email: kindeUser.email || '',
    firstName: kindeUser.given_name,
    lastName: kindeUser.family_name,
    name: `${kindeUser.given_name || ''} ${kindeUser.family_name || ''}`.trim(),
  });
}

export async function getTenantForUser(userId: string) {
  const user = await findUserById(userId);
  
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