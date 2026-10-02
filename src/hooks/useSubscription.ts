'use client';

import type { Tenant } from '@prisma/client';

// The tenant coming from requireAuth/requirePermission includes the
// TenantSubscription relation; Prisma's base Tenant type does not.
export type TenantWithSubscriptionFlags = Tenant & {
  tenantSubscription?: { cancelAtPeriodEnd?: boolean } | null;
};

export function useSubscription(tenant: TenantWithSubscriptionFlags | null) {
  // Pure derivations from `tenant`, computed during render so the server render
  // and the first client paint already reflect the real status.
  const status = tenant?.subscriptionStatus;
  const isActive = status === 'ACTIVE';
  const isTrialing = status === 'TRIALING';
  const isPastDue = status === 'PAST_DUE';
  const isCanceled = status === 'CANCELED';
  const planName = tenant?.planName ?? null;

  // HOTFIX: Use trialEndsAt for trial periods, subscriptionEndsAt for paid subscriptions
  const subscriptionEndsAt: Date | null = !tenant
    ? null
    : tenant.isTrialPeriod && tenant.trialEndsAt
      ? tenant.trialEndsAt
      : tenant.subscriptionEndsAt;

  // Check if a paid subscription (status ACTIVE, not trial) has expired beyond the 7-day grace period.
  // This mirrors the server-side check in auth.ts hasActiveSubscription().
  const isPaidSubscriptionExpired = (() => {
    if (!tenant || tenant.isTrialPeriod) return false;
    if (tenant.subscriptionStatus !== 'ACTIVE') return false;
    if (!tenant.subscriptionEndsAt) return false;
    const endsAt = new Date(tenant.subscriptionEndsAt);
    const now = new Date();
    const gracePeriodMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    return endsAt.getTime() + gracePeriodMs < now.getTime();
  })();

  // Stripe keeps the subscription ACTIVE with cancel_at_period_end=true until
  // the period ends; surface that window so the UI can show it before the
  // status flips to CANCELED.
  const isCancelScheduled =
    tenant?.subscriptionStatus === 'ACTIVE' &&
    tenant?.tenantSubscription?.cancelAtPeriodEnd === true;

  return {
    isActive,
    isTrialing,
    isPastDue,
    isCanceled,
    isCancelScheduled,
    planName,
    subscriptionEndsAt,
    isPaidSubscriptionExpired,
    hasActiveSubscription: (isActive && !isPaidSubscriptionExpired) || isTrialing,
    needsPayment: isPastDue || isCanceled,
    isInTrial: isTrialing && tenant?.isTrialPeriod,
    subscriptionStatus: tenant?.subscriptionStatus || 'INACTIVE'
  };
} 