import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiting configurations for different endpoint types
export const rateLimiters = {
  // Strict limits for authentication endpoints
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
    analytics: true,
    prefix: 'auth',
  }),

  // General API endpoints
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
    prefix: 'api',
  }),

  // Stricter limits for sensitive operations
  sensitive: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    analytics: true,
    prefix: 'sensitive',
  }),

  // Admin endpoints
  admin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 m'), // 50 requests per minute
    analytics: true,
    prefix: 'admin',
  }),

  // Webhook endpoints (higher limits for legitimate webhooks)
  webhook: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, '1 m'), // 200 requests per minute
    analytics: true,
    prefix: 'webhook',
  }),

  // Public endpoints (lower limits)
  public: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute
    analytics: true,
    prefix: 'public',
  }),
};

/**
 * Get the appropriate rate limiter for a given endpoint
 */
export function getRateLimiterForPath(pathname: string): Ratelimit {
  // Authentication endpoints
  if (pathname.startsWith('/api/auth/')) {
    return rateLimiters.auth;
  }

  // Admin endpoints
  if (pathname.startsWith('/api/admin/')) {
    return rateLimiters.admin;
  }

  // Webhook endpoints
  if (pathname.startsWith('/api/webhooks/')) {
    return rateLimiters.webhook;
  }

  // Public endpoints
  if (pathname.startsWith('/api/public/')) {
    return rateLimiters.public;
  }

  // Sensitive endpoints (payments, user data, medical records)
  if (
    pathname.includes('/stripe/') ||
    pathname.includes('/payment') ||
    pathname.includes('/medical') ||
    pathname.includes('/customer') ||
    pathname.includes('/pet') ||
    pathname.includes('/subscription') ||
    pathname.includes('/onboarding')
  ) {
    return rateLimiters.sensitive;
  }

  // Default to general API rate limiter
  return rateLimiters.api;
}

/**
 * Rate limit a request and return the result
 */
export async function checkRateLimit(
  identifier: string,
  pathname: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  const rateLimiter = getRateLimiterForPath(pathname);
  
  try {
    const result = await rateLimiter.limit(identifier);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset),
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);

    // SECURITY FIX: On Redis failure, deny the request to prevent bypass attacks
    // This follows fail-secure principle - if rate limiting infra is down,
    // we should not allow unlimited traffic which could enable DDoS or brute force
    return {
      success: false,
      limit: 0,
      remaining: 0,
      reset: new Date(Date.now() + 60000), // Retry after 1 minute
    };
  }
}

/**
 * Get the client identifier for rate limiting
 * Uses IP address, but could be enhanced with user ID for authenticated requests
 */
export function getClientIdentifier(
  request: Request,
  userId?: string
): string {
  // Use user ID if available (for authenticated requests)
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get real IP from various headers (for proxies/CDNs)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  // Use the first IP from x-forwarded-for if available
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    return `ip:${firstIp}`;
  }
  
  if (realIp) {
    return `ip:${realIp}`;
  }
  
  if (cfConnectingIp) {
    return `ip:${cfConnectingIp}`;
  }

  // Fallback to a default identifier
  return 'ip:unknown';
}

/**
 * Create rate limit headers for the response
 */
export function createRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  reset: Date;
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.reset.getTime() / 1000).toString(),
  };
}

/**
 * Check if rate limiting is enabled (based on environment variables)
 */
export function isRateLimitingEnabled(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}
