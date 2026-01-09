'use client';

import { useEffect, useRef } from 'react';
import { trackPageView } from '@/lib/analytics/landing-tracker';

interface AnalyticsTrackerProps {
  tenantSlug: string;
  pageSlug: string;
}

/**
 * Analytics Tracker Component
 *
 * Place this component in clinic landing pages to automatically
 * track page views. It fires once on mount.
 *
 * Usage:
 * <AnalyticsTracker tenantSlug="mi-clinica" pageSlug="landing" />
 */
export function AnalyticsTracker({ tenantSlug, pageSlug }: AnalyticsTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per component instance
    if (hasTracked.current) return;
    hasTracked.current = true;

    // Track the page view
    trackPageView(tenantSlug, pageSlug);
  }, [tenantSlug, pageSlug]);

  // This component doesn't render anything
  return null;
}

export default AnalyticsTracker;
