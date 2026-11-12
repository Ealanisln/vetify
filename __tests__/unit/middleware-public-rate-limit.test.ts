/**
 * Tests for src/middleware.ts — rate limiting of the public API.
 *
 * /api/public/* is anonymous (public booking, customer lookup, analytics...),
 * so it must bypass Kinde but still go through rateLimiters.public. These
 * tests run the real middleware and the real rate-limiter module; only the
 * Upstash client is replaced by an in-memory counter that honours the window
 * size configured in rate-limiter.ts.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const mockUpstash = {
  counters: new Map<string, number>(),
  unreachable: false,
};

jest.mock('@upstash/redis', () => ({
  Redis: class {},
}));

jest.mock('@upstash/ratelimit', () => {
  class Ratelimit {
    opts: any;
    static slidingWindow(tokens: number, window: string) {
      return { tokens, window };
    }
    constructor(opts: any) {
      this.opts = opts;
    }
    async limit(identifier: string) {
      if (mockUpstash.unreachable) throw new Error('fetch failed');
      const key = `${this.opts.prefix}:${identifier}`;
      const count = (mockUpstash.counters.get(key) ?? 0) + 1;
      mockUpstash.counters.set(key, count);
      const tokens = this.opts.limiter.tokens;
      return {
        success: count <= tokens,
        limit: tokens,
        remaining: Math.max(0, tokens - count),
        reset: Date.now() + 60_000,
      };
    }
  }
  return { Ratelimit };
});

jest.mock('next/server', () => {
  class MockHeaders {
    _headers: Map<string, string>;
    constructor(init: Record<string, string> = {}) {
      this._headers = new Map(Object.entries(init).map(([k, v]) => [k.toLowerCase(), v]));
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
    _headers: MockHeaders;
    nextUrl: URL;
    constructor(url: string | URL, options: any = {}) {
      const urlStr = url instanceof URL ? url.toString() : url;
      this.url = urlStr;
      this.method = options.method || 'GET';
      this._headers = new MockHeaders(options.headers || {});
      this.nextUrl = new URL(urlStr);
    }
    get headers() { return this._headers; }
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
      return new MockNextResponse(null, { status: 200 });
    }
    static redirect(url: URL) {
      const resp = new MockNextResponse(null, { status: 307 });
      resp._headers.set('location', url.toString());
      return resp;
    }
    get headers() { return this._headers; }
    async json() {
      if (this._jsonBody !== undefined) return this._jsonBody;
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
    }
  }

  return { NextResponse: MockNextResponse, NextRequest: MockNextRequest };
});

jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: () => ({
    getUser: async () => null,
  }),
}));

// Mirrors Kinde's authMiddleware: anonymous requests are sent to login.
jest.mock('@kinde-oss/kinde-auth-nextjs/middleware', () => ({
  withAuth: () => async (req: any) => {
    const { NextResponse } = jest.requireMock('next/server');
    return NextResponse.redirect(new URL('/api/auth/login', req.url));
  },
}));

jest.mock('@/lib/security/audit-logger', () => ({
  logSecurityEvent: jest.fn().mockResolvedValue(undefined),
  createAuditMiddleware: () => jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/security/input-sanitization', () => ({
  securityHeaders: { 'X-Content-Type-Options': 'nosniff' },
}));

jest.mock('@/lib/security/csrf-protection', () => ({
  createCSRFMiddleware: () => jest.fn().mockResolvedValue(null),
}));

import middleware, { config } from '@/middleware';
import { NextRequest } from 'next/server';
import { logSecurityEvent } from '@/lib/security/audit-logger';

const PUBLIC_LIMIT_PER_MINUTE = 20; // rateLimiters.public in src/lib/security/rate-limiter.ts

function publicRequest(path: string, method: string, ip = '203.0.113.7') {
  return new NextRequest(new URL(`http://localhost:3000${path}`), {
    method,
    headers: { 'x-vercel-id': 'iad1::abc', 'x-real-ip': ip },
  });
}

async function send(path: string, method: string, times: number, ip?: string) {
  const responses = [];
  for (let i = 0; i < times; i++) {
    responses.push(await middleware(publicRequest(path, method, ip)));
  }
  return responses;
}

describe('middleware: public API rate limiting', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    mockUpstash.counters.clear();
    mockUpstash.unreachable = false;
    (logSecurityEvent as jest.Mock).mockClear();
    process.env = {
      ...originalEnv,
      UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'token',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('runs the middleware on /api/public/*', () => {
    expect(config.matcher).toContain('/api/public/:path*');
  });

  it('lets anonymous visitors reach public routes instead of redirecting to login', async () => {
    const [response] = await send('/api/public/appointments', 'POST', 1);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it.each(['/api/public/customer-lookup', '/api/public/appointments'])(
    'answers 429 in Spanish once %s goes over the per-minute limit',
    async (path) => {
      const allowed = await send(path, 'POST', PUBLIC_LIMIT_PER_MINUTE);
      expect(allowed.map((r) => r.status)).toEqual(Array(PUBLIC_LIMIT_PER_MINUTE).fill(200));

      const [blocked] = await send(path, 'POST', 1);
      expect(blocked.status).toBe(429);
      const body = await (blocked as any).json();
      expect(body.error).toBe('Demasiadas solicitudes. Espera un minuto e intenta de nuevo.');
      expect(body.retryAfter).toBeGreaterThan(0);
      expect(logSecurityEvent).toHaveBeenCalledWith(
        expect.anything(),
        'rate_limit_exceeded',
        undefined,
        expect.objectContaining({ endpoint: path })
      );
    }
  );

  it('keeps a separate budget per route so lookups cannot block the booking', async () => {
    await send('/api/public/customer-lookup', 'POST', PUBLIC_LIMIT_PER_MINUTE + 1);

    const [booking] = await send('/api/public/appointments', 'POST', 1);
    expect(booking.status).toBe(200);
  });

  it('counts each client separately', async () => {
    await send('/api/public/customer-lookup', 'POST', PUBLIC_LIMIT_PER_MINUTE + 1, '203.0.113.7');

    const [otherClient] = await send('/api/public/customer-lookup', 'POST', 1, '198.51.100.9');
    expect(otherClient.status).toBe(200);
  });

  it('does not limit public GET routes', async () => {
    const responses = await send('/api/public/availability?tenantSlug=x&date=2026-11-16', 'GET', 30);

    expect(responses.every((r) => r.status === 200)).toBe(true);
    expect(mockUpstash.counters.size).toBe(0);
  });

  it('fails open when Upstash is unreachable', async () => {
    mockUpstash.unreachable = true;
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const responses = await send('/api/public/appointments', 'POST', PUBLIC_LIMIT_PER_MINUTE + 5);

    expect(responses.every((r) => r.status === 200)).toBe(true);
  });

  it('skips rate limiting when Upstash is not configured', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;

    const responses = await send('/api/public/appointments', 'POST', PUBLIC_LIMIT_PER_MINUTE + 5);

    expect(responses.every((r) => r.status === 200)).toBe(true);
    expect(mockUpstash.counters.size).toBe(0);
  });
});
