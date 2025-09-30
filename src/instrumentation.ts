// Instrumentation disabled temporarily - Sentry was interfering with CSS loading on Vercel
// To re-enable Sentry:
// 1. Uncomment the withSentryConfig wrapper in next.config.js
// 2. Uncomment the code below
// 3. Ensure Sentry environment variables are set in Vercel

// import * as Sentry from '@sentry/nextjs';

export function register() {
  // Placeholder - Sentry disabled
}

// export const onRequestError = Sentry.captureRequestError;
