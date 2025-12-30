/**
 * Rate Limiter Tests
 * VETIF-50: Phase 1 - Security Infrastructure
 *
 * Tests cover:
 * - Path-based rate limiter selection
 * - Client identifier extraction
 * - Rate limit header creation
 * - Rate limiting enabled check
 */

import {
  getRateLimiterForPath,
  getClientIdentifier,
  createRateLimitHeaders,
  isRateLimitingEnabled,
  rateLimiters,
} from '@/lib/security/rate-limiter';

// Mock Upstash Redis
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({})),
}));

// Create mock rate limiter instances
const createMockRateLimiter = (prefix: string) => ({
  limit: jest.fn().mockResolvedValue({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 60000,
  }),
  prefix,
});

// Mock rate limiters before importing the module
const mockRateLimiters = {
  auth: createMockRateLimiter('auth'),
  api: createMockRateLimiter('api'),
  sensitive: createMockRateLimiter('sensitive'),
  admin: createMockRateLimiter('admin'),
  webhook: createMockRateLimiter('webhook'),
  public: createMockRateLimiter('public'),
};

// Mock Upstash Ratelimit - need to mock slidingWindow as a static method
jest.mock('@upstash/ratelimit', () => {
  const MockRatelimit = jest.fn().mockImplementation((config) => ({
    limit: jest.fn().mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    }),
    prefix: config?.prefix,
  }));

  // Add static method
  MockRatelimit.slidingWindow = jest.fn().mockReturnValue({});

  return { Ratelimit: MockRatelimit };
});

