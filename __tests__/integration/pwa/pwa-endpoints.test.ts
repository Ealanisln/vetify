/**
 * PWA API Endpoints Integration Tests
 *
 * Tests the API endpoints that support PWA functionality:
 * - /api/version (cached for PWA)
 * - /api/health (used for connectivity checks)
 */

// Mock Prisma for health check
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn((callback) => callback({ setLevel: jest.fn(), setTag: jest.fn(), setExtra: jest.fn() })),
}));

// Mock version module
jest.mock('@/lib/version', () => ({
  getVersionInfo: jest.fn(() => ({
    version: '1.1.0',
    versionString: 'v1.1.0',
    major: 1,
    minor: 1,
    patch: 0,
    buildTime: '2024-01-01T00:00:00.000Z',
  })),
  APP_VERSION: '1.1.0',
}));

// Mock createSecureResponse
jest.mock('@/lib/security/input-sanitization', () => ({
  createSecureResponse: jest.fn((data, status = 200, headers = {}) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }),
}));

import { GET as getVersion } from '@/app/api/version/route';
import { GET as getHealth } from '@/app/api/health/route';
import { prisma } from '@/lib/prisma';

describe('PWA API Endpoints Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/version', () => {
    it('should return version information successfully', async () => {
      const response = await getVersion();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('versionString');
      expect(data).toHaveProperty('buildTime');
    });

    it('should include proper version format', async () => {
      const response = await getVersion();
      const data = await response.json();

      expect(data.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(data.versionString).toMatch(/^v\d+\.\d+\.\d+/);
    });

    it('should have cache headers for PWA caching', async () => {
      const response = await getVersion();

      // Check that the response has cache headers
      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('max-age');
    });

    it('should include major, minor, patch version numbers', async () => {
      const response = await getVersion();
      const data = await response.json();

      expect(data).toHaveProperty('major');
      expect(data).toHaveProperty('minor');
      expect(data).toHaveProperty('patch');
      expect(typeof data.major).toBe('number');
      expect(typeof data.minor).toBe('number');
      expect(typeof data.patch).toBe('number');
    });
  });

  describe('GET /api/health', () => {
    describe('Healthy State', () => {
      it('should return healthy status when all checks pass', async () => {
        // Mock successful database query
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

        // Mock successful Redis (no Redis configured in test)
        const originalEnv = process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_URL;

        const response = await getHealth();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.status).toBe('healthy');
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('version');
        expect(data).toHaveProperty('checks');

        process.env.UPSTASH_REDIS_REST_URL = originalEnv;
      });

      it('should include database health check', async () => {
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

        const response = await getHealth();
        const data = await response.json();

        expect(data.checks).toHaveProperty('database');
        expect(data.checks.database).toHaveProperty('status');
        expect(data.checks.database).toHaveProperty('responseTime');
      });

      it('should include memory health check', async () => {
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

        const response = await getHealth();
        const data = await response.json();

        expect(data.checks).toHaveProperty('memory');
        expect(data.checks.memory).toHaveProperty('status');
        expect(data.checks.memory).toHaveProperty('usage');
      });

      it('should include response time in health data', async () => {
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

        const response = await getHealth();
        const data = await response.json();

        expect(data).toHaveProperty('responseTime');
        expect(typeof data.responseTime).toBe('number');
      });
    });

    describe('Degraded State', () => {
      it('should return degraded status when database fails', async () => {
        (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

        const response = await getHealth();
        const data = await response.json();

        expect(data.status).toBe('degraded');
        expect(data.checks.database.status).toBe('unhealthy');
      });
    });

    describe('Response Format', () => {
      it('should include environment information', async () => {
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

        const response = await getHealth();
        const data = await response.json();

        expect(data).toHaveProperty('environment');
      });

      it('should include uptime information', async () => {
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

        const response = await getHealth();
        const data = await response.json();

        expect(data).toHaveProperty('uptime');
        expect(typeof data.uptime).toBe('number');
      });

      it('should include ISO timestamp', async () => {
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

        const response = await getHealth();
        const data = await response.json();

        expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    });
  });
});

describe('PWA Caching Strategy Validation', () => {
  describe('Static API Endpoints (StaleWhileRevalidate)', () => {
    it('version endpoint should be suitable for caching', async () => {
      // The version endpoint returns static data that rarely changes
      const response = await getVersion();
      const data = await response.json();

      // Verify the data structure is consistent (cacheable)
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('buildTime');

      // Same call should return same structure
      const response2 = await getVersion();
      const data2 = await response2.json();

      expect(data.version).toBe(data2.version);
      expect(data.buildTime).toBe(data2.buildTime);
    });

    it('health endpoint should return real-time data', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      // Health endpoint should have dynamic data
      const response = await getHealth();
      const data = await response.json();

      // Response time should vary (even if slightly)
      expect(data).toHaveProperty('responseTime');
      expect(data).toHaveProperty('timestamp');
    });
  });
});
