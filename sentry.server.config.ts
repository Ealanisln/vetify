import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Profiling
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Debug mode for development
  debug: process.env.NODE_ENV === 'development',
  
  // Error filtering and enrichment
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Add custom context for veterinary platform
    if (event.tags) {
      event.tags.platform = 'veterinary';
      event.tags.component = 'server';
    }
    
    // Filter out certain errors in production
    if (process.env.NODE_ENV === 'production') {
      // Skip rate limiting errors (they're handled gracefully)
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        return null;
      }
      
      // Skip Prisma connection timeout errors if they're temporary
      if (error instanceof Error && error.message.includes('Connection timeout')) {
        return null;
      }
    }
    
    // Add security context for security-related errors
    if (error instanceof Error) {
      if (error.message.includes('permission') || 
          error.message.includes('unauthorized') ||
          error.message.includes('forbidden')) {
        event.tags = { ...event.tags, category: 'security' };
        event.level = 'warning';
      }
      
      // High priority for data validation errors
      if (error.message.includes('validation') || 
          error.message.includes('schema')) {
        event.tags = { ...event.tags, category: 'validation' };
        event.level = 'error';
      }
    }
    
    return event;
  },
  
  // Additional metadata
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  serverName: process.env.VERCEL_REGION || 'local',
  
  // Initial scope with platform context
  initialScope: {
    tags: {
      component: 'server',
      platform: 'veterinary',
      version: '1.0.0',
    },
  },
  
  // Server-specific integrations
  integrations: [
    // Database monitoring
    Sentry.prismaIntegration(),
    
    // HTTP monitoring
    Sentry.httpIntegration(),
  ],
  
  // Sampling rules
  tracesSampler: (samplingContext) => {
    // High sampling for security-related operations
    if (samplingContext.request?.url?.includes('/api/admin/') ||
        samplingContext.request?.url?.includes('/api/auth/')) {
      return 0.5;
    }
    
    // Medium sampling for API endpoints
    if (samplingContext.request?.url?.includes('/api/')) {
      return 0.2;
    }
    
    // Low sampling for static content
    return 0.1;
  },
});
