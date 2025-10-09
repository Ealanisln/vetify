'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component to guard protected content that requires an active subscription
 * Redirects to subscription settings if no active plan
 */
export function SubscriptionGuard({ children, fallback }: SubscriptionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isActive, isLoading } = useSubscriptionStatus();

  useEffect(() => {
    if (!isLoading && !isActive) {
      router.push(
        `/dashboard/settings?tab=subscription&redirect=${encodeURIComponent(pathname)}&reason=no_plan`
      );
    }
  }, [isActive, isLoading, pathname, router]);

  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )
    );
  }

  if (!isActive) {
    return null;
  }

  return <>{children}</>;
}
