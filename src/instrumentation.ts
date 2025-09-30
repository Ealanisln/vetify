import * as Sentry from '@sentry/nextjs';

// For Next.js 15, Sentry instrumentation is handled automatically by the next.config.js
// This file can be minimal or empty - the Sentry Next.js plugin handles everything

// Only register if we're in development and need custom instrumentation

// Export required function to satisfy Next.js instrumentation requirement
export function register() {
  // This is called by Next.js when the instrumentation is loaded
  // Sentry initialization is handled by the withSentryConfig wrapper in next.config.js
}

// Add the missing onRequestError hook for Sentry
export const onRequestError = Sentry.captureRequestError;
