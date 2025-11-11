/**
 * Meta Pixel Provider
 *
 * This component initializes the Meta Pixel and tracks page views automatically
 * when the user navigates through the application.
 *
 * It should be added to the provider hierarchy in app/providers.tsx
 */

'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initMetaPixel, trackPageView } from '@/lib/analytics/meta-pixel';
import { isTrackingEnabled } from '@/lib/analytics/privacy';

interface MetaPixelProviderProps {
  children: React.ReactNode;
}

export function MetaPixelProvider({ children }: MetaPixelProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize pixel on mount
  useEffect(() => {
    if (!isTrackingEnabled()) {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          '[Meta Pixel] Tracking disabled in development. ' +
            'Set NEXT_PUBLIC_META_PIXEL_DEBUG=true to enable.'
        );
      }
      return;
    }

    // Wait a bit for the pixel script to load
    const timer = setTimeout(() => {
      try {
        const initialized = initMetaPixel();

        if (initialized) {
          // Track initial page view
          trackPageView();
        }
      } catch (error) {
        // Log error but don't crash the app if pixel initialization fails
        console.error('[Meta Pixel] Initialization error:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (!isTrackingEnabled()) {
      return;
    }

    try {
      // Track page view when route changes
      trackPageView();
    } catch (error) {
      // Log error but don't crash the app if page view tracking fails
      console.error('[Meta Pixel] Page view tracking error:', error);
    }
  }, [pathname, searchParams]);

  // This provider doesn't render anything visual, just returns children
  return <>{children}</>;
}
