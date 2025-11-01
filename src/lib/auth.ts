import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { serializeTenant, serializeUser } from "./serializers";
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
 * Returns user and tenant with all Decimal fields serialized to numbers.
 */
export async function requireAuth() {
  const user = await getAuthenticatedUser();

  if (!user?.tenant) {
    // Redirect to onboarding if user doesn't have a tenant
    redirect('/onboarding');
  }

  // Explicitly serialize both user and tenant to ensure Decimal fields are converted to plain numbers
  // and all functions/methods are removed. This is critical because Next.js cannot pass Decimal objects
  // or functions from server to client components
  // Use JSON round-trip to force complete serialization and remove any Prisma-specific types
  const serializedTenant = serializeTenant(user.tenant);
  const serializedUser = serializeUser(user);

  // Final JSON round-trip to ensure absolutely no functions remain
  const tenant = JSON.parse(JSON.stringify(serializedTenant));
  const cleanUser = JSON.parse(JSON.stringify(serializedUser));

  return { user: cleanUser, tenant };
}

/**
 * Get authenticated user and tenant, but allow users without tenants (for onboarding flow)
 * Returns tenant with all Decimal fields serialized to numbers if present.
 */
export async function getAuthenticatedUserWithOptionalTenant() {
  const user = await getAuthenticatedUser();

  // Serialize both user and tenant if present
  const serializedUser = serializeUser(user);
  const serializedTenant = user?.tenant ? serializeTenant(user.tenant) : null;

  // Final JSON round-trip to ensure absolutely no functions remain
  const cleanUser = JSON.parse(JSON.stringify(serializedUser));
  const cleanTenant = serializedTenant ? JSON.parse(JSON.stringify(serializedTenant)) : null;

  return { user: cleanUser, tenant: cleanTenant };
}

/**
 * Check if tenant has an active subscription or valid trial period
 * @returns true if tenant can access premium features, false otherwise
 */
export function hasActiveSubscription(tenant: {
  subscriptionStatus: string;
  isTrialPeriod: boolean;
  trialEndsAt: Date | string | null;
}): boolean {
  // Has active paid subscription (not in trial)
  if (tenant.subscriptionStatus === 'ACTIVE' && !tenant.isTrialPeriod) {
    return true;
  }

  // In trial period - check if trial has expired
  if (tenant.isTrialPeriod && tenant.trialEndsAt) {
    const trialEnd = new Date(tenant.trialEndsAt);
    const now = new Date();

    // Trial is still valid if trialEndsAt is in the future
    if (trialEnd > now && tenant.subscriptionStatus === 'TRIALING') {
      return true;
    }
  }

  return false;
}

/**
 * Require active subscription (paid or valid trial).
 * If subscription is not active or trial expired, redirect to pricing page.
 *
 * Use this in pages/API routes that require active subscription.
 *
 * @example
 * ```typescript
 * export default async function PetsPage() {
 *   const { user, tenant } = await requireActiveSubscription();
 *   // ... rest of page logic
 * }
 * ```
 */
export async function requireActiveSubscription() {
  const { user, tenant } = await requireAuth();

  if (!hasActiveSubscription(tenant)) {
    redirect('/dashboard/settings?tab=subscription&reason=trial_expired');
  }

  return { user, tenant };
} 