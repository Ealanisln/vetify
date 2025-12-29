/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import {
  generateCSRFToken,
  verifyCSRFToken,
  createCSRFMiddleware,
  getCSRFTokenForSession,
  csrfHeaders,
} from '@/lib/security/csrf-protection';

// Mock crypto.getRandomValues for consistent testing
const mockGetRandomValues = jest.fn((array: Uint8Array) => {
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
});

Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: mockGetRandomValues,
  },
});

describe('csrf-protection', () => {
  describe('generateCSRFToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateCSRFToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique tokens on each call', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });

    it('should call crypto.getRandomValues', () => {
      generateCSRFToken();
      expect(mockGetRandomValues).toHaveBeenCalled();
    });

    it('should use 32 bytes of randomness', () => {
      generateCSRFToken();
      const lastCall = mockGetRandomValues.mock.calls[mockGetRandomValues.mock.calls.length - 1];
      expect(lastCall[0]).toHaveLength(32);
    });
  });

  describe('verifyCSRFToken', () => {
    const expectedToken = 'valid-csrf-token-12345';

    it('should return true for matching token in x-csrf-token header', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-csrf-token': expectedToken },
      });
      expect(verifyCSRFToken(request, expectedToken)).toBe(true);
    });

    it('should return true for matching token in x-csrf-form-token header', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-csrf-form-token': expectedToken },
      });
      expect(verifyCSRFToken(request, expectedToken)).toBe(true);
    });

    it('should return false when no token is provided', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      expect(verifyCSRFToken(request, expectedToken)).toBe(false);
    });

    it('should return false for mismatched token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-csrf-token': 'wrong-token' },
      });
      expect(verifyCSRFToken(request, expectedToken)).toBe(false);
    });

    it('should return false for token with different length', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-csrf-token': 'short' },
      });
      expect(verifyCSRFToken(request, expectedToken)).toBe(false);
    });

    it('should be case sensitive', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-csrf-token': expectedToken.toUpperCase() },
      });
      expect(verifyCSRFToken(request, expectedToken)).toBe(false);
    });
  });

  describe('createCSRFMiddleware', () => {
    const middleware = createCSRFMiddleware();

    describe('skipping safe methods', () => {
      it('should skip CSRF check for GET requests', async () => {
        const request = new NextRequest('http://localhost:3000/api/data', {
          method: 'GET',
        });
        const result = await middleware(request);
        expect(result).toBeNull();
      });

      it('should skip CSRF check for HEAD requests', async () => {
        const request = new NextRequest('http://localhost:3000/api/data', {
          method: 'HEAD',
        });
        const result = await middleware(request);
        expect(result).toBeNull();
      });

      it('should skip CSRF check for OPTIONS requests', async () => {
        const request = new NextRequest('http://localhost:3000/api/data', {
          method: 'OPTIONS',
        });
        const result = await middleware(request);
        expect(result).toBeNull();
      });
    });

    describe('skipping specified paths', () => {
      it('should skip CSRF check for webhook paths', async () => {
        const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
          method: 'POST',
        });
        const result = await middleware(request);
        expect(result).toBeNull();
      });

      it('should skip CSRF check for auth callback paths', async () => {
        const request = new NextRequest('http://localhost:3000/api/auth/callback', {
          method: 'POST',
        });
        const result = await middleware(request);
        expect(result).toBeNull();
      });
    });

    describe('origin validation', () => {
      it('should reject requests without origin or referer', async () => {
        const request = new NextRequest('http://localhost:3000/api/data', {
          method: 'POST',
        });
        const result = await middleware(request);
        expect(result).not.toBeNull();
        expect(result?.status).toBe(403);
      });

      it('should accept requests from localhost:3000', async () => {
        const request = new NextRequest('http://localhost:3000/api/data', {
          method: 'POST',
          headers: { origin: 'http://localhost:3000' },
        });
        const result = await middleware(request);
        expect(result).toBeNull();
      });

      it('should accept requests from 127.0.0.1:3000', async () => {
        const request = new NextRequest('http://localhost:3000/api/data', {
          method: 'POST',
          headers: { origin: 'http://127.0.0.1:3000' },
        });
        const result = await middleware(request);
        expect(result).toBeNull();
      });

      it('should accept requests with valid referer', async () => {
        const request = new NextRequest('http://localhost:3000/api/data', {
          method: 'POST',
          headers: { referer: 'http://localhost:3000/dashboard' },
        });
        const result = await middleware(request);
        expect(result).toBeNull();
      });

      it('should reject requests from invalid origin', async () => {
        const request = new NextRequest('http://localhost:3000/api/data', {
          method: 'POST',
          headers: { origin: 'http://evil.com' },
        });
        const result = await middleware(request);
        expect(result).not.toBeNull();
        expect(result?.status).toBe(403);
      });
    });

    describe('custom options', () => {
      it('should respect custom skipForMethods', async () => {
        const customMiddleware = createCSRFMiddleware({
          skipForMethods: ['GET', 'POST'],
        });
        const request = new NextRequest('http://localhost:3000/api/data', {
          method: 'POST',
        });
        const result = await customMiddleware(request);
        expect(result).toBeNull();
      });

      it('should respect custom skipForPaths', async () => {
        const customMiddleware = createCSRFMiddleware({
          skipForPaths: ['/api/public/'],
        });
        const request = new NextRequest('http://localhost:3000/api/public/endpoint', {
          method: 'POST',
        });
        const result = await customMiddleware(request);
        expect(result).toBeNull();
      });

      it('should use default options when none provided', async () => {
        const defaultMiddleware = createCSRFMiddleware();
        const request = new NextRequest('http://localhost:3000/api/data', {
          method: 'DELETE',
        });
        const result = await defaultMiddleware(request);
        expect(result).not.toBeNull();
        expect(result?.status).toBe(403);
      });
    });
  });

  describe('getCSRFTokenForSession', () => {
    it('should generate a token string', () => {
      const token = getCSRFTokenForSession('session-123');
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate different tokens for different sessions', () => {
      const token1 = getCSRFTokenForSession('session-1');
      const token2 = getCSRFTokenForSession('session-2');
      expect(token1).not.toBe(token2);
    });

    it('should be a hex string', () => {
      const token = getCSRFTokenForSession('session-123');
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate consistent format', () => {
      const token = getCSRFTokenForSession('test');
      expect(token.length).toBeGreaterThan(0);
      expect(token.length).toBeLessThan(20);
    });
  });

  describe('csrfHeaders', () => {
    it('should have X-Frame-Options set to DENY', () => {
      expect(csrfHeaders['X-Frame-Options']).toBe('DENY');
    });

    it('should have X-Content-Type-Options set to nosniff', () => {
      expect(csrfHeaders['X-Content-Type-Options']).toBe('nosniff');
    });

    it('should have Referrer-Policy set to same-origin', () => {
      expect(csrfHeaders['Referrer-Policy']).toBe('same-origin');
    });

    it('should contain exactly 3 headers', () => {
      expect(Object.keys(csrfHeaders)).toHaveLength(3);
    });

  });

  describe('constant-time comparison security', () => {
    it('should reject tokens of different lengths', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-csrf-token': 'a' },
      });
      expect(verifyCSRFToken(request, 'abcd')).toBe(false);
    });

    it('should reject tokens that differ in first character', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-csrf-token': 'Xbcd' },
      });
      expect(verifyCSRFToken(request, 'abcd')).toBe(false);
    });

    it('should reject tokens that differ in last character', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-csrf-token': 'abcX' },
      });
      expect(verifyCSRFToken(request, 'abcd')).toBe(false);
    });

    it('should reject empty token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-csrf-token': '' },
      });
      expect(verifyCSRFToken(request, 'expected')).toBe(false);
    });
  });
});
