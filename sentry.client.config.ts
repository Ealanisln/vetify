import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
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
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  // Security settings
  initialScope: {
    tags: {
      component: 'client',
      platform: 'veterinary',
    },
  },
  
  // Integration configurations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true, // Mask sensitive data
      blockAllMedia: true, // Block media for privacy
      maskAllInputs: true, // Mask form inputs
    }),
  ],
  
  // Replay settings for debugging
  replaysSessionSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  replaysOnErrorSampleRate: 1.0,
});
