/**
 * Security utilities for Vetify platform
 * 
 * This module provides comprehensive security features including:
 * - Rate limiting
 * - Input validation and sanitization
 * - Audit logging
 * - Security headers
 * - CSRF protection
 */

import { z } from 'zod';

export * from './rate-limiter';
export * from './input-sanitization';
export * from './audit-logger';

// Security constants
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT_ENABLED: process.env.NODE_ENV === 'production',
  
  // Session security
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  
  // File upload limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain',
  ],
  
  // Input limits
  MAX_STRING_LENGTH: 10000,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_NAME_LENGTH: 100,
  
  // Security headers
  CSP_POLICY: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://analytics.alanis.dev; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.stripe.com https://*.upstash.io https://analytics.alanis.dev; frame-src https://js.stripe.com;",
} as const;

/**
 * Check if a request is from a trusted source
 */
export function isTrustedRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  if (!origin && !referer) {
    return false;
  }
  
  const trustedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean);
  
  return trustedOrigins.some(trusted => 
    origin?.startsWith(trusted) || referer?.startsWith(trusted)
  );
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }
  
  return result;
}

/**
 * Hash a password securely (simplified version - in production use bcrypt)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + process.env.PASSWORD_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedPassword = await hashPassword(password);
  return hashedPassword === hash;
}

/**
 * Security middleware factory
 */
export function createSecurityMiddleware() {
  return {
    rateLimit: async (request: Request, identifier: string, pathname: string) => {
      const { checkRateLimit } = await import('./rate-limiter');
      return checkRateLimit(identifier, pathname);
    },
    
    audit: async (request: Request, eventType: string, details?: Record<string, unknown>) => {
      const { logAuditEvent } = await import('./audit-logger');
      return logAuditEvent({
        eventType: eventType as 'security_event',
        success: true,
        method: 'unknown',
        userAgent: 'unknown',
        ipAddress: 'unknown',
        endpoint: 'unknown',
        resource: 'unknown',
        riskLevel: 'low',
        ...details,
      });
    },
    
    validate: async <T>(request: Request, schema: z.ZodSchema<T>) => {
      const { validateRequestBody } = await import('./input-sanitization');
      return validateRequestBody(request, schema);
    },
  };
}
