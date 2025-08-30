import * as Sentry from '@sentry/nextjs';

// Client-side Sentry instrumentation
// This file is used by Next.js for client-side error tracking
// and replaces the deprecated sentry.client.config.ts approach

// Initialize Sentry client-side instrumentation
if (typeof window !== 'undefined') {
  // Only run on client side
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Debug mode controlled by environment variable
    debug: process.env.SENTRY_DEBUG === 'true',
    

    
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
}

// Export the required hook for router transitions
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
