/**
 * Unit tests for QR URL Generation Utilities
 */

import {
  getClinicUrl,
  getClinicBookingUrl,
  getClinicServicesUrl,
  getClinicPageUrl,
  QR_SIZE_OPTIONS,
  QR_TARGET_PAGE_OPTIONS,
} from '@/lib/qr-url-utils';

// Mock the SEO config module
jest.mock('@/lib/seo/config', () => ({
  getBaseUrl: jest.fn(() => 'http://localhost:3000'),
}));

describe('QR URL Generation Utilities', () => {
  describe('getClinicUrl', () => {
    it('should generate correct landing page URL', () => {
      expect(getClinicUrl('mi-clinica')).toBe('http://localhost:3000/mi-clinica');
    });

    it('should handle slugs with hyphens', () => {
      expect(getClinicUrl('clinica-veterinaria-luna')).toBe(
        'http://localhost:3000/clinica-veterinaria-luna'
      );
    });

    it('should handle slugs with numbers', () => {
      expect(getClinicUrl('clinica-123')).toBe('http://localhost:3000/clinica-123');
    });

    it('should handle simple single-word slugs', () => {
      expect(getClinicUrl('vetify')).toBe('http://localhost:3000/vetify');
    });
  });

  describe('getClinicBookingUrl', () => {
    it('should append /agendar to clinic URL', () => {
      expect(getClinicBookingUrl('mi-clinica')).toBe(
        'http://localhost:3000/mi-clinica/agendar'
      );
    });

    it('should handle slugs with hyphens', () => {
      expect(getClinicBookingUrl('clinica-veterinaria-luna')).toBe(
        'http://localhost:3000/clinica-veterinaria-luna/agendar'
      );
    });
  });

  describe('getClinicServicesUrl', () => {
    it('should append /servicios to clinic URL', () => {
      expect(getClinicServicesUrl('mi-clinica')).toBe(
        'http://localhost:3000/mi-clinica/servicios'
      );
    });

    it('should handle slugs with hyphens', () => {
      expect(getClinicServicesUrl('clinica-veterinaria-luna')).toBe(
        'http://localhost:3000/clinica-veterinaria-luna/servicios'
      );
    });
  });

  describe('getClinicPageUrl', () => {
    const slug = 'test-clinic';

    it('should return landing page URL for "landing" target', () => {
      expect(getClinicPageUrl(slug, 'landing')).toBe(
        'http://localhost:3000/test-clinic'
      );
    });

    it('should return booking page URL for "booking" target', () => {
      expect(getClinicPageUrl(slug, 'booking')).toBe(
        'http://localhost:3000/test-clinic/agendar'
      );
    });

    it('should return services page URL for "services" target', () => {
      expect(getClinicPageUrl(slug, 'services')).toBe(
        'http://localhost:3000/test-clinic/servicios'
      );
    });

    it('should default to landing page for unknown target', () => {
      // @ts-expect-error - Testing invalid input
      expect(getClinicPageUrl(slug, 'unknown')).toBe(
        'http://localhost:3000/test-clinic'
      );
    });
  });

  describe('QR_SIZE_OPTIONS', () => {
    it('should have 4 size options', () => {
      expect(QR_SIZE_OPTIONS).toHaveLength(4);
    });

    it('should have correct size values', () => {
      const sizes = QR_SIZE_OPTIONS.map((opt) => opt.value);
      expect(sizes).toEqual([128, 256, 512, 1024]);
    });

    it('should have labels and descriptions for all options', () => {
      QR_SIZE_OPTIONS.forEach((option) => {
        expect(option.label).toBeTruthy();
        expect(option.description).toBeTruthy();
      });
    });

    it('should have Spanish labels', () => {
      expect(QR_SIZE_OPTIONS[0].label).toContain('Pequeño');
      expect(QR_SIZE_OPTIONS[1].label).toContain('Mediano');
      expect(QR_SIZE_OPTIONS[2].label).toContain('Grande');
      expect(QR_SIZE_OPTIONS[3].label).toContain('Extra grande');
    });
  });

  describe('QR_TARGET_PAGE_OPTIONS', () => {
    it('should have 3 target page options', () => {
      expect(QR_TARGET_PAGE_OPTIONS).toHaveLength(3);
    });

    it('should have correct target values', () => {
      const targets = QR_TARGET_PAGE_OPTIONS.map((opt) => opt.value);
      expect(targets).toEqual(['landing', 'booking', 'services']);
    });

    it('should have labels and descriptions for all options', () => {
      QR_TARGET_PAGE_OPTIONS.forEach((option) => {
        expect(option.label).toBeTruthy();
        expect(option.description).toBeTruthy();
      });
    });

    it('should have Spanish labels', () => {
      expect(QR_TARGET_PAGE_OPTIONS[0].label).toBe('Página Principal');
      expect(QR_TARGET_PAGE_OPTIONS[1].label).toBe('Agendar Cita');
      expect(QR_TARGET_PAGE_OPTIONS[2].label).toBe('Servicios');
    });
  });
});
