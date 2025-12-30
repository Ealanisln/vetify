'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getSubscriptionStatus,
  type SubscriptionStatus
} from '@/app/actions/subscription';

/**
 * Hook to check and manage subscription status
 * Fetches subscription status from the server and provides helpers
 * Auto-refreshes when returning from Stripe portal
 */
export function useSubscriptionStatus() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // PERFORMANCE FIX: Use ref instead of state for retry count to avoid infinite loop
  // Previously retryCount was in useCallback deps, causing callback recreation and infinite re-renders
  const retryCountRef = useRef(0);

  // Fetch subscription status with retry logic
  const fetchStatus = useCallback(async (isRetry = false) => {
    try {
      const data = await getSubscriptionStatus();
      setStatus(data);
      setError(null);
      retryCountRef.current = 0;
      return data;
    } catch (err) {
      console.error('Error fetching subscription status:', err);
      setError(err as Error);

      // Retry once after 2 seconds if first attempt fails
      if (!isRetry && retryCountRef.current < 1) {
        retryCountRef.current += 1;
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchStatus(true);
      }
      throw err;
    }
  }, []); // Empty deps - fetchStatus is now stable

  // Initial load and auto-refresh on portal return
  useEffect(() => {
    const fromPortal = searchParams.get('from_portal');

    setIsLoading(true);
    fetchStatus()
      .finally(() => {
        setIsLoading(false);

        // Clean up URL parameter after refresh
        if (fromPortal) {
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.delete('from_portal');
          window.history.replaceState({}, '', currentUrl.toString());
        }
      });
  }, [searchParams, fetchStatus]);

  const requireActivePlan = (redirectTo: string = '/dashboard/settings?tab=subscription') => {
    if (!status?.isActive && !isLoading) {
      router.push(redirectTo);
      return false;
    }
    return true;
  };

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchStatus();
      return data;
    } catch (err) {
      console.error('Error refreshing subscription status:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus]);

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
