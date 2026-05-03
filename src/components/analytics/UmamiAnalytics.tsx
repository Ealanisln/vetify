'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Umami Analytics Script Component
 *
 * Conditionally loads Umami Analytics. The exclusion list below is for routes
 * where analytics is undesirable (auth flows, onboarding, etc.) — NOT for the
 * legacy `r["@context"].toLowerCase` JSON-LD parser crash, which was fixed at
 * the root in `StructuredData` (Sentry VETIFY-NEXTJS-1K) by emitting one
 * `<script type="application/ld+json">` per schema instead of bundling them
 * as an array. Routes can be removed from this list once their analytics
 * exclusion is no longer justified by auth/privacy concerns.
 */

// Pages where Umami should NOT be loaded to prevent conflicts
const EXCLUDED_PATHS = [
  '/invite',
  '/api/auth',
  '/onboarding',
  '/sign-in',
  '/sign-up',
];

export function UmamiAnalytics() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Only run on client after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render during SSR or before mount
  if (!mounted) {
    return null;
  }

  // Check if current path is excluded
  const isExcluded = EXCLUDED_PATHS.some(path => pathname?.startsWith(path));

  if (isExcluded) {
    return null;
  }

  return (
    <Script
      src="https://analytics.alanis.dev/script.js"
      data-website-id="a8982b40-5dc3-4a51-a17f-1cf53a2aecc4"
      strategy="lazyOnload"
    />
  );
}
