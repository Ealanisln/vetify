import { NextRequest } from 'next/server';
import { UserWithTenant, TenantWithPlan } from '@/types';

/**
 * Security context for API handlers
 */
export interface SecurityContext {
  userId?: string;
  tenantId?: string;
  user?: UserWithTenant;
  tenant?: TenantWithPlan;
  body?: Record<string, unknown>;
  query?: Record<string, string | string[]>;
}

/**
 * API handler with security context
 */
export type SecureApiHandler<T = Record<string, unknown>> = (
  req: NextRequest,
  context: SecurityContext & { body?: T }
) => Promise<Response>;

/**
 * Generic request body type
 */
export type RequestBody = Record<string, unknown>;

/**
 * Generic query parameters type
 */
export type QueryParams = Record<string, string | string[]>;

/**
 * Audit information type
 */
export interface AuditInfo {
  userId?: string;
  tenantId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  timestamp: Date;
}

/**
 * Security validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  sanitizedData?: Record<string, unknown>;
}

/**
 * Rate limit context
 */
export interface RateLimitContext {
  identifier: string;
  limit: number;
  window: number;
  remaining?: number;
  reset?: number;
}

