'use client';

// This component loads Sentry client configuration
// It runs only on the client side to avoid server-side issues
import { useEffect } from 'react';

export function SentryInit() {
  useEffect(() => {
    // Dynamically import Sentry client config only on client side
    import('../../sentry.client.config');
  }, []);

  return null; // This component doesn't render anything
}
