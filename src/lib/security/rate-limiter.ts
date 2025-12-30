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
 * Validate IP address format to prevent header injection
 */
function isValidIP(ip: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$|^::(?:[a-fA-F0-9]{1,4}:){0,6}[a-fA-F0-9]{1,4}$|^(?:[a-fA-F0-9]{1,4}:){1,7}:$/;

  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

/**
 * Check if request is from a trusted proxy (Vercel)
 *
 * SECURITY: Only trust forwarded headers when we can verify we're behind Vercel
 */
function isTrustedProxy(request: Request): boolean {
  // Vercel sets these headers on all requests going through their edge network
  const vercelId = request.headers.get('x-vercel-id');
  const vercelDeploymentUrl = request.headers.get('x-vercel-deployment-url');

  // If either header is present, we're behind Vercel
  return !!(vercelId || vercelDeploymentUrl);
}

/**
 * Get the client identifier for rate limiting
 * Uses IP address, but could be enhanced with user ID for authenticated requests
 *
 * SECURITY FIX: Only trust proxy headers when behind a verified proxy (Vercel)
 * to prevent IP spoofing attacks that could bypass rate limits.
 */
export function getClientIdentifier(
  request: Request,
  userId?: string
): string {
  // Always prefer user ID for authenticated requests
  // This is the most reliable identifier
  if (userId) {
    return `user:${userId}`;
  }

  // SECURITY FIX: Only trust forwarded headers when behind Vercel
  // Attackers can spoof x-forwarded-for, x-real-ip, etc. headers
  if (isTrustedProxy(request)) {
    // When behind Vercel, trust their headers
    // Vercel sets x-real-ip to the actual client IP
    const realIp = request.headers.get('x-real-ip');
    if (realIp && isValidIP(realIp)) {
      return `ip:${realIp}`;
    }

    // Cloudflare connecting IP (if using Cloudflare in front of Vercel)
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    if (cfConnectingIp && isValidIP(cfConnectingIp)) {
      return `ip:${cfConnectingIp}`;
    }

    // x-forwarded-for can be a chain, only trust the rightmost IP
    // which is the one Vercel added (closest to the proxy)
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      // Take the last IP (closest to the trusted proxy)
      const lastIp = ips[ips.length - 1];
      if (lastIp && isValidIP(lastIp)) {
        return `ip:${lastIp}`;
      }
    }
  }

  // Not behind a trusted proxy or no valid IP found
  // Use a hash of request characteristics for uniqueness
  // This is less reliable but better than nothing
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const acceptLanguage = request.headers.get('accept-language') || 'unknown';

  // Create a fingerprint (not cryptographically secure, just for rate limiting)
  const fingerprint = `${userAgent.slice(0, 50)}:${acceptLanguage.slice(0, 20)}`;

  return `fp:${fingerprint}`;
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
