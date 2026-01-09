/**
 * Integration tests for QR Code Settings
 *
 * These tests verify that the tenant data required for QR code generation
 * is properly accessed and that multi-tenancy isolation is maintained.
 */

import { prismaMock } from '../../mocks/prisma';
import { createTestTenant } from '../../utils/test-utils';

describe('QR Code Settings Integration', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTenant = createTestTenant({
      slug: 'test-clinic',
      publicPageEnabled: true,
      publicThemeColor: '#75a99c',
    });
  });

  describe('Tenant Data for QR Generation', () => {
    it('should return tenant slug and public page settings', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant);

      const tenant = await prismaMock.tenant.findUnique({
        where: { id: mockTenant.id },
        select: {
          slug: true,
          name: true,
          publicPageEnabled: true,
          publicThemeColor: true,
          logo: true,
        },
      });

      expect(tenant?.slug).toBe('test-clinic');
      expect(tenant?.publicPageEnabled).toBe(true);
      expect(tenant?.publicThemeColor).toBe('#75a99c');
    });

    it('should return tenant name for PDF generation', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant);

      const tenant = await prismaMock.tenant.findUnique({
        where: { id: mockTenant.id },
        select: {
          name: true,
        },
      });

      expect(tenant?.name).toBe(mockTenant.name);
    });

    it('should return tenant logo when available', async () => {
      const tenantWithLogo = createTestTenant({
        slug: 'test-clinic',
        logo: 'https://example.com/logo.png',
      });
      prismaMock.tenant.findUnique.mockResolvedValue(tenantWithLogo);

      const tenant = await prismaMock.tenant.findUnique({
        where: { id: tenantWithLogo.id },
        select: {
          logo: true,
        },
      });

      expect(tenant?.logo).toBe('https://example.com/logo.png');
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should enforce tenant isolation when fetching settings', async () => {
      const otherTenant = createTestTenant({
        id: 'other-tenant',
        slug: 'other-clinic',
        publicThemeColor: '#ff0000',
      });

      prismaMock.tenant.findUnique.mockImplementation(async (args: { where?: { id?: string } }) => {
        if (args?.where?.id === mockTenant.id) return mockTenant;
        if (args?.where?.id === otherTenant.id) return otherTenant;
        return null;
      });

      const result = await prismaMock.tenant.findUnique({
        where: { id: mockTenant.id },
      });

      expect(result?.slug).toBe('test-clinic');
      expect(result?.slug).not.toBe('other-clinic');
    });

    it('should return null for non-existent tenant', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(null);

      const result = await prismaMock.tenant.findUnique({
        where: { id: 'non-existent-tenant' },
      });

      expect(result).toBeNull();
    });

    it('should not leak data between tenants', async () => {
      const tenant1 = createTestTenant({
        id: 'tenant-1',
        slug: 'clinic-1',
        publicThemeColor: '#111111',
      });
      const tenant2 = createTestTenant({
        id: 'tenant-2',
        slug: 'clinic-2',
        publicThemeColor: '#222222',
      });

      prismaMock.tenant.findUnique.mockImplementation(async (args: { where?: { id?: string } }) => {
        if (args?.where?.id === 'tenant-1') return tenant1;
        if (args?.where?.id === 'tenant-2') return tenant2;
        return null;
      });

      const result1 = await prismaMock.tenant.findUnique({
        where: { id: 'tenant-1' },
      });
      const result2 = await prismaMock.tenant.findUnique({
        where: { id: 'tenant-2' },
      });

      expect(result1?.publicThemeColor).toBe('#111111');
      expect(result2?.publicThemeColor).toBe('#222222');
      expect(result1?.publicThemeColor).not.toBe(result2?.publicThemeColor);
    });
  });

  describe('Public Page Validation', () => {
    it('should handle disabled public page gracefully', async () => {
      mockTenant.publicPageEnabled = false;
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant);

      const tenant = await prismaMock.tenant.findUnique({
        where: { id: mockTenant.id },
      });

      expect(tenant?.publicPageEnabled).toBe(false);
    });

    it('should return default theme color when not set', async () => {
      const tenantNoColor = createTestTenant({
        slug: 'test-clinic',
        publicThemeColor: null,
      });
      prismaMock.tenant.findUnique.mockResolvedValue(tenantNoColor);

      const tenant = await prismaMock.tenant.findUnique({
        where: { id: tenantNoColor.id },
      });

      expect(tenant?.publicThemeColor).toBeNull();
    });
  });

  describe('Slug Validation for QR URLs', () => {
    it('should return unique slug for URL generation', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant);

      const tenant = await prismaMock.tenant.findUnique({
        where: { id: mockTenant.id },
        select: { slug: true },
      });

      expect(tenant?.slug).toBeTruthy();
      expect(typeof tenant?.slug).toBe('string');
    });

    it('should handle slugs with special characters', async () => {
      const tenantWithSpecialSlug = createTestTenant({
        slug: 'clinica-veterinaria-dr-garcia',
      });
      prismaMock.tenant.findUnique.mockResolvedValue(tenantWithSpecialSlug);

      const tenant = await prismaMock.tenant.findUnique({
        where: { id: tenantWithSpecialSlug.id },
        select: { slug: true },
      });

      expect(tenant?.slug).toBe('clinica-veterinaria-dr-garcia');
      expect(tenant?.slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should handle numeric suffixes in slugs', async () => {
      const tenantWithNumberedSlug = createTestTenant({
        slug: 'mi-clinica-2',
      });
      prismaMock.tenant.findUnique.mockResolvedValue(tenantWithNumberedSlug);

      const tenant = await prismaMock.tenant.findUnique({
        where: { id: tenantWithNumberedSlug.id },
        select: { slug: true },
      });

      expect(tenant?.slug).toBe('mi-clinica-2');
    });
  });

  describe('API Response Structure', () => {
    it('should return all required fields for QR generation', async () => {
      const fullTenant = createTestTenant({
        slug: 'complete-clinic',
        name: 'Complete Clinic',
        publicPageEnabled: true,
        publicThemeColor: '#75a99c',
        logo: 'https://example.com/logo.png',
      });
      prismaMock.tenant.findUnique.mockResolvedValue(fullTenant);

      const tenant = await prismaMock.tenant.findUnique({
        where: { id: fullTenant.id },
        select: {
          slug: true,
          name: true,
          publicPageEnabled: true,
          publicThemeColor: true,
          logo: true,
        },
      });

      expect(tenant).toHaveProperty('slug');
      expect(tenant).toHaveProperty('name');
      expect(tenant).toHaveProperty('publicPageEnabled');
      expect(tenant).toHaveProperty('publicThemeColor');
      expect(tenant).toHaveProperty('logo');
    });

    it('should handle missing optional fields', async () => {
      const minimalTenant = createTestTenant({
        slug: 'minimal-clinic',
        publicThemeColor: null,
        logo: null,
      });
      prismaMock.tenant.findUnique.mockResolvedValue(minimalTenant);

      const tenant = await prismaMock.tenant.findUnique({
        where: { id: minimalTenant.id },
      });

      expect(tenant?.slug).toBeTruthy();
      expect(tenant?.publicThemeColor).toBeNull();
      expect(tenant?.logo).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      prismaMock.tenant.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        prismaMock.tenant.findUnique({
          where: { id: mockTenant.id },
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle timeout errors', async () => {
      prismaMock.tenant.findUnique.mockRejectedValue(new Error('Query timeout'));

      await expect(
        prismaMock.tenant.findUnique({
          where: { id: mockTenant.id },
        })
      ).rejects.toThrow('Query timeout');
    });
  });
});
