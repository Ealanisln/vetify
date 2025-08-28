import * as Sentry from '@sentry/nextjs';

// Get DSN from environment variables
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize Sentry if DSN is provided and valid
if (DSN && DSN !== 'https://your-dsn@o000000.ingest.sentry.io/0000000') {
  Sentry.init({
    dsn: DSN,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Debug mode for development
    debug: process.env.NODE_ENV === 'development',
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out certain errors in production
      if (process.env.NODE_ENV === 'production') {
        const error = hint.originalException;
        
        // Skip rate limiting errors (they're handled gracefully)
        if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
          return null;
        }
        
        // Skip network errors from client
        if (error instanceof Error && error.message.includes('NetworkError')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Additional metadata
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || 'vetify-dev-local',
  
  // Security settings
  initialScope: {
    tags: {
      component: 'client',
      platform: 'veterinary',
    },
  },
  
  // Integration configurations
  integrations: [
    // Temporarily disable replay integration to fix transport errors
    // ...(typeof window !== 'undefined' ? [
    //   Sentry.replayIntegration({
    //     maskAllText: true, // Mask sensitive data
    //     blockAllMedia: true, // Block media for privacy
    //     maskAllInputs: true, // Mask form inputs
    //   })
    // ] : []),
  ],
  
  // Replay settings for debugging (disabled for now)
  // replaysSessionSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  // replaysOnErrorSampleRate: 1.0,
  
  // Network configuration for better reliability
  // transportOptions: {
  //   fetchParameters: {
  //     keepalive: false,
  //   },
  // },
  
  // Increase timeout for development
  shutdownTimeout: 5000,
  });
} else {
  // Log that Sentry is not initialized due to missing DSN
  if (process.env.NODE_ENV === 'development') {
    console.warn('Sentry client not initialized: Missing or invalid NEXT_PUBLIC_SENTRY_DSN');
    console.warn('To enable Sentry, add your DSN to .env.local:');
    console.warn('NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@o000000.ingest.sentry.io/0000000');
  }
}
