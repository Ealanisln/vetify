/**
 * Tests for src/middleware.ts — unauthenticated API requests.
 *
 * Kinde's `withAuth` redirects every matched path without a session to
 * /api/auth/login. For browser `fetch()` calls against /api/* that redirect is
 * useless: the client follows it to the Kinde issuer and the CSP connect-src
 * directive blocks it, logging a console error on every public page load
 * (Nav fetches /api/user for logged-out visitors). API callers must get a 401
 * JSON response instead, while page routes keep the login redirect.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

let mockGetUser: jest.Mock;
let mockHasKindeSession: jest.Mock;
let redirectCalls: Array<{ url: string }>;

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
    getAll() { return []; }
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
  }

  return { NextResponse: MockNextResponse, NextRequest: MockNextRequest };
});

jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: () => ({
    getUser: (...args: any[]) => mockGetUser(...args),
  }),
}));

// Mirrors Kinde's authMiddleware: without tokens it redirects to login before
// the wrapped middleware ever runs.
jest.mock('@kinde-oss/kinde-auth-nextjs/middleware', () => ({
  withAuth: (fn: any) => async (req: any) => {
    const { NextResponse } = jest.requireMock('next/server');
    if (!mockHasKindeSession()) {
      return NextResponse.redirect(new URL('/api/auth/login', req.url));
    }
    return fn(req);
  },
}));

jest.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: jest.fn(),
  getClientIdentifier: jest.fn(),
  createRateLimitHeaders: jest.fn(),
  isRateLimitingEnabled: () => false,
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

import middleware from '@/middleware';
import { NextRequest } from 'next/server';

function createRequest(path: string) {
  return new NextRequest(new URL(`http://localhost:3000${path}`));
}

describe('middleware — unauthenticated API requests', () => {
  beforeEach(() => {
    mockGetUser = jest.fn().mockResolvedValue(null);
    mockHasKindeSession = jest.fn().mockReturnValue(false);
    redirectCalls = [];
  });

  it('answers 401 JSON instead of redirecting fetch("/api/user") to login', async () => {
    const response: any = await middleware(createRequest('/api/user'));

    expect(response.status).toBe(401);
    expect(response.headers.get('location')).toBeNull();
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('keeps security headers on the 401 response', async () => {
    const response: any = await middleware(createRequest('/api/user'));

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('still redirects unauthenticated page requests to login', async () => {
    const response: any = await middleware(createRequest('/dashboard'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/api/auth/login');
  });

  it('turns the admin API login redirect into a 401 as well', async () => {
    // Kinde session exists but the app-level admin check finds no user
    mockHasKindeSession.mockReturnValue(true);
    mockGetUser.mockResolvedValue(null);

    const response: any = await middleware(createRequest('/api/admin/stats'));

    expect(response.status).toBe(401);
    expect(redirectCalls).toHaveLength(1);
  });

  it('lets authenticated API requests through untouched', async () => {
    mockHasKindeSession.mockReturnValue(true);
    mockGetUser.mockResolvedValue({ id: 'user-1' });

    const response: any = await middleware(createRequest('/api/user'));

    expect(response.status).toBe(200);
  });
});
