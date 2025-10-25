'use server';

import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '@/lib/prisma';
import { calculateTrialStatus } from '@/lib/trial/utils';

export interface SubscriptionStatus {
  isActive: boolean;
  planType: string | null;
  planName: string | null;
  status: string;
  renewalDate: Date | null;
  isTrialPeriod: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number | null;
}

/**
 * Get comprehensive subscription status for the current user's tenant
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();

    if (!(await isAuthenticated())) {
      return null;
    }

    const user = await getUser();
    if (!user?.id) {
      return null;
    }

    // Get user's tenant with subscription info
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        tenant: {
          include: {
            tenantSubscription: {
              include: {
                plan: true
              }
            }
          }
        }
      }
    });

    if (!dbUser?.tenant) {
      return null;
    }

    const tenant = dbUser.tenant;
    const subscription = tenant.tenantSubscription;

    // Check if has active paid subscription
    const hasActiveSubscription = tenant.subscriptionStatus === 'ACTIVE' && !tenant.isTrialPeriod;

    // Calculate trial status if in trial period
    let daysRemaining: number | null = null;
    if (tenant.isTrialPeriod && tenant.trialEndsAt) {
      const trialStatus = calculateTrialStatus(tenant);
      daysRemaining = trialStatus.daysRemaining;
    }

    return {
      isActive: hasActiveSubscription || (tenant.isTrialPeriod && tenant.subscriptionStatus === 'TRIALING'),
      planType: String(tenant.planType) || null,
      planName: subscription?.plan?.name || tenant.planName || null,
      status: String(tenant.subscriptionStatus),
      renewalDate: subscription?.currentPeriodEnd || tenant.subscriptionEndsAt || null,
      isTrialPeriod: tenant.isTrialPeriod,
      trialEndsAt: tenant.trialEndsAt,
      daysRemaining
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return null;
  }
}

/**
 * Check if a specific feature is accessible with current subscription
 * Now uses plan-limits.ts logic to check actual plan features
 */
export async function checkFeatureAccess(feature: string): Promise<boolean> {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();

    if (!(await isAuthenticated())) {
      return false;
    }

    const user = await getUser();
    if (!user?.id) {
      return false;
    }

    // Get user's tenant
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        tenant: {
          include: {
            tenantSubscription: {
              include: {
                plan: true
              }
            }
          }
        }
      }
    });

    if (!dbUser?.tenant) {
      return false;
    }

    const tenant = dbUser.tenant;
    const subscription = tenant.tenantSubscription;

    // If no subscription, user is in trial with basic plan limits
    if (!subscription?.plan) {
      // Trial users have basic plan features (no advanced features)
      const trialRestrictedFeatures = ['advancedInventory', 'advancedReports', 'multiLocation', 'automations', 'apiAccess'];
      return !trialRestrictedFeatures.includes(feature);
    }

    // Check plan features from database
    const planFeatures = subscription.plan.features as Record<string, boolean | number | undefined>;

    switch (feature) {
      case 'advancedReports':
        return planFeatures?.advancedReports === true;
      case 'advancedInventory':
        return planFeatures?.advancedInventory === true;
      case 'multiLocation':
        return planFeatures?.multiLocation === true;
      case 'automations':
        return planFeatures?.automations === true;
      case 'apiAccess':
        return planFeatures?.apiAccess === true;
      case 'multiDoctor':
        return planFeatures?.multiDoctor === true;
      case 'smsReminders':
        return planFeatures?.smsReminders === true;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

/**
 * Check if user requires an active plan to access a feature
 * Returns redirect URL if access denied
 */
export async function requireActivePlan(): Promise<{ allowed: boolean; redirectTo?: string }> {
  try {
    const status = await getSubscriptionStatus();

    if (!status) {
      return {
        allowed: false,
        redirectTo: '/api/auth/login'
      };
    }

    if (!status.isActive) {
      return {
        allowed: false,
        redirectTo: '/dashboard/settings?tab=subscription&reason=no_plan'
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking plan requirement:', error);
    return {
      allowed: false,
      redirectTo: '/dashboard/settings?tab=subscription'
    };
  }
}
