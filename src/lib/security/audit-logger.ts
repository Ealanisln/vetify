import { NextRequest } from 'next/server';

/**
 * Audit logging system for security events and data access
 */

export type AuditEventType = 
  | 'auth_login'
  | 'auth_logout' 
  | 'auth_failed'
  | 'data_access'
  | 'data_create'
  | 'data_update'
  | 'data_delete'
  | 'permission_denied'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'admin_action'
  | 'sensitive_data_access'
  | 'export_data'
  | 'security_event';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId?: string;
  tenantId?: string;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  errorMessage?: string;
}

/**
 * Extract audit information from request
 */
export function extractAuditInfo(
  request: NextRequest,
  userId?: string,
  tenantId?: string
): Pick<AuditEvent, 'ipAddress' | 'userAgent' | 'endpoint' | 'method' | 'userId' | 'tenantId'> {
  // Get IP address from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  let ipAddress = 'unknown';
  if (forwardedFor) {
    ipAddress = forwardedFor.split(',')[0].trim();
  } else if (realIp) {
    ipAddress = realIp;
  } else if (cfConnectingIp) {
    ipAddress = cfConnectingIp;
  }

  return {
    ipAddress,
    userAgent: request.headers.get('user-agent') || 'unknown',
    endpoint: request.nextUrl.pathname,
    method: request.method,
    userId,
    tenantId,
  };
}

/**
 * Determine risk level based on event type and context
 */
export function calculateRiskLevel(
  eventType: AuditEventType,
  success: boolean,
  context?: Record<string, unknown>
): 'low' | 'medium' | 'high' | 'critical' {
  // Critical events
  if (
    eventType === 'permission_denied' ||
    eventType === 'suspicious_activity' ||
    (eventType === 'auth_failed' && context?.attempts && typeof context.attempts === 'number' && context.attempts > 5)
  ) {
    return 'critical';
  }

  // High risk events
  if (
    eventType === 'admin_action' ||
    eventType === 'data_delete' ||
    eventType === 'export_data' ||
    eventType === 'sensitive_data_access' ||
    eventType === 'rate_limit_exceeded'
  ) {
    return 'high';
  }

  // Medium risk events
  if (
    eventType === 'data_update' ||
    eventType === 'data_create' ||
    eventType === 'auth_failed' ||
    !success
  ) {
    return 'medium';
  }

  // Low risk events
  return 'low';
}

/**
 * Log audit event to console (in production, this should go to a proper logging service)
 */
export async function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
  const auditEvent: AuditEvent = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    ...event,
  };

  // In development, only log high/critical events to reduce noise
  // Set AUDIT_LOG_VERBOSE=true to see all audit events
  if (process.env.NODE_ENV === 'development' && process.env.AUDIT_LOG_VERBOSE === 'true') {
    console.log('🔍 AUDIT LOG:', JSON.stringify(auditEvent, null, 2));
  }

  // In production, you would send this to:
  // - Supabase audit table
  // - External logging service (DataDog, LogRocket, etc.)
  // - SIEM system
  // - Compliance logging system

  try {
    // TODO: Implement actual audit log storage
    // For now, we'll just log critical events to console even in production
    if (auditEvent.riskLevel === 'critical' || auditEvent.riskLevel === 'high') {
      console.warn('🚨 SECURITY AUDIT:', {
        id: auditEvent.id,
        timestamp: auditEvent.timestamp,
        eventType: auditEvent.eventType,
        userId: auditEvent.userId,
        ipAddress: auditEvent.ipAddress,
        endpoint: auditEvent.endpoint,
        riskLevel: auditEvent.riskLevel,
        success: auditEvent.success,
        details: auditEvent.details,
      });
    }
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
  request: NextRequest,
  eventType: 'auth_login' | 'auth_logout' | 'auth_failed',
  userId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const auditInfo = extractAuditInfo(request, userId);
  
  await logAuditEvent({
    eventType,
    ...auditInfo,
    riskLevel: calculateRiskLevel(eventType, eventType !== 'auth_failed', details),
    success: eventType !== 'auth_failed',
    details,
  });
}

/**
 * Log data access events
 */
export async function logDataAccessEvent(
  request: NextRequest,
  eventType: 'data_access' | 'data_create' | 'data_update' | 'data_delete',
  userId: string,
  tenantId: string,
  resource: string,
  resourceId?: string,
  success: boolean = true,
  details?: Record<string, unknown>
): Promise<void> {
  const auditInfo = extractAuditInfo(request, userId, tenantId);
  
  await logAuditEvent({
    eventType,
    ...auditInfo,
    resource,
    resourceId,
    riskLevel: calculateRiskLevel(eventType, success, details),
    success,
    details,
  });
}

/**
 * Log sensitive data access
 */
export async function logSensitiveDataAccess(
  request: NextRequest,
  userId: string,
  tenantId: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const auditInfo = extractAuditInfo(request, userId, tenantId);
  
  await logAuditEvent({
    eventType: 'sensitive_data_access',
    ...auditInfo,
    resource,
    resourceId,
    riskLevel: 'high',
    success: true,
    details: {
      ...details,
      sensitiveData: true,
    },
  });
}

/**
 * Log admin actions
 */
export async function logAdminAction(
  request: NextRequest,
  userId: string,
  action: string,
  targetUserId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const auditInfo = extractAuditInfo(request, userId);
  
  await logAuditEvent({
    eventType: 'admin_action',
    ...auditInfo,
    resource: 'admin_action',
    resourceId: targetUserId,
    riskLevel: 'high',
    success: true,
    details: {
      action,
      ...details,
    },
  });
}

/**
 * Log security events (rate limiting, suspicious activity, etc.)
 */
export async function logSecurityEvent(
  request: NextRequest,
  eventType: 'rate_limit_exceeded' | 'suspicious_activity' | 'permission_denied' | 'security_event',
  userId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const auditInfo = extractAuditInfo(request, userId);
  
  await logAuditEvent({
    eventType,
    ...auditInfo,
    riskLevel: calculateRiskLevel(eventType, false, details),
    success: false,
    details,
  });
}

/**
 * Middleware function to automatically log API requests
 */
export function createAuditMiddleware() {
  return async (
    request: NextRequest,
    userId?: string,
    tenantId?: string
  ): Promise<void> => {
    // Don't log static files, health checks, etc.
    if (
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.startsWith('/favicon') ||
      request.nextUrl.pathname === '/health'
    ) {
      return;
    }

    // Log API access
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const auditInfo = extractAuditInfo(request, userId, tenantId);
      
      await logAuditEvent({
        eventType: 'data_access',
        ...auditInfo,
        resource: 'api_endpoint',
        riskLevel: 'low',
        success: true,
        details: {
          searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
        },
      });
    }
  };
}
