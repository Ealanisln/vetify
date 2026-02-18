/**
 * Tests for src/middleware.ts
 *
 * Tests the middleware chain: rate limiting, auth, security headers,
 * route protection, webhook handling, and admin access control.
 *
 * Uses the MockNextRequest/MockNextResponse from jest.setup.cjs.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Use var for hoisted mock references (jest.mock is hoisted above const/let)
let mockGetUser: jest.Mock;
let mockCheckRateLimit: jest.Mock;
let mockGetClientIdentifier: jest.Mock;
let mockCreateRateLimitHeaders: jest.Mock;
let mockIsRateLimitingEnabled: jest.Mock;
let mockLogSecurityEvent: jest.Mock;
let mockAuditMiddleware: jest.Mock;
let mockCsrfMiddleware: jest.Mock;
let nextResponseHeaders: Map<string, string>;
let redirectCalls: Array<{ url: string }>;

// Override the global next/server mock from jest.setup.cjs
// to add NextResponse.next() and NextResponse.redirect()
jest.mock('next/server', () => {
  class MockHeaders {
    _headers: Map<string, string>;
    constructor(init: Record<string, string> = {}) {
      this._headers = new Map(Object.entries(init));
    }
    get(name: string) { return this._headers.get(name.toLowerCase()) || null; }
    set(name: string, value: string) { this._headers.set(name.toLowerCase(), value); }
    has(name: string) { return this._headers.has(name.toLowerCase()); }
    delete(name: string) { this._headers.delete(name.toLowerCase()); }
    entries() { return this._headers.entries(); }
    forEach(callback: any) { this._headers.forEach(callback); }
  }

  class MockNextRequest {
    url: string;
    method: string;
    _body: any;
    _headers: MockHeaders;
    nextUrl: URL;
    constructor(url: string | URL, options: any = {}) {
      const urlStr = url instanceof URL ? url.toString() : url;
      this.url = urlStr;
      this.method = options.method || 'GET';
      this._body = options.body;
      this._headers = new MockHeaders(options.headers || {});
      this.nextUrl = new URL(urlStr);
    }
    get headers() { return this._headers; }
    async json() { return typeof this._body === 'string' ? JSON.parse(this._body) : this._body; }
    async text() { return typeof this._body === 'string' ? this._body : JSON.stringify(this._body); }
  }

  class MockNextResponse {
    _body: any;
    status: number;
    _headers: MockHeaders;
    _jsonBody?: any;
    constructor(body?: any, options: any = {}) {
      this._body = body;
      this.status = options.status || 200;
      this._headers = new MockHeaders(options.headers || {});
    }
    static json(body: any, options: any = {}) {
      const response = new MockNextResponse(JSON.stringify(body), options);
      response._jsonBody = body;
      return response;
    }
    static next() {
      nextResponseHeaders = new Map();
      const resp = new MockNextResponse(null, { status: 200 });
      resp._headers = new MockHeaders({}) as any;
      // Intercept set calls to track headers
      const origSet = resp._headers.set.bind(resp._headers);
      resp._headers.set = (name: string, value: string) => {
        origSet(name, value);
        nextResponseHeaders.set(name.toLowerCase(), value);
      };
      return resp;
    }
    static redirect(url: URL) {
      redirectCalls.push({ url: url.toString() });
      const resp = new MockNextResponse(null, { status: 307 });
      resp._headers.set('location', url.toString());
      return resp;
    }
    get headers() { return this._headers; }
    async json() {
      if (this._jsonBody !== undefined) return this._jsonBody;
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
    }
    async text() { return typeof this._body === 'string' ? this._body : JSON.stringify(this._body); }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: MockNextRequest,
  };
});

jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: () => ({
    getUser: (...args: any[]) => mockGetUser(...args),
  }),
}));

jest.mock('@kinde-oss/kinde-auth-nextjs/middleware', () => ({
  withAuth: (fn: any) => fn,
}));

jest.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
  getClientIdentifier: (...args: any[]) => mockGetClientIdentifier(...args),
  createRateLimitHeaders: (...args: any[]) => mockCreateRateLimitHeaders(...args),
  isRateLimitingEnabled: () => mockIsRateLimitingEnabled(),
}));

jest.mock('@/lib/security/audit-logger', () => ({
  logSecurityEvent: (...args: any[]) => mockLogSecurityEvent(...args),
  createAuditMiddleware: () => (...args: any[]) => mockAuditMiddleware(...args),
}));

jest.mock('@/lib/security/input-sanitization', () => ({
  securityHeaders: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  },
}));

jest.mock('@/lib/security/csrf-protection', () => ({
  createCSRFMiddleware: () => (...args: any[]) => mockCsrfMiddleware(...args),
}));

import middleware from '@/middleware';
import { NextRequest } from 'next/server';

function createRequest(path: string, method: string = 'GET') {
  return new NextRequest(new URL(`http://localhost:3000${path}`), { method });
}

describe('middleware', () => {
  beforeEach(() => {
    mockGetUser = jest.fn().mockResolvedValue(null);
    mockCheckRateLimit = jest.fn().mockResolvedValue({
      success: true, limit: 100, remaining: 99, reset: new Date(),
    });
    mockGetClientIdentifier = jest.fn().mockReturnValue('test-client');
    mockCreateRateLimitHeaders = jest.fn().mockReturnValue({});
    mockIsRateLimitingEnabled = jest.fn().mockReturnValue(false);
    mockLogSecurityEvent = jest.fn().mockResolvedValue(undefined);
    mockAuditMiddleware = jest.fn().mockResolvedValue(undefined);
    mockCsrfMiddleware = jest.fn().mockResolvedValue(null);
    nextResponseHeaders = new Map();
    redirectCalls = [];
  });

  describe('security headers', () => {
    it('should add security headers to API responses', async () => {
      const req = createRequest('/api/health');
      await middleware(req);

      expect(nextResponseHeaders.get('x-content-type-options')).toBe('nosniff');
      expect(nextResponseHeaders.get('x-frame-options')).toBe('DENY');
    });

    it('should add security headers to dashboard responses', async () => {
      mockGetUser.mockResolvedValue({ id: 'user-1' });
      const req = createRequest('/dashboard');
      await middleware(req);

      expect(nextResponseHeaders.get('x-content-type-options')).toBe('nosniff');
    });

    it('should add security headers to default responses', async () => {
      const req = createRequest('/some-page');
      await middleware(req);

      expect(nextResponseHeaders.get('x-content-type-options')).toBe('nosniff');
    });
  });

  describe('API route handling', () => {
    it('should allow API routes through', async () => {
      const req = createRequest('/api/pets');
      const response = await middleware(req);
      expect(response).toBeDefined();
    });

    it('should log API access via audit middleware', async () => {
      const req = createRequest('/api/pets');
      await middleware(req);
      expect(mockAuditMiddleware).toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('should apply rate limiting when enabled for API routes', async () => {
      mockIsRateLimitingEnabled.mockReturnValue(true);
      mockCheckRateLimit.mockResolvedValue({
        success: false, limit: 100, remaining: 0,
        reset: new Date(Date.now() + 60000),
      });

      const req = createRequest('/api/pets');
      const response = await middleware(req);
      expect(response!.status).toBe(429);
    });

    it('should not rate limit when disabled', async () => {
      mockIsRateLimitingEnabled.mockReturnValue(false);
      const req = createRequest('/api/pets');
      await middleware(req);
      expect(mockCheckRateLimit).not.toHaveBeenCalled();
    });

    it('should log rate limit exceeded events', async () => {
      mockIsRateLimitingEnabled.mockReturnValue(true);
      mockCheckRateLimit.mockResolvedValue({
        success: false, limit: 100, remaining: 0,
        reset: new Date(Date.now() + 60000),
      });

      const req = createRequest('/api/pets');
      await middleware(req);

      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        req, 'rate_limit_exceeded', undefined,
        expect.objectContaining({ endpoint: '/api/pets' })
      );
    });

    it('should not rate limit non-API routes', async () => {
      mockIsRateLimitingEnabled.mockReturnValue(true);
      mockGetUser.mockResolvedValue({ id: 'user-1' });
      const req = createRequest('/dashboard');
      await middleware(req);
      expect(mockCheckRateLimit).not.toHaveBeenCalled();
    });
  });

  describe('CSRF protection', () => {
    it('should check CSRF for API routes when rate limiting passes', async () => {
      mockIsRateLimitingEnabled.mockReturnValue(true);
      const req = createRequest('/api/pets');
      await middleware(req);
      expect(mockCsrfMiddleware).toHaveBeenCalledWith(req);
    });

    it('should block request when CSRF validation fails', async () => {
      mockIsRateLimitingEnabled.mockReturnValue(true);
      mockCsrfMiddleware.mockResolvedValue({ status: 403 });
      const req = createRequest('/api/pets');
      const response = await middleware(req);
      expect(response!.status).toBe(403);
    });

    it('should log CSRF failure as security event', async () => {
      mockIsRateLimitingEnabled.mockReturnValue(true);
      mockCsrfMiddleware.mockResolvedValue({ status: 403 });
      const req = createRequest('/api/pets');
      await middleware(req);

      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        req, 'security_event', undefined,
        expect.objectContaining({ reason: 'CSRF validation failed' })
      );
    });
  });

  describe('webhook routes', () => {
    it('should allow webhook routes through', async () => {
      const req = createRequest('/api/webhooks/stripe');
      const response = await middleware(req);
      expect(response).toBeDefined();
    });

    it('should add security headers to webhook responses', async () => {
      const req = createRequest('/api/webhooks/stripe');
      await middleware(req);
      expect(nextResponseHeaders.get('x-content-type-options')).toBe('nosniff');
    });

    it('should log webhook access via audit middleware', async () => {
      const req = createRequest('/api/webhooks/stripe');
      await middleware(req);
      expect(mockAuditMiddleware).toHaveBeenCalled();
    });
  });

  describe('dashboard routes', () => {
    it('should allow authenticated users to access dashboard', async () => {
      mockGetUser.mockResolvedValue({ id: 'user-1' });
      const req = createRequest('/dashboard');
      await middleware(req);
      expect(redirectCalls).toHaveLength(0);
    });

    it('should allow access to dashboard settings without plan', async () => {
      mockGetUser.mockResolvedValue({ id: 'user-1' });
      const req = createRequest('/dashboard/settings');
      await middleware(req);
      expect(redirectCalls).toHaveLength(0);
    });

    it('should redirect to login on auth error in dashboard', async () => {
      mockGetUser.mockRejectedValue(new Error('Auth error'));
      const req = createRequest('/dashboard/pets');
      await middleware(req);

      expect(redirectCalls).toHaveLength(1);
      expect(redirectCalls[0].url).toContain('/api/auth/login');
    });

    it('should log dashboard access via audit middleware', async () => {
      mockGetUser.mockResolvedValue({ id: 'user-1' });
      const req = createRequest('/dashboard');
      await middleware(req);
      expect(mockAuditMiddleware).toHaveBeenCalledWith(req, 'user-1');
    });

    it('should log security event on dashboard error', async () => {
      mockGetUser.mockRejectedValue(new Error('Auth error'));
      const req = createRequest('/dashboard/pets');
      await middleware(req);

      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        req, 'security_event', undefined,
        expect.objectContaining({ error: 'Dashboard access error' })
      );
    });
  });

  describe('onboarding route', () => {
    it('should redirect unauthenticated users to login', async () => {
      mockGetUser.mockResolvedValue(null);
      const req = createRequest('/onboarding');
      await middleware(req);

      expect(redirectCalls).toHaveLength(1);
      expect(redirectCalls[0].url).toContain('/api/auth/login');
    });

    it('should allow authenticated users through', async () => {
      mockGetUser.mockResolvedValue({ id: 'user-1' });
      const req = createRequest('/onboarding');
      await middleware(req);
      expect(redirectCalls).toHaveLength(0);
      expect(nextResponseHeaders.get('x-content-type-options')).toBe('nosniff');
    });

    it('should log unauthenticated onboarding access as permission_denied', async () => {
      mockGetUser.mockResolvedValue(null);
      const req = createRequest('/onboarding');
      await middleware(req);

      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        req, 'permission_denied', undefined,
        expect.objectContaining({ reason: 'Unauthenticated onboarding access' })
      );
    });

    it('should redirect to login on onboarding error', async () => {
      mockGetUser.mockRejectedValue(new Error('Session error'));
      const req = createRequest('/onboarding');
      await middleware(req);
      expect(redirectCalls.length).toBeGreaterThan(0);
    });
  });

  describe('admin routes', () => {
    it('should redirect unauthenticated users to login', async () => {
      mockGetUser.mockResolvedValue(null);
      const req = createRequest('/admin');
      await middleware(req);

      expect(redirectCalls).toHaveLength(1);
      expect(redirectCalls[0].url).toContain('/api/auth/login');
    });

    it('should allow authenticated users through to admin', async () => {
      mockGetUser.mockResolvedValue({ id: 'admin-user' });
      const req = createRequest('/admin');
      await middleware(req);
      expect(redirectCalls).toHaveLength(0);
    });

    it('should log admin access attempts', async () => {
      mockGetUser.mockResolvedValue({ id: 'admin-user' });
      const req = createRequest('/admin/dashboard');
      await middleware(req);

      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        req, 'security_event', 'admin-user',
        expect.objectContaining({ action: 'admin_access_attempt' })
      );
    });

    it('should redirect to login on admin auth error', async () => {
      mockGetUser.mockRejectedValue(new Error('Auth error'));
      const req = createRequest('/admin');
      await middleware(req);
      expect(redirectCalls.length).toBeGreaterThan(0);
    });
  });

  describe('config matcher', () => {
    it('should export matcher config', async () => {
      const { config } = await import('@/middleware');
      expect(config.matcher).toBeDefined();
      expect(config.matcher).toContain('/dashboard/:path*');
      expect(config.matcher).toContain('/onboarding');
      expect(config.matcher).toContain('/admin/:path*');
    });
  });
});
