import * as Sentry from '@sentry/nextjs';
import React from 'react';
import { NextRequest } from 'next/server';
import { AuditEventType } from '../security/audit-logger';

/**
 * Enhanced Sentry integration for veterinary platform monitoring
 */

export interface SecurityContext {
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceMetrics {
  responseTime?: number;
  dbQueryCount?: number;
  dbQueryTime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

/**
 * Configure Sentry context for a request
 */
export function setSentryRequestContext(
  request: NextRequest,
  securityContext: SecurityContext = {}
): void {
  Sentry.withScope((scope) => {
    // Set user context
    if (securityContext.userId) {
      scope.setUser({
        id: securityContext.userId,
        ip_address: securityContext.ipAddress,
      });
    }
    
    // Set request context
    scope.setContext('request', {
      url: request.url,
      method: request.method,
      headers: {
        'user-agent': securityContext.userAgent || request.headers.get('user-agent'),
        'x-forwarded-for': request.headers.get('x-forwarded-for'),
      },
    });
    
    // Set veterinary platform context
    scope.setContext('veterinary', {
      tenantId: securityContext.tenantId,
      endpoint: securityContext.endpoint || request.nextUrl.pathname,
      riskLevel: securityContext.riskLevel,
      platform: 'vetify',
    });
    
    // Set tags for filtering
    scope.setTag('component', 'api');
    scope.setTag('tenant', securityContext.tenantId || 'unknown');
    
    if (securityContext.riskLevel) {
      scope.setTag('risk_level', securityContext.riskLevel);
    }
  });
}

/**
 * Log security events to Sentry
 */
export function logSecurityEvent(
  eventType: AuditEventType,
  securityContext: SecurityContext,
  details?: Record<string, unknown>
): void {
  const level = getSecurityEventLevel(eventType);
  
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    scope.setTag('event_type', eventType);
    scope.setTag('category', 'security');
    
    // Set security context
    if (securityContext.userId) {
      scope.setUser({ id: securityContext.userId });
    }
    
    scope.setContext('security_event', {
      type: eventType,
      riskLevel: securityContext.riskLevel,
      endpoint: securityContext.endpoint,
      ipAddress: securityContext.ipAddress,
      details,
    });
    
    // Create appropriate message based on event type
    const message = createSecurityEventMessage(eventType, securityContext);
    
    if (level === 'error' || level === 'fatal') {
      Sentry.captureException(new Error(message));
    } else {
      Sentry.captureMessage(message, level);
    }
  });
}

/**
 * Log performance metrics
 */
export function logPerformanceMetrics(
  operation: string,
  metrics: PerformanceMetrics,
  context?: Record<string, unknown>
): void {
  Sentry.withScope((scope) => {
    scope.setTag('category', 'performance');
    scope.setTag('operation', operation);
    
    scope.setContext('performance', {
      operation,
      metrics,
      context,
    });
    
    // Set performance level based on metrics
    const level = getPerformanceLevel(metrics);
    scope.setLevel(level);
    
    const message = `Performance: ${operation} - ${metrics.responseTime}ms`;
    Sentry.captureMessage(message, level);
  });
}

/**
 * Log database performance issues
 */
export function logDatabasePerformance(
  query: string,
  duration: number,
  context?: Record<string, unknown>
): void {
  // Log slow queries
  if (duration > 1000) { // > 1 second
    Sentry.withScope((scope) => {
      scope.setTag('category', 'database');
      scope.setTag('performance', 'slow_query');
      scope.setLevel(duration > 5000 ? 'error' : 'warning');
      
      scope.setContext('database', {
        query: query.substring(0, 500), // Limit query length
        duration,
        context,
      });
      
      Sentry.captureMessage(`Slow database query: ${duration}ms`, 'warning');
    });
  }
}

/**
 * Log API endpoint performance
 */
export function logAPIPerformance(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number,
  context?: Record<string, unknown>
): void {
  Sentry.withScope((scope) => {
    scope.setTag('category', 'api_performance');
    scope.setTag('endpoint', endpoint);
    scope.setTag('method', method);
    scope.setTag('status_code', statusCode.toString());
    
    scope.setContext('api_performance', {
      endpoint,
      method,
      duration,
      statusCode,
      context,
    });
    
    // Set level based on performance and status
    let level: Sentry.SeverityLevel = 'info';
    if (statusCode >= 500) {
      level = 'error';
    } else if (statusCode >= 400) {
      level = 'warning';
    } else if (duration > 5000) {
      level = 'warning';
    }
    
    scope.setLevel(level);
    
    Sentry.captureMessage(
      `API ${method} ${endpoint}: ${duration}ms (${statusCode})`,
      level
    );
  });
}

/**
 * Capture business logic errors with context
 */
export function captureBusinessError(
  error: Error,
  context: {
    operation: string;
    userId?: string;
    tenantId?: string;
    data?: Record<string, unknown>;
  }
): void {
  Sentry.withScope((scope) => {
    scope.setTag('category', 'business_logic');
    scope.setTag('operation', context.operation);
    
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    scope.setContext('business_error', {
      operation: context.operation,
      tenantId: context.tenantId,
      data: context.data,
    });
    
    scope.setLevel('error');
    Sentry.captureException(error);
  });
}

/**
 * Monitor critical business metrics
 */
export function logBusinessMetrics(
  metric: string,
  value: number,
  context?: Record<string, unknown>
): void {
  Sentry.withScope((scope) => {
    scope.setTag('category', 'business_metrics');
    scope.setTag('metric', metric);
    
    scope.setContext('business_metrics', {
      metric,
      value,
      context,
      timestamp: new Date().toISOString(),
    });
    
    Sentry.captureMessage(`Business metric: ${metric} = ${value}`, 'info');
  });
}

/**
 * Helper function to determine security event level
 */
function getSecurityEventLevel(eventType: AuditEventType): Sentry.SeverityLevel {
  switch (eventType) {
    case 'permission_denied':
    case 'suspicious_activity':
    case 'rate_limit_exceeded':
      return 'error';
    
    case 'auth_failed':
    case 'security_event':
      return 'warning';
    
    case 'admin_action':
    case 'sensitive_data_access':
      return 'info';
    
    default:
      return 'debug';
  }
}

/**
 * Helper function to determine performance level
 */
function getPerformanceLevel(metrics: PerformanceMetrics): Sentry.SeverityLevel {
  if (metrics.responseTime && metrics.responseTime > 10000) {
    return 'error';
  }
  
  if (metrics.responseTime && metrics.responseTime > 3000) {
    return 'warning';
  }
  
  return 'info';
}

/**
 * Create descriptive security event messages
 */
function createSecurityEventMessage(
  eventType: AuditEventType,
  context: SecurityContext
): string {
  const baseMessage = `Security Event: ${eventType}`;
  const location = context.endpoint ? ` at ${context.endpoint}` : '';
  const risk = context.riskLevel ? ` (${context.riskLevel} risk)` : '';

  return `${baseMessage}${location}${risk}`;
}

/**
 * Error boundary integration for React components
 */
export function createSentryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  return Sentry.withErrorBoundary(Component, {
    // @ts-expect-error - Temporary fix for Sentry type mismatch
    fallback: fallback || (({ error, resetError }) => (
      <div className="error-boundary">
        <h2>Something went wrong</h2>
        <details>
          {process.env.NODE_ENV === 'development' && String(error)}
        </details>
        <button onClick={resetError}>Try again</button>
      </div>
    )),
    beforeCapture: (scope, error, errorInfo) => {
      scope.setTag('component', 'error_boundary');
      scope.setContext('error_boundary', {
        componentStack: errorInfo,
      });
    },
  });
}

/**
 * Initialize monitoring for the application
 */
export function initializeMonitoring(): void {
  // Set global error handlers
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      Sentry.captureException(event.reason);
    });
  }
  
  // Log application startup
  Sentry.captureMessage('Vetify application started', 'info');
}
