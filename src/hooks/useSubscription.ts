'use client';

import { useEffect, useState } from 'react';
import type { Tenant } from '@prisma/client';

export function useSubscription(tenant: Tenant | null) {
  const [isActive, setIsActive] = useState(false);
  const [isTrialing, setIsTrialing] = useState(false);
  const [isPastDue, setIsPastDue] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);
  const [planName, setPlanName] = useState<string | null>(null);
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<Date | null>(null);

  useEffect(() => {
    if (tenant) {
      setIsActive(tenant.subscriptionStatus === 'ACTIVE');
      setIsTrialing(tenant.subscriptionStatus === 'TRIALING');
      setIsPastDue(tenant.subscriptionStatus === 'PAST_DUE');
      setIsCanceled(tenant.subscriptionStatus === 'CANCELED');
      setPlanName(tenant.planName);
      
      // HOTFIX: Use trialEndsAt for trial periods, subscriptionEndsAt for paid subscriptions
      if (tenant.isTrialPeriod && tenant.trialEndsAt) {
        setSubscriptionEndsAt(tenant.trialEndsAt);
      } else {
        setSubscriptionEndsAt(tenant.subscriptionEndsAt);
      }
    }
  }, [tenant]);

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

  return {
    isActive,
    isTrialing,
    isPastDue,
    isCanceled,
    planName,
    subscriptionEndsAt,
    isPaidSubscriptionExpired,
    hasActiveSubscription: (isActive && !isPaidSubscriptionExpired) || isTrialing,
    needsPayment: isPastDue || isCanceled,
    isInTrial: isTrialing && tenant?.isTrialPeriod,
    subscriptionStatus: tenant?.subscriptionStatus || 'INACTIVE'
  };
} 