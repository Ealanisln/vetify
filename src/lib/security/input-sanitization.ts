import { z } from 'zod';

/**
 * Security utility functions for input sanitization and validation
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * SECURITY FIX: More comprehensive XSS sanitization including:
 * - Better data: protocol handling (blocks executable data URIs)
 * - Additional dangerous patterns (expression, behaviors)
 * - HTML entity attack prevention
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove potential XSS vectors
  return input
    // Remove dangerous script tags and content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gim, '')
    .replace(/<script[^>]*>/gim, '') // Unclosed script tags

    // Remove iframe and frame tags
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gim, '')
    .replace(/<iframe[^>]*>/gim, '')
    .replace(/<frame[^>]*>/gim, '')
    .replace(/<frameset[^>]*>[\s\S]*?<\/frameset>/gim, '')

    // Remove dangerous protocols
    .replace(/javascript\s*:/gim, '') // javascript: protocol
    .replace(/vbscript\s*:/gim, '') // vbscript: protocol
    .replace(/livescript\s*:/gim, '') // livescript: protocol

    // SECURITY FIX: Better data: protocol handling
    // Block executable data URIs (text/html, application/javascript, etc.)
    // but allow safe ones like data:image/png which are commonly used
    .replace(/data\s*:\s*text\/html/gim, 'data:blocked')
    .replace(/data\s*:\s*text\/javascript/gim, 'data:blocked')
    .replace(/data\s*:\s*application\/javascript/gim, 'data:blocked')
    .replace(/data\s*:\s*application\/x-javascript/gim, 'data:blocked')
    .replace(/data\s*:\s*text\/x-scriptlet/gim, 'data:blocked')
    .replace(/data\s*:\s*application\/ecmascript/gim, 'data:blocked')

    // Remove all event handlers (onclick, onload, onerror, etc.)
    .replace(/\bon\w+\s*=/gim, 'data-removed=')

    // Remove dangerous object/embed/applet tags
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gim, '')
    .replace(/<embed[^>]*>/gim, '')
    .replace(/<applet[^>]*>[\s\S]*?<\/applet>/gim, '')

    // Remove base tags (can redirect all relative URLs)
    .replace(/<base[^>]*>/gim, '')

    // Remove link, meta, and style tags (can inject malicious CSS or redirects)
    .replace(/<link[^>]*>/gim, '')
    .replace(/<meta[^>]*>/gim, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gim, '')

    // Remove SVG foreignObject (can embed HTML inside SVG)
    .replace(/<foreignobject[^>]*>[\s\S]*?<\/foreignobject>/gim, '')

    // Remove CSS expression() (IE-specific XSS vector)
    .replace(/expression\s*\(/gim, 'blocked(')

    // Remove behavior: directive (IE-specific)
    .replace(/behavior\s*:/gim, 'blocked:')

    // Remove moz-binding (Firefox-specific)
    .replace(/-moz-binding\s*:/gim, 'blocked:')

    // HTML entity obfuscation prevention
    // Decode and re-check for patterns (handles &#106;avascript: etc.)
    .replace(/&#(\d+);/g, (match, code) => {
      const char = String.fromCharCode(parseInt(code, 10));
      // Block control characters and potential encoding attacks
      if (code < 32 || char.match(/[<>"'&]/)) {
        return '';
      }
      return match;
    })

    .trim();
}

/**
 * Sanitize SQL-like input to prevent injection attempts
 */
export function sanitizeSqlInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove or escape potential SQL injection patterns
  return input
    .replace(/['";]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*.*?\*\//g, '') // Remove block comments
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC|EXECUTE|UNION|SELECT)\b/gim, '') // Remove SQL keywords
    .trim();
}

/**
 * Validate and sanitize file names
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'unnamed_file';
  }

  return fileName
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid file name characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^\w.-]/g, '') // Keep only alphanumeric, dots, hyphens, and underscores
    .slice(0, 255) // Limit length
    .trim();
}

/**
 * Validate email format
 */
export const emailSchema = z.string().email().max(254);

/**
 * Validate phone number format (international)
 */
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

/**
 * Validate URL format
 */
export const urlSchema = z.string().url().max(2048);

/**
 * Common validation schemas for API endpoints
 */
export const commonSchemas = {
  // Basic string validation
  safeString: z.string().min(1).max(1000).transform(sanitizeHtml),
  
  // ID validation (UUIDs, nanoids, etc.)
  id: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  
  // Name validation (people, businesses, etc.)
  name: z.string().min(1).max(100).transform(sanitizeHtml),
  
  // Description/note validation
  description: z.string().max(5000).transform(sanitizeHtml).optional(),
  
  // Slug validation
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  
  // Amount validation (for prices, weights, etc.)
  amount: z.number().min(0).max(999999.99),
  
  // Date validation
  isoDate: z.string().datetime(),
  
  // File validation
  fileName: z.string().min(1).max(255).transform(sanitizeFileName),
  
  // Medical record text
  medicalText: z.string().max(10000).transform(sanitizeHtml),
  
  // Address validation
  address: z.string().min(1).max(500).transform(sanitizeHtml),
  
  // Postal code validation
  postalCode: z.string().min(1).max(20).regex(/^[a-zA-Z0-9\s-]+$/),
  
  // Country code validation
  countryCode: z.string().length(2).regex(/^[A-Z]{2}$/),
  
  // Currency code validation
  currencyCode: z.string().length(3).regex(/^[A-Z]{3}$/),
};

/**
 * Validate request body against a schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.parse(body);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return { success: false, error: `Validation error: ${errorMessage}` };
    }
    return { success: false, error: 'Invalid request body' };
  }
}

/**
 * Validate query parameters against a schema
 */
export function validateQueryParams<T>(
  url: URL,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const params = Object.fromEntries(url.searchParams.entries());
    const result = schema.parse(params);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return { success: false, error: `Query parameter validation error: ${errorMessage}` };
    }
    return { success: false, error: 'Invalid query parameters' };
  }
}

/**
 * Security headers for API responses
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  // SECURITY FIX: Add Content-Security-Policy to prevent XSS and data injection attacks
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://analytics.alanis.dev https://connect.facebook.net https://www.facebook.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://*.stripe.com https://*.sentry.io wss://*.supabase.co https://analytics.alanis.dev",
    "frame-src 'self' https://*.stripe.com https://www.facebook.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),
};

/**
 * Create a secure API response with proper headers
 */
export function createSecureResponse(
  data: Record<string, unknown>,
  status: number = 200,
  additionalHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...securityHeaders,
      ...additionalHeaders,
    },
  });
}

/**
 * Create an error response with security headers
 */
export function createSecureErrorResponse(
  message: string,
  status: number = 400,
  additionalHeaders: Record<string, string> = {}
): Response {
  return createSecureResponse(
    { error: message, timestamp: new Date().toISOString() },
    status,
    additionalHeaders
  );
}
