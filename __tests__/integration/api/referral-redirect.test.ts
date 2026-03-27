/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';

// Mock referral queries
const mockResolveReferralCode = jest.fn();
const mockIncrementClickCount = jest.fn();

jest.mock('@/lib/referrals/queries', () => ({
  resolveReferralCode: (...args: any[]) => mockResolveReferralCode(...args),
  incrementClickCount: (...args: any[]) => mockIncrementClickCount(...args),
}));

// We need to extend the NextResponse mock to support redirect and cookies
// Override the next/server mock for this test file
let capturedRedirectUrl: string | null = null;
let capturedCookies: Array<{ name: string; value: string; options: any }> = [];

jest.mock('next/server', () => {
  class MockHeaders {
    _headers: Map<string, string>;
    constructor(init: Record<string, string> = {}) {
      this._headers = new Map(Object.entries(init));
    }
    get(name: string) { return this._headers.get(name.toLowerCase()) || null; }
    set(name: string, value: string) { this._headers.set(name.toLowerCase(), value); }
    has(name: string) { return this._headers.has(name.toLowerCase()); }
  }

  class MockNextRequest {
    url: string;
    method: string;
    _body: any;
    _headers: MockHeaders;
    nextUrl: URL;
    constructor(url: string, options: any = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this._body = options.body;
      this._headers = new MockHeaders(options.headers || {});
      this.nextUrl = new URL(url);
    }
    get headers() { return this._headers; }
    async json() { return typeof this._body === 'string' ? JSON.parse(this._body) : this._body; }
  }

  class MockCookies {
    set(name: string, value: string, options: any = {}) {
      capturedCookies.push({ name, value, options });
    }
  }

  class MockNextResponse {
    _body: any;
    status: number;
    _headers: MockHeaders;
    cookies: MockCookies;
    _jsonBody: any;

    constructor(body: any, options: any = {}) {
      this._body = body;
      this.status = options.status || 200;
      this._headers = new MockHeaders(options.headers || {});
      this.cookies = new MockCookies();
    }

    static json(body: any, options: any = {}) {
      const response = new MockNextResponse(JSON.stringify(body), options);
      response._jsonBody = body;
      return response;
    }

    static redirect(url: string) {
      capturedRedirectUrl = url;
      const response = new MockNextResponse(null, { status: 302 });
      return response;
    }

    async json() {
      if (this._jsonBody !== undefined) return this._jsonBody;
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  };
});

// Import after mocks
import { GET } from '@/app/api/ref/[code]/route';
import { NextRequest } from 'next/server';

describe('Referral Redirect API Integration Tests', () => {
  const createParams = (code: string) => ({ params: Promise.resolve({ code }) });

  beforeEach(() => {
    jest.clearAllMocks();
    capturedRedirectUrl = null;
    capturedCookies = [];
    process.env.NEXT_PUBLIC_BASE_URL = 'https://vetify.pro';
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/ref/[code]', () => {
    it('should redirect to /precios with ref param for valid code', async () => {
      mockResolveReferralCode.mockResolvedValue({
        id: 'code-1',
        code: 'DRSMITH',
        partner: { id: 'partner-1', name: 'Dr. Smith', email: 'dr@test.com', commissionPercent: 20 },
      });
      mockIncrementClickCount.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/ref/DRSMITH');
      await GET(request, createParams('DRSMITH'));

      expect(capturedRedirectUrl).toContain('/precios');
      expect(capturedRedirectUrl).toContain('ref=DRSMITH');
      expect(mockResolveReferralCode).toHaveBeenCalledWith('DRSMITH');
    });

    it('should redirect to /precios without ref param for invalid code', async () => {
      mockResolveReferralCode.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/ref/INVALID');
      await GET(request, createParams('INVALID'));

      expect(capturedRedirectUrl).toBe('https://vetify.pro/precios');
      expect(mockIncrementClickCount).not.toHaveBeenCalled();
    });

    it('should increment click count for valid code', async () => {
      mockResolveReferralCode.mockResolvedValue({
        id: 'code-1',
        code: 'DRSMITH',
        partner: { id: 'partner-1' },
      });
      mockIncrementClickCount.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/ref/drsmith');
      await GET(request, createParams('drsmith'));

      expect(mockIncrementClickCount).toHaveBeenCalledWith('code-1');
    });

    it('should set attribution cookie for 30 days', async () => {
      mockResolveReferralCode.mockResolvedValue({
        id: 'code-1',
        code: 'DRSMITH',
        partner: { id: 'partner-1' },
      });
      mockIncrementClickCount.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/ref/DRSMITH');
      await GET(request, createParams('DRSMITH'));

      expect(capturedCookies).toHaveLength(1);
      expect(capturedCookies[0].name).toBe('vetify_ref');
      expect(capturedCookies[0].value).toBe('DRSMITH');
      expect(capturedCookies[0].options.maxAge).toBe(30 * 24 * 60 * 60);
      expect(capturedCookies[0].options.httpOnly).toBe(false);
      expect(capturedCookies[0].options.sameSite).toBe('lax');
      expect(capturedCookies[0].options.path).toBe('/');
    });

    it('should not fail if incrementClickCount throws', async () => {
      mockResolveReferralCode.mockResolvedValue({
        id: 'code-1',
        code: 'DRSMITH',
        partner: { id: 'partner-1' },
      });
      // The function catches errors from the promise, so we just test it doesn't break the flow
      mockIncrementClickCount.mockRejectedValue(new Error('DB error'));

      const request = new NextRequest('http://localhost:3000/api/ref/DRSMITH');

      // Should not throw
      await expect(GET(request, createParams('DRSMITH'))).resolves.toBeDefined();
      expect(capturedRedirectUrl).toContain('/precios');
    });

    it('should handle case-insensitive code lookup', async () => {
      mockResolveReferralCode.mockResolvedValue({
        id: 'code-1',
        code: 'DRSMITH',
        partner: { id: 'partner-1' },
      });
      mockIncrementClickCount.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/ref/DrSmith');
      await GET(request, createParams('DrSmith'));

      // resolveReferralCode handles uppercasing internally
      expect(mockResolveReferralCode).toHaveBeenCalledWith('DrSmith');
      expect(capturedRedirectUrl).toContain('ref=DRSMITH');
    });
  });
});
