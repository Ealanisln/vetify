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
 */
export async function checkFeatureAccess(feature: string): Promise<boolean> {
  try {
    const status = await getSubscriptionStatus();

    if (!status) {
      return false;
    }

    // Active paid subscriptions have access to everything
    if (status.isActive && !status.isTrialPeriod) {
      return true;
    }

    // Trial users have access to basic features
    if (status.isTrialPeriod && status.isActive) {
      // Premium features require paid subscription
      const premiumFeatures = ['inventory', 'reports', 'automations'];
      return !premiumFeatures.includes(feature);
    }

    return false;
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
