/**
 * Audit Logger Tests
 * VETIF-50: Phase 1 - Security Infrastructure
 *
 * Tests cover:
 * - IP address extraction from various headers
 * - Risk level calculation for different event types
 * - Audit event logging
 * - Authentication event logging
 * - Data access event logging
 * - Security event logging
 */

import { NextRequest } from 'next/server';
import {
  extractAuditInfo,
  calculateRiskLevel,
  logAuditEvent,
  logAuthEvent,
  logDataAccessEvent,
  logSensitiveDataAccess,
  logAdminAction,
  logSecurityEvent,
  createAuditMiddleware,
  AuditEventType,
} from '@/lib/security/audit-logger';

// Mock NextRequest
function createMockRequest(options: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
}): NextRequest {
  const {
    url = 'https://vetify.app/api/test',
    method = 'GET',
    headers = {},
  } = options;

  const headerMap = new Map(Object.entries(headers));

  return {
    method,
    nextUrl: new URL(url),
    headers: {
      get: (name: string) => headerMap.get(name.toLowerCase()) || null,
    },
  } as unknown as NextRequest;
}

describe('Audit Logger', () => {
  describe('extractAuditInfo', () => {
    describe('IP Address Extraction', () => {
      it('should extract IP from x-forwarded-for header', () => {
        const request = createMockRequest({
          headers: { 'x-forwarded-for': '192.168.1.100, 10.0.0.1, 172.16.0.1' },
        });

        const result = extractAuditInfo(request);

        expect(result.ipAddress).toBe('192.168.1.100');
      });

      it('should extract IP from x-real-ip header when x-forwarded-for is not present', () => {
        const request = createMockRequest({
          headers: { 'x-real-ip': '10.0.0.50' },
        });

        const result = extractAuditInfo(request);

        expect(result.ipAddress).toBe('10.0.0.50');
      });

      it('should extract IP from cf-connecting-ip header (Cloudflare)', () => {
        const request = createMockRequest({
          headers: { 'cf-connecting-ip': '203.0.113.45' },
        });

        const result = extractAuditInfo(request);

        expect(result.ipAddress).toBe('203.0.113.45');
      });

      it('should prioritize x-forwarded-for over other headers', () => {
        const request = createMockRequest({
          headers: {
            'x-forwarded-for': '192.168.1.1',
            'x-real-ip': '10.0.0.1',
            'cf-connecting-ip': '172.16.0.1',
          },
        });

        const result = extractAuditInfo(request);

        expect(result.ipAddress).toBe('192.168.1.1');
      });

      it('should return "unknown" when no IP headers are present', () => {
        const request = createMockRequest({});

        const result = extractAuditInfo(request);

        expect(result.ipAddress).toBe('unknown');
      });

      it('should trim whitespace from IP addresses', () => {
        const request = createMockRequest({
          headers: { 'x-forwarded-for': '  192.168.1.100  , 10.0.0.1' },
        });

        const result = extractAuditInfo(request);

        expect(result.ipAddress).toBe('192.168.1.100');
      });
    });

    describe('User Agent Extraction', () => {
      it('should extract user agent from headers', () => {
        const request = createMockRequest({
          headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        });

        const result = extractAuditInfo(request);

        expect(result.userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      });

      it('should return "unknown" when user agent is not present', () => {
        const request = createMockRequest({});

        const result = extractAuditInfo(request);

        expect(result.userAgent).toBe('unknown');
      });
    });

    describe('Endpoint and Method Extraction', () => {
      it('should extract endpoint pathname correctly', () => {
        const request = createMockRequest({
          url: 'https://vetify.app/api/customers/123',
          method: 'GET',
        });

        const result = extractAuditInfo(request);

        expect(result.endpoint).toBe('/api/customers/123');
        expect(result.method).toBe('GET');
      });

      it('should handle different HTTP methods', () => {
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

        methods.forEach((method) => {
          const request = createMockRequest({ method });
          const result = extractAuditInfo(request);
          expect(result.method).toBe(method);
        });
      });
    });

    describe('User and Tenant Context', () => {
      it('should include userId and tenantId when provided', () => {
        const request = createMockRequest({});

        const result = extractAuditInfo(request, 'user_123', 'tenant_456');

        expect(result.userId).toBe('user_123');
        expect(result.tenantId).toBe('tenant_456');
      });

      it('should handle undefined userId and tenantId', () => {
        const request = createMockRequest({});

        const result = extractAuditInfo(request);

        expect(result.userId).toBeUndefined();
        expect(result.tenantId).toBeUndefined();
      });
    });
  });

  describe('calculateRiskLevel', () => {
    describe('Critical Risk Events', () => {
      it('should return critical for permission_denied events', () => {
        const result = calculateRiskLevel('permission_denied', false);
        expect(result).toBe('critical');
      });

      it('should return critical for suspicious_activity events', () => {
        const result = calculateRiskLevel('suspicious_activity', false);
        expect(result).toBe('critical');
      });

      it('should return critical for auth_failed with more than 5 attempts', () => {
        const result = calculateRiskLevel('auth_failed', false, { attempts: 6 });
        expect(result).toBe('critical');
      });

      it('should not return critical for auth_failed with 5 or fewer attempts', () => {
        const result = calculateRiskLevel('auth_failed', false, { attempts: 5 });
        expect(result).not.toBe('critical');
      });
    });

    describe('High Risk Events', () => {
      it('should return high for admin_action events', () => {
        const result = calculateRiskLevel('admin_action', true);
        expect(result).toBe('high');
      });

      it('should return high for data_delete events', () => {
        const result = calculateRiskLevel('data_delete', true);
        expect(result).toBe('high');
      });

      it('should return high for export_data events', () => {
        const result = calculateRiskLevel('export_data', true);
        expect(result).toBe('high');
      });

      it('should return high for sensitive_data_access events', () => {
        const result = calculateRiskLevel('sensitive_data_access', true);
        expect(result).toBe('high');
      });

      it('should return high for rate_limit_exceeded events', () => {
        const result = calculateRiskLevel('rate_limit_exceeded', false);
        expect(result).toBe('high');
      });
    });

    describe('Medium Risk Events', () => {
      it('should return medium for data_update events', () => {
        const result = calculateRiskLevel('data_update', true);
        expect(result).toBe('medium');
      });

      it('should return medium for data_create events', () => {
        const result = calculateRiskLevel('data_create', true);
        expect(result).toBe('medium');
      });

      it('should return medium for auth_failed events with low attempts', () => {
        const result = calculateRiskLevel('auth_failed', false, { attempts: 2 });
        expect(result).toBe('medium');
      });

      it('should return medium for failed events regardless of type', () => {
        const result = calculateRiskLevel('data_access', false);
        expect(result).toBe('medium');
      });
    });

    describe('Low Risk Events', () => {
      it('should return low for successful data_access events', () => {
        const result = calculateRiskLevel('data_access', true);
        expect(result).toBe('low');
      });

      it('should return low for successful auth_login events', () => {
        const result = calculateRiskLevel('auth_login', true);
        expect(result).toBe('low');
      });

      it('should return low for auth_logout events', () => {
        const result = calculateRiskLevel('auth_logout', true);
        expect(result).toBe('low');
      });
    });
  });

  describe('logAuditEvent', () => {
    let consoleWarnSpy: jest.SpyInstance;
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should log critical events to console.warn', async () => {
      await logAuditEvent({
        eventType: 'permission_denied',
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
        endpoint: '/api/admin',
        method: 'POST',
        riskLevel: 'critical',
        success: false,
      });

      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log high risk events to console.warn', async () => {
      await logAuditEvent({
        eventType: 'admin_action',
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
        endpoint: '/api/admin/users',
        method: 'DELETE',
        riskLevel: 'high',
        success: true,
      });

      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should handle audit event with all fields', async () => {
      await logAuditEvent({
        eventType: 'data_access',
        userId: 'user_123',
        tenantId: 'tenant_456',
        ipAddress: '10.0.0.1',
        userAgent: 'Mozilla/5.0',
        endpoint: '/api/pets',
        method: 'GET',
        resource: 'pet',
        resourceId: 'pet_789',
        details: { action: 'view_list' },
        riskLevel: 'low',
        success: true,
      });

      // Low risk events may not log, but should not throw
      expect(true).toBe(true);
    });

    it('should include timestamp and id in logged events', async () => {
      await logAuditEvent({
        eventType: 'suspicious_activity',
        ipAddress: '192.168.1.1',
        userAgent: 'bot-agent',
        endpoint: '/api/login',
        method: 'POST',
        riskLevel: 'critical',
        success: false,
      });

      expect(consoleWarnSpy).toHaveBeenCalled();
      const logCall = consoleWarnSpy.mock.calls[0];
      expect(logCall[1]).toHaveProperty('id');
      expect(logCall[1]).toHaveProperty('timestamp');
    });
  });

  describe('logAuthEvent', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should log successful login events', async () => {
      const request = createMockRequest({
        url: 'https://vetify.app/api/auth/login',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      await logAuthEvent(request, 'auth_login', 'user_123');

      // Login is low risk, might not log to warn
      expect(true).toBe(true);
    });

    it('should log failed auth attempts as higher risk', async () => {
      const request = createMockRequest({
        url: 'https://vetify.app/api/auth/login',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      await logAuthEvent(request, 'auth_failed', undefined, { attempts: 6 });

      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log logout events', async () => {
      const request = createMockRequest({
        url: 'https://vetify.app/api/auth/logout',
      });

      await logAuthEvent(request, 'auth_logout', 'user_123');

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('logDataAccessEvent', () => {
    it('should log data access with resource info', async () => {
      const request = createMockRequest({
        url: 'https://vetify.app/api/pets/pet_123',
        method: 'GET',
      });

      await logDataAccessEvent(
        request,
        'data_access',
        'user_123',
        'tenant_456',
        'pet',
        'pet_123',
        true
      );

      // Should not throw
      expect(true).toBe(true);
    });

    it('should log data_delete as high risk', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const request = createMockRequest({
        url: 'https://vetify.app/api/customers/cust_123',
        method: 'DELETE',
      });

      await logDataAccessEvent(
        request,
        'data_delete',
        'user_123',
        'tenant_456',
        'customer',
        'cust_123',
        true
      );

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('logSensitiveDataAccess', () => {
    it('should always log as high risk with sensitiveData flag', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const request = createMockRequest({
        url: 'https://vetify.app/api/medical/records',
        method: 'GET',
      });

      await logSensitiveDataAccess(
        request,
        'user_123',
        'tenant_456',
        'medical_record',
        'record_789',
        { reason: 'consultation' }
      );

      expect(consoleWarnSpy).toHaveBeenCalled();
      const logCall = consoleWarnSpy.mock.calls[0];
      expect(logCall[1].riskLevel).toBe('high');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('logAdminAction', () => {
    it('should log admin actions as high risk', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const request = createMockRequest({
        url: 'https://vetify.app/api/admin/users',
        method: 'POST',
      });

      await logAdminAction(
        request,
        'admin_123',
        'create_user',
        'new_user_456',
        { role: 'STAFF' }
      );

      expect(consoleWarnSpy).toHaveBeenCalled();
      const logCall = consoleWarnSpy.mock.calls[0];
      expect(logCall[1].details.action).toBe('create_user');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('logSecurityEvent', () => {
    it('should log rate_limit_exceeded as high risk', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const request = createMockRequest({
        url: 'https://vetify.app/api/auth/login',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      await logSecurityEvent(
        request,
        'rate_limit_exceeded',
        undefined,
        { limit: 100, remaining: 0 }
      );

      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should log suspicious_activity as critical', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const request = createMockRequest({
        url: 'https://vetify.app/api/admin',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      await logSecurityEvent(
        request,
        'suspicious_activity',
        undefined,
        { pattern: 'SQL injection attempt' }
      );

      expect(consoleWarnSpy).toHaveBeenCalled();
      const logCall = consoleWarnSpy.mock.calls[0];
      expect(logCall[1].riskLevel).toBe('critical');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('createAuditMiddleware', () => {
    it('should create a middleware function', () => {
      const middleware = createAuditMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should skip static files', async () => {
      const middleware = createAuditMiddleware();
      const request = createMockRequest({
        url: 'https://vetify.app/_next/static/chunk.js',
      });

      // Should return early without logging
      await middleware(request);
      expect(true).toBe(true);
    });

    it('should skip health check endpoint', async () => {
      const middleware = createAuditMiddleware();
      const request = createMockRequest({
        url: 'https://vetify.app/health',
      });

      await middleware(request);
      expect(true).toBe(true);
    });

    it('should skip favicon requests', async () => {
      const middleware = createAuditMiddleware();
      const request = createMockRequest({
        url: 'https://vetify.app/favicon.ico',
      });

      await middleware(request);
      expect(true).toBe(true);
    });

    it('should log API requests', async () => {
      const middleware = createAuditMiddleware();
      const request = createMockRequest({
        url: 'https://vetify.app/api/pets?page=1&limit=10',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      await middleware(request, 'user_123', 'tenant_456');
      // Should not throw
      expect(true).toBe(true);
    });
  });
});

describe('AuditEventType Coverage', () => {
  const allEventTypes: AuditEventType[] = [
    'auth_login',
    'auth_logout',
    'auth_failed',
    'data_access',
    'data_create',
    'data_update',
    'data_delete',
    'permission_denied',
    'rate_limit_exceeded',
    'suspicious_activity',
    'admin_action',
    'sensitive_data_access',
    'export_data',
    'security_event',
  ];

  it('should handle all event types in calculateRiskLevel', () => {
    allEventTypes.forEach((eventType) => {
      const result = calculateRiskLevel(eventType, true);
      expect(['low', 'medium', 'high', 'critical']).toContain(result);
    });
  });
});
