'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Umami Analytics Script Component
 *
 * This component conditionally loads Umami Analytics, excluding certain pages
 * that may have conflicts with the analytics script processing JSON-LD.
 *
 * Known issue: Umami's script processes JSON-LD structured data and can throw
 * "undefined is not an object (evaluating 'r["@context"].toLowerCase')" on pages
 * with complex authentication flows like /invite.
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
