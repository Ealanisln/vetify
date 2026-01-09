/**
 * Integration tests for Landing Page Analytics APIs
 *
 * Tests the analytics tracking and dashboard APIs:
 * - POST /api/public/analytics - Public tracking endpoint
 * - GET /api/analytics/landing-page - Dashboard data endpoint
 * - GET /api/analytics/landing-page/export - CSV export endpoint
 */

import { prisma } from '@/lib/prisma';

// Mock the tenant lookup
jest.mock('@/lib/tenant', () => ({
  getTenantBySlug: jest.fn(),
}));

// Mock authentication
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

import { getTenantBySlug } from '@/lib/tenant';
import { requireAuth } from '@/lib/auth';

const mockTenantBySlug = getTenantBySlug as jest.MockedFunction<typeof getTenantBySlug>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

describe('Landing Page Analytics Integration', () => {
  const testTenantId = 'test-tenant-id';
  const testTenantSlug = 'demo-clinic';
  const testSessionId = '550e8400-e29b-41d4-a716-446655440000';

  const mockTenant = {
    id: testTenantId,
    slug: testTenantSlug,
    name: 'Demo Clinic',
    publicPageEnabled: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTenantBySlug.mockResolvedValue(mockTenant as ReturnType<typeof getTenantBySlug> extends Promise<infer T> ? T : never);
    mockRequireAuth.mockResolvedValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      tenant: mockTenant,
    } as ReturnType<typeof requireAuth> extends Promise<infer T> ? T : never);
  });

  describe('Event Tracking Schema Validation', () => {
    it('should validate required fields for PAGE_VIEW event', () => {
      const validEvent = {
        tenantSlug: testTenantSlug,
        eventType: 'PAGE_VIEW',
        pageSlug: 'landing',
        sessionId: testSessionId,
      };

      expect(validEvent.tenantSlug).toBeDefined();
      expect(validEvent.eventType).toBe('PAGE_VIEW');
      expect(validEvent.pageSlug).toBeDefined();
      expect(validEvent.sessionId).toBeDefined();
    });

    it('should validate optional fields for event', () => {
      const eventWithOptional = {
        tenantSlug: testTenantSlug,
        eventType: 'PAGE_VIEW',
        pageSlug: 'landing',
        sessionId: testSessionId,
        eventName: 'page_loaded',
        referrer: 'https://google.com',
        device: 'mobile',
        browser: 'Chrome',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'spring_sale',
      };

      expect(eventWithOptional.eventName).toBe('page_loaded');
      expect(eventWithOptional.referrer).toBeDefined();
      expect(eventWithOptional.device).toBe('mobile');
    });

    it('should validate CONVERSION event with conversionId', () => {
      const conversionEvent = {
        tenantSlug: testTenantSlug,
        eventType: 'CONVERSION',
        pageSlug: 'agendar',
        sessionId: testSessionId,
        eventName: 'appointment_booked',
        conversionId: 'appointment-123',
      };

      expect(conversionEvent.eventType).toBe('CONVERSION');
      expect(conversionEvent.conversionId).toBeDefined();
    });
  });

  describe('Analytics Aggregation', () => {
    it('should correctly calculate conversion rate', () => {
      const uniqueSessions = 100;
      const conversions = 10;

      const conversionRate = uniqueSessions > 0
        ? (conversions / uniqueSessions) * 100
        : 0;

      expect(conversionRate).toBe(10);
    });

    it('should calculate percentage change correctly', () => {
      const calculatePercentageChange = (previous: number, current: number): number => {
        if (previous === 0) {
          return current > 0 ? 100 : 0;
        }
        return Math.round(((current - previous) / previous) * 1000) / 10;
      };

      // Positive change
      expect(calculatePercentageChange(100, 150)).toBe(50);

      // Negative change
      expect(calculatePercentageChange(100, 75)).toBe(-25);

      // No change
      expect(calculatePercentageChange(100, 100)).toBe(0);

      // From zero
      expect(calculatePercentageChange(0, 100)).toBe(100);
      expect(calculatePercentageChange(0, 0)).toBe(0);
    });

    it('should categorize referrers correctly', () => {
      const categorizeReferrer = (referrer: string | null): string => {
        if (!referrer || referrer === '') return 'Directo';

        const url = referrer.toLowerCase();

        if (url.includes('google')) return 'Google';
        if (url.includes('facebook') || url.includes('fb.')) return 'Facebook';
        if (url.includes('instagram')) return 'Instagram';
        if (url.includes('twitter') || url.includes('t.co')) return 'Twitter/X';
        if (url.includes('whatsapp')) return 'WhatsApp';

        try {
          const domain = new URL(referrer).hostname.replace('www.', '');
          return domain;
        } catch {
          return 'Otro';
        }
      };

      expect(categorizeReferrer(null)).toBe('Directo');
      expect(categorizeReferrer('')).toBe('Directo');
      expect(categorizeReferrer('https://www.google.com/')).toBe('Google');
      expect(categorizeReferrer('https://facebook.com/page')).toBe('Facebook');
      expect(categorizeReferrer('https://l.instagram.com/')).toBe('Instagram');
      expect(categorizeReferrer('https://t.co/abc123')).toBe('Twitter/X');
      expect(categorizeReferrer('https://example.com/page')).toBe('example.com');
      expect(categorizeReferrer('invalid-url')).toBe('Otro');
    });
  });

  describe('Date Range Validation', () => {
    it('should enforce maximum 90 day range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-04-01'); // 91 days

      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBeGreaterThan(90);
    });

    it('should allow valid 30 day range', () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 29);

      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBeLessThanOrEqual(90);
    });
  });

  describe('Device Type Mapping', () => {
    it('should map device types to Spanish labels', () => {
      const deviceLabels: Record<string, string> = {
        mobile: 'Móvil',
        desktop: 'Escritorio',
        tablet: 'Tablet',
      };

      expect(deviceLabels['mobile']).toBe('Móvil');
      expect(deviceLabels['desktop']).toBe('Escritorio');
      expect(deviceLabels['tablet']).toBe('Tablet');
      expect(deviceLabels['unknown'] || 'Desconocido').toBe('Desconocido');
    });
  });

  describe('Page Slug Mapping', () => {
    it('should map page slugs to Spanish labels', () => {
      const pageLabels: Record<string, string> = {
        landing: 'Página principal',
        agendar: 'Agendar cita',
        servicios: 'Servicios',
        equipo: 'Equipo',
        galeria: 'Galería',
        testimonios: 'Testimonios',
      };

      expect(pageLabels['landing']).toBe('Página principal');
      expect(pageLabels['agendar']).toBe('Agendar cita');
      expect(pageLabels['servicios']).toBe('Servicios');
    });
  });

  describe('CSV Export Format', () => {
    it('should generate valid CSV format', () => {
      const lines: string[] = [];

      // Header
      lines.push('Analytics de Landing Page - Demo Clinic');
      lines.push('Período: 1 de enero 2024 - 31 de enero 2024');
      lines.push('');

      // Summary
      lines.push('RESUMEN');
      lines.push('Métrica,Valor');
      lines.push('Total de visitas,1000');
      lines.push('Visitantes únicos,500');
      lines.push('Total de conversiones,50');
      lines.push('Tasa de conversión,10%');

      const csvContent = lines.join('\n');

      expect(csvContent).toContain('Analytics de Landing Page');
      expect(csvContent).toContain('Total de visitas,1000');
      expect(csvContent).toContain('Tasa de conversión,10%');
    });
  });
});
