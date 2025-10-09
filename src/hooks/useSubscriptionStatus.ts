'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getSubscriptionStatus,
  type SubscriptionStatus
} from '@/app/actions/subscription';

/**
 * Hook to check and manage subscription status
 * Fetches subscription status from the server and provides helpers
 */
export function useSubscriptionStatus() {
  const router = useRouter();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getSubscriptionStatus()
      .then((data) => {
        setStatus(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Error fetching subscription status:', err);
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const requireActivePlan = (redirectTo: string = '/dashboard/settings?tab=subscription') => {
    if (!status?.isActive && !isLoading) {
      router.push(redirectTo);
      return false;
    }
    return true;
  };

  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      const data = await getSubscriptionStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('Error refreshing subscription status:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    status,
    isLoading,
    error,
    isActive: status?.isActive ?? false,
    isTrialPeriod: status?.isTrialPeriod ?? false,
    planName: status?.planName,
    daysRemaining: status?.daysRemaining,
    requireActivePlan,
    refreshStatus
  };
}