// Mock environment for rate limiting
const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'test-token',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Rate Limiter', () => {
  describe('getRateLimiterForPath', () => {
    describe('Authentication Endpoints', () => {
      it('should return auth limiter for /api/auth/ paths', () => {
        const paths = [
          '/api/auth/login',
          '/api/auth/logout',
          '/api/auth/callback',
          '/api/auth/register',
        ];

        paths.forEach((path) => {
          const limiter = getRateLimiterForPath(path);
          expect(limiter).toBe(rateLimiters.auth);
        });
      });
    });

    describe('Admin Endpoints', () => {
      it('should return admin limiter for /api/admin/ paths', () => {
        const paths = [
          '/api/admin/users',
          '/api/admin/billing',
          '/api/admin/super-admins',
        ];

        paths.forEach((path) => {
          const limiter = getRateLimiterForPath(path);
          expect(limiter).toBe(rateLimiters.admin);
        });
      });
    });

    describe('Webhook Endpoints', () => {
      it('should return webhook limiter for /api/webhooks/ paths', () => {
        const paths = [
          '/api/webhooks/stripe',
          '/api/webhooks/whatsapp',
          '/api/webhooks/n8n',
        ];

        paths.forEach((path) => {
          const limiter = getRateLimiterForPath(path);
          expect(limiter).toBe(rateLimiters.webhook);
        });
      });
    });

    describe('Public Endpoints', () => {
      it('should return public limiter for /api/public/ paths', () => {
        const paths = [
          '/api/public/pricing',
          '/api/public/contact',
          '/api/public/appointments',
        ];

        paths.forEach((path) => {
          const limiter = getRateLimiterForPath(path);
          expect(limiter).toBe(rateLimiters.public);
        });
      });
    });

    describe('Sensitive Endpoints', () => {
      it('should return sensitive limiter for stripe paths', () => {
        const limiter = getRateLimiterForPath('/api/stripe/checkout');
        expect(limiter).toBe(rateLimiters.sensitive);
      });

      it('should return sensitive limiter for payment paths', () => {
        const limiter = getRateLimiterForPath('/api/billing/payment');
        expect(limiter).toBe(rateLimiters.sensitive);
      });

      it('should return sensitive limiter for medical paths', () => {
        const limiter = getRateLimiterForPath('/api/pets/123/medical');
        expect(limiter).toBe(rateLimiters.sensitive);
      });

      it('should return sensitive limiter for customer paths', () => {
        const limiter = getRateLimiterForPath('/api/customer/123');
        expect(limiter).toBe(rateLimiters.sensitive);
      });

      it('should return sensitive limiter for pet paths', () => {
        const limiter = getRateLimiterForPath('/api/pet/123');
        expect(limiter).toBe(rateLimiters.sensitive);
      });

      it('should return sensitive limiter for subscription paths', () => {
        const limiter = getRateLimiterForPath('/api/subscription/upgrade');
        expect(limiter).toBe(rateLimiters.sensitive);
      });

      it('should return sensitive limiter for onboarding paths', () => {
        const limiter = getRateLimiterForPath('/api/onboarding/complete');
        expect(limiter).toBe(rateLimiters.sensitive);
      });
    });

    describe('Default API Endpoints', () => {
      it('should return api limiter for general API paths', () => {
        const paths = [
          '/api/appointments',
          '/api/services',
          '/api/inventory',
          '/api/reports',
        ];

        paths.forEach((path) => {
          const limiter = getRateLimiterForPath(path);
          expect(limiter).toBe(rateLimiters.api);
        });
      });
    });
  });

  describe('getClientIdentifier', () => {
    describe('User ID Priority', () => {
      it('should use user ID when provided', () => {
        const mockRequest = {
          headers: {
            get: () => '192.168.1.1',
          },
        } as unknown as Request;

        const identifier = getClientIdentifier(mockRequest, 'user_123');
        expect(identifier).toBe('user:user_123');
      });
    });

    describe('IP Address Extraction', () => {
      // SECURITY FIX: Tests updated to reflect new behavior
      // IP headers are only trusted when behind a verified proxy (Vercel)
      // This prevents IP spoofing attacks that could bypass rate limits

      it('should extract IP from x-real-ip header when behind Vercel', () => {
        const mockRequest = {
          headers: {
            get: (name: string) => {
              if (name === 'x-vercel-id') return 'sfo1::abc123'; // Vercel proxy indicator
              if (name === 'x-real-ip') return '10.0.0.50';
              return null;
            },
          },
        } as unknown as Request;

        const identifier = getClientIdentifier(mockRequest);
        expect(identifier).toBe('ip:10.0.0.50');
      });

      it('should extract IP from cf-connecting-ip header when behind Vercel', () => {
        const mockRequest = {
          headers: {
            get: (name: string) => {
              if (name === 'x-vercel-id') return 'sfo1::abc123'; // Vercel proxy indicator
              if (name === 'cf-connecting-ip') return '203.0.113.45';
              return null;
            },
          },
        } as unknown as Request;

        const identifier = getClientIdentifier(mockRequest);
        expect(identifier).toBe('ip:203.0.113.45');
      });

      it('should use last IP from x-forwarded-for chain when behind Vercel', () => {
        const mockRequest = {
          headers: {
            get: (name: string) => {
              if (name === 'x-vercel-id') return 'sfo1::abc123'; // Vercel proxy indicator
              if (name === 'x-forwarded-for') return '192.168.1.100, 10.0.0.1';
              return null;
            },
          },
        } as unknown as Request;

        const identifier = getClientIdentifier(mockRequest);
        // Takes the LAST IP (closest to trusted proxy)
        expect(identifier).toBe('ip:10.0.0.1');
      });

      it('should prioritize x-real-ip over x-forwarded-for when behind Vercel', () => {
        const mockRequest = {
          headers: {
            get: (name: string) => {
              if (name === 'x-vercel-id') return 'sfo1::abc123';
              if (name === 'x-forwarded-for') return '192.168.1.1';
              if (name === 'x-real-ip') return '10.0.0.1';
              if (name === 'cf-connecting-ip') return '172.16.0.1';
              return null;
            },
          },
        } as unknown as Request;

        const identifier = getClientIdentifier(mockRequest);
        // x-real-ip is checked first when behind Vercel
        expect(identifier).toBe('ip:10.0.0.1');
      });

      it('should return fingerprint when NOT behind Vercel', () => {
        // SECURITY: Without Vercel headers, we can't trust proxy headers
        // So we use a browser fingerprint instead
        const mockRequest = {
          headers: {
            get: (name: string) => {
              // No x-vercel-id or x-vercel-deployment-url
              if (name === 'x-forwarded-for') return '192.168.1.1';
              if (name === 'user-agent') return 'Mozilla/5.0';
              if (name === 'accept-language') return 'en-US';
              return null;
            },
          },
        } as unknown as Request;

        const identifier = getClientIdentifier(mockRequest);
        // Should be fingerprint, not IP (to prevent spoofing)
        expect(identifier).toMatch(/^fp:/);
      });

      it('should return fingerprint when no IP headers are present', () => {
        const mockRequest = {
          headers: {
            get: (name: string) => {
              if (name === 'user-agent') return 'TestAgent';
              if (name === 'accept-language') return 'es-MX';
              return null;
            },
          },
        } as unknown as Request;

        const identifier = getClientIdentifier(mockRequest);
        expect(identifier).toMatch(/^fp:/);
      });

      it('should reject invalid IP formats', () => {
        const mockRequest = {
          headers: {
            get: (name: string) => {
              if (name === 'x-vercel-id') return 'sfo1::abc123';
              if (name === 'x-real-ip') return 'not-an-ip';
              if (name === 'user-agent') return 'Test';
              if (name === 'accept-language') return 'en';
              return null;
            },
          },
        } as unknown as Request;

        const identifier = getClientIdentifier(mockRequest);
        // Invalid IP should result in fingerprint fallback
        expect(identifier).toMatch(/^fp:/);
      });
    });
  });

  describe('createRateLimitHeaders', () => {
    it('should create proper rate limit headers', () => {
      const reset = new Date('2024-01-01T12:00:00Z');
      const result = {
        limit: 100,
        remaining: 50,
        reset,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe('100');
      expect(headers['X-RateLimit-Remaining']).toBe('50');
      expect(headers['X-RateLimit-Reset']).toBe(Math.ceil(reset.getTime() / 1000).toString());
    });

    it('should handle zero remaining', () => {
      const result = {
        limit: 100,
        remaining: 0,
        reset: new Date(),
      };

      const headers = createRateLimitHeaders(result);

      expect(headers['X-RateLimit-Remaining']).toBe('0');
    });

    it('should convert reset time to unix timestamp', () => {
      const now = new Date();
      const result = {
        limit: 100,
        remaining: 99,
        reset: now,
      };

      const headers = createRateLimitHeaders(result);
      const resetTimestamp = parseInt(headers['X-RateLimit-Reset']);

      // Should be within a second of the expected value
      expect(resetTimestamp).toBeGreaterThanOrEqual(Math.floor(now.getTime() / 1000));
      expect(resetTimestamp).toBeLessThanOrEqual(Math.ceil(now.getTime() / 1000));
    });
  });

  describe('isRateLimitingEnabled', () => {
    it('should return true when both env vars are set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      expect(isRateLimitingEnabled()).toBe(true);
    });

    it('should return false when UPSTASH_REDIS_REST_URL is missing', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      expect(isRateLimitingEnabled()).toBe(false);
    });

    it('should return false when UPSTASH_REDIS_REST_TOKEN is missing', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      expect(isRateLimitingEnabled()).toBe(false);
    });

    it('should return false when both env vars are missing', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      expect(isRateLimitingEnabled()).toBe(false);
    });

    it('should return false when env vars are empty strings', () => {
      process.env.UPSTASH_REDIS_REST_URL = '';
      process.env.UPSTASH_REDIS_REST_TOKEN = '';

      expect(isRateLimitingEnabled()).toBe(false);
    });
  });

  describe('Rate Limiters Configuration', () => {
    it('should have auth rate limiter', () => {
      expect(rateLimiters.auth).toBeDefined();
    });

    it('should have api rate limiter', () => {
      expect(rateLimiters.api).toBeDefined();
    });

    it('should have sensitive rate limiter', () => {
      expect(rateLimiters.sensitive).toBeDefined();
    });

    it('should have admin rate limiter', () => {
      expect(rateLimiters.admin).toBeDefined();
    });

    it('should have webhook rate limiter', () => {
      expect(rateLimiters.webhook).toBeDefined();
    });

    it('should have public rate limiter', () => {
      expect(rateLimiters.public).toBeDefined();
    });
  });
});

describe('Rate Limit Path Matching Edge Cases', () => {
  it('should handle paths with query parameters', () => {
    const limiter = getRateLimiterForPath('/api/auth/login?redirect=/dashboard');
    expect(limiter).toBe(rateLimiters.auth);
  });

  it('should handle paths with trailing slashes', () => {
    const limiter = getRateLimiterForPath('/api/admin/users/');
    expect(limiter).toBe(rateLimiters.admin);
  });

  it('should handle deep nested paths', () => {
    const limiter = getRateLimiterForPath('/api/admin/users/123/roles/456');
    expect(limiter).toBe(rateLimiters.admin);
  });

  it('should handle sensitive keyword anywhere in path', () => {
    const paths = [
      '/api/v2/customer/merge',
      '/api/billing/subscription/upgrade',
      '/api/appointments/pet/123',
    ];

    paths.forEach((path) => {
      const limiter = getRateLimiterForPath(path);
      expect(limiter).toBe(rateLimiters.sensitive);
    });
  });
});
