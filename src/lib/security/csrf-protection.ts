import { NextRequest } from 'next/server';
import { createSecureErrorResponse } from './input-sanitization';

/**
 * CSRF Protection utilities for form submissions and API requests
 */

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  // Generate a random token using Web Crypto API
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify CSRF token from request
 */
export function verifyCSRFToken(request: NextRequest, expectedToken: string): boolean {
  // Check for CSRF token in headers
  const tokenFromHeader = request.headers.get('x-csrf-token');
  
  // Check for CSRF token in form data (for multipart forms)
  const tokenFromForm = request.headers.get('x-csrf-form-token');
  
  const submittedToken = tokenFromHeader || tokenFromForm;
  
  if (!submittedToken) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  return constantTimeCompare(submittedToken, expectedToken);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * CSRF middleware for API routes
 */
export function createCSRFMiddleware(options: {
  skipForMethods?: string[];
  skipForPaths?: string[];
} = {}) {
  const { 
    skipForMethods = ['GET', 'HEAD', 'OPTIONS'],
    skipForPaths = ['/api/webhooks/', '/api/auth/']
  } = options;
  
  return async (request: NextRequest): Promise<Response | null> => {
    const { method, nextUrl } = request;
    
    // Skip CSRF check for safe methods
    if (skipForMethods.includes(method)) {
      return null;
    }
    
    // Skip CSRF check for specified paths (webhooks, auth callbacks, etc.)
    if (skipForPaths.some(path => nextUrl.pathname.startsWith(path))) {
      return null;
    }
    
    // For state-changing requests, verify CSRF token
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    // Verify that the request comes from the same origin
    if (!origin && !referer) {
      return createSecureErrorResponse('Missing origin header', 403);
    }
    
    const expectedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ].filter(Boolean);
    
    const isValidOrigin = expectedOrigins.some(expectedOrigin => 
      origin?.startsWith(expectedOrigin) || referer?.startsWith(expectedOrigin)
    );
    
    if (!isValidOrigin) {
      return createSecureErrorResponse('Invalid origin', 403);
    }
    
    // Additional CSRF token validation could be implemented here
    // For now, we rely on SameSite cookies and origin validation
    
    return null; // Continue with request
  };
}

/**
 * Generate CSRF token for forms
 */
export function getCSRFTokenForSession(sessionId: string): string {
  // In a real implementation, you would store this in a secure session store
  // For now, we'll generate based on session ID + secret
  const secret = process.env.CSRF_SECRET || 'default-csrf-secret';
  const data = sessionId + secret + Date.now().toString();
  
  // Simple hash function (in production, use a proper cryptographic hash)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16);
}

/**
 * Validate CSRF token for session
 */
export function validateCSRFTokenForSession(sessionId: string, token: string): boolean {
  const expectedToken = getCSRFTokenForSession(sessionId);
  return constantTimeCompare(token, expectedToken);
}

/**
 * Create CSRF-protected form handler
 */
export function createCSRFProtectedHandler<T>(
  handler: (request: NextRequest, data: T) => Promise<Response>,
  options: {
    skipCSRF?: boolean;
  } = {}
) {
  return async (request: NextRequest) => {
    try {
      // Apply CSRF protection if not skipped
      if (!options.skipCSRF) {
        const csrfCheck = await createCSRFMiddleware()(request);
        if (csrfCheck) {
          return csrfCheck; // CSRF validation failed
        }
      }
      
      // Parse request data
      let data: T;
      const contentType = request.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await request.json();
      } else if (contentType?.includes('multipart/form-data')) {
        const formData = await request.formData();
        data = Object.fromEntries(formData.entries()) as T;
      } else {
        throw new Error('Unsupported content type');
      }
      
      return handler(request, data);
      
    } catch (error) {
      console.error('CSRF Protected Handler Error:', error);
      return createSecureErrorResponse(
        process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'Request processing failed',
        400
      );
    }
  };
}

/**
 * Headers to add to responses for additional CSRF protection
 */
export const csrfHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
} as const;
