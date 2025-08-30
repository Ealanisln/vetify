import * as Sentry from '@sentry/nextjs';

// Get DSN from environment variables (use the same variable as client for consistency)
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

// Only initialize Sentry if DSN is provided and valid
if (DSN && DSN !== 'https://your-dsn@o000000.ingest.sentry.io/0000000') {
  Sentry.init({
    dsn: DSN,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Debug mode controlled by environment variable
    debug: process.env.SENTRY_DEBUG === 'true',
    
    // Set log level based on environment variable or default to error
    logLevel: process.env.SENTRY_LOG_LEVEL || 'error',
    
    // Additional metadata
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || 'vetify-dev-local',
    serverName: process.env.VERCEL_REGION || 'edge',
    
    // Initial scope with platform context
    initialScope: {
      tags: {
        component: 'edge',
        platform: 'veterinary',
        version: '1.0.0',
      },
    },
  });
} else {
  // Log that Sentry is not initialized due to missing DSN
  if (process.env.NODE_ENV === 'development') {
    console.warn('Sentry edge not initialized: Missing or invalid DSN');
    console.warn('To enable Sentry, add your DSN to .env.local:');
    console.warn('NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@o000000.ingest.sentry.io/0000000');
  }
}
