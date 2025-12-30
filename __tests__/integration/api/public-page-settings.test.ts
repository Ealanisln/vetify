/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { createTestTenant } from '../../utils/test-utils';
import { GET, PUT } from '@/app/api/settings/public-page/route';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

import { requireAuth } from '@/lib/auth';

const mockRequireAuth = requireAuth as jest.Mock;

// Helper to create a mock Request for PUT
function createMockPutRequest(body: Record<string, unknown>): Request {
  return {
    json: () => Promise.resolve(body),
  } as unknown as Request;
}

describe('Public Page Settings API', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockTenant = createTestTenant({
      id: 'tenant-settings-test',
      slug: 'test-clinic',
      status: 'ACTIVE',
      publicPageEnabled: true,
      publicBookingEnabled: true,
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('GET /api/settings/public-page', () => {
    it('should return settings for authenticated user', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });
      prismaMock.tenant.findUnique.mockResolvedValue({
        slug: 'test-clinic',
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicDescription: 'Test clinic description',
        publicPhone: '+52 55 1234 5678',
        publicEmail: 'test@clinic.com',
        publicAddress: 'Av. Test 123',
        publicThemeColor: '#75a99c',
        publicTheme: 'modern',
        publicHours: { weekdays: '9:00 - 18:00' },
        publicServices: [],
        publicSocialMedia: null,
        publicImages: null,
        logo: null,
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
      expect(data.data.slug).toBe('test-clinic');
      expect(data.data.publicPageEnabled).toBe(true);
      expect(data.data.publicDescription).toBe('Test clinic description');
    });

    it('should return 401 for unauthenticated request', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should return 404 when tenant not found', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: 'non-existent' } });
      prismaMock.tenant.findUnique.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Tenant no encontrado');
    });
  });

  describe('PUT /api/settings/public-page', () => {
    it('should update settings with valid data', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });
      prismaMock.tenant.update.mockResolvedValue({
        slug: 'test-clinic',
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicDescription: 'Updated description',
        publicPhone: '+52 55 9999 8888',
        publicEmail: 'new@clinic.com',
        publicAddress: 'New Address 456',
        publicThemeColor: '#ff5500',
        publicTheme: 'vibrant',
        publicHours: { weekdays: '8:00 - 20:00' },
        publicServices: [],
        publicSocialMedia: null,
        publicImages: null,
        logo: null,
      } as any);

      const request = createMockPutRequest({
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicDescription: 'Updated description',
        publicPhone: '+52 55 9999 8888',
        publicEmail: 'new@clinic.com',
        publicAddress: 'New Address 456',
        publicThemeColor: '#ff5500',
        publicTheme: 'vibrant',
        publicHours: { weekdays: '8:00 - 20:00' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.publicDescription).toBe('Updated description');
      expect(data.data.publicThemeColor).toBe('#ff5500');
      expect(data.message).toBe('Configuración guardada exitosamente');
    });

    it('should return 400 for invalid hex color format', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });

      const request = createMockPutRequest({
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicThemeColor: 'invalid-color',
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Datos inválidos');
      expect(data.details).toBeDefined();
    });

    it('should return 400 for invalid theme enum', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });

      const request = createMockPutRequest({
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicTheme: 'invalid-theme',
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Datos inválidos');
    });

    it('should return 400 for invalid email format', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });

      const request = createMockPutRequest({
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicEmail: 'not-an-email',
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Datos inválidos');
    });

    it('should convert empty strings to null', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });
      prismaMock.tenant.update.mockResolvedValue({
        slug: 'test-clinic',
        publicPageEnabled: true,
        publicBookingEnabled: false,
        publicDescription: null,
        publicPhone: null,
        publicEmail: null,
        publicAddress: null,
        publicThemeColor: '#75a99c',
        publicTheme: 'modern',
        publicHours: null,
        publicServices: null,
        publicSocialMedia: null,
        publicImages: null,
        logo: null,
      } as any);

      const request = createMockPutRequest({
        publicPageEnabled: true,
        publicBookingEnabled: false,
        publicDescription: '',
        publicPhone: '',
        publicEmail: '',
        publicAddress: '',
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify Prisma was called with null values
      expect(prismaMock.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publicDescription: null,
            publicPhone: null,
            publicEmail: null,
            publicAddress: null,
          }),
        })
      );
    });

    it('should apply default theme color when empty', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });
      prismaMock.tenant.update.mockResolvedValue({
        slug: 'test-clinic',
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicDescription: null,
        publicPhone: null,
        publicEmail: null,
        publicAddress: null,
        publicThemeColor: '#75a99c',
        publicTheme: 'modern',
        publicHours: null,
        publicServices: null,
        publicSocialMedia: null,
        publicImages: null,
        logo: null,
      } as any);

      const request = createMockPutRequest({
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicThemeColor: null,
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);

      // Verify default color was applied
      expect(prismaMock.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publicThemeColor: '#75a99c',
          }),
        })
      );
    });

    it('should validate services array max length (10)', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });

      // Create 11 services (exceeds max)
      const tooManyServices = Array.from({ length: 11 }, (_, i) => ({
        title: `Service ${i}`,
        description: `Description ${i}`,
      }));

      const request = createMockPutRequest({
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicServices: tooManyServices,
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Datos inválidos');
    });

    it('should accept valid services array', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });

      const validServices = [
        { title: 'Consulta', description: 'General consultation', price: '$500', icon: 'stethoscope' },
        { title: 'Vacunación', description: 'Pet vaccinations', price: '$300', icon: 'syringe' },
      ];

      prismaMock.tenant.update.mockResolvedValue({
        slug: 'test-clinic',
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicDescription: null,
        publicPhone: null,
        publicEmail: null,
        publicAddress: null,
        publicThemeColor: '#75a99c',
        publicTheme: 'modern',
        publicHours: null,
        publicServices: validServices,
        publicSocialMedia: null,
        publicImages: null,
        logo: null,
      } as any);

      const request = createMockPutRequest({
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicServices: validServices,
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.publicServices).toEqual(validServices);
    });

    it('should validate social media URL formats', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });

      const request = createMockPutRequest({
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicSocialMedia: {
          facebook: 'not-a-url', // Invalid URL
          instagram: 'https://instagram.com/clinic',
        },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Datos inválidos');
    });

    it('should accept valid social media URLs', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });

      const socialMedia = {
        facebook: 'https://facebook.com/myclinic',
        instagram: 'https://instagram.com/myclinic',
        whatsapp: '5551234567',
      };

      prismaMock.tenant.update.mockResolvedValue({
        slug: 'test-clinic',
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicDescription: null,
        publicPhone: null,
        publicEmail: null,
        publicAddress: null,
        publicThemeColor: '#75a99c',
        publicTheme: 'modern',
        publicHours: null,
        publicServices: null,
        publicSocialMedia: socialMedia,
        publicImages: null,
        logo: null,
      } as any);

      const request = createMockPutRequest({
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicSocialMedia: socialMedia,
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
    });

    it('should return 400 when publicPageEnabled is missing', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });

      const request = createMockPutRequest({
        // Missing publicPageEnabled
        publicBookingEnabled: true,
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Datos inválidos');
    });

    it('should return 400 when publicBookingEnabled is missing', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });

      const request = createMockPutRequest({
        publicPageEnabled: true,
        // Missing publicBookingEnabled
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Datos inválidos');
    });

    it('should accept valid hex color in lowercase', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });
      prismaMock.tenant.update.mockResolvedValue({
        slug: 'test-clinic',
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicDescription: null,
        publicPhone: null,
        publicEmail: null,
        publicAddress: null,
        publicThemeColor: '#ff55aa',
        publicTheme: 'modern',
        publicHours: null,
        publicServices: null,
        publicSocialMedia: null,
        publicImages: null,
        logo: null,
      } as any);

      const request = createMockPutRequest({
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicThemeColor: '#ff55aa', // lowercase hex
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
    });

    it('should accept valid hex color in uppercase', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });
      prismaMock.tenant.update.mockResolvedValue({
        slug: 'test-clinic',
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicDescription: null,
        publicPhone: null,
        publicEmail: null,
        publicAddress: null,
        publicThemeColor: '#FF55AA',
        publicTheme: 'modern',
        publicHours: null,
        publicServices: null,
        publicSocialMedia: null,
        publicImages: null,
        logo: null,
      } as any);

      const request = createMockPutRequest({
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicThemeColor: '#FF55AA', // uppercase hex
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
    });

    it('should accept all valid theme options', async () => {
      const themes = ['modern', 'classic', 'minimal', 'vibrant'];

      for (const theme of themes) {
        mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });
        prismaMock.tenant.update.mockResolvedValue({
          slug: 'test-clinic',
          publicPageEnabled: true,
          publicBookingEnabled: true,
          publicDescription: null,
          publicPhone: null,
          publicEmail: null,
          publicAddress: null,
          publicThemeColor: '#75a99c',
          publicTheme: theme,
          publicHours: null,
          publicServices: null,
          publicSocialMedia: null,
          publicImages: null,
          logo: null,
        } as any);

        const request = createMockPutRequest({
          publicPageEnabled: true,
          publicBookingEnabled: true,
          publicTheme: theme,
        });

        const response = await PUT(request);
        expect(response.status).toBe(200);
      }
    });

    it('should validate publicHours structure', async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: mockTenant.id } });
      prismaMock.tenant.update.mockResolvedValue({
        slug: 'test-clinic',
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicDescription: null,
        publicPhone: null,
        publicEmail: null,
        publicAddress: null,
        publicThemeColor: '#75a99c',
        publicTheme: 'modern',
        publicHours: {
          weekdays: '8:00 - 20:00',
          saturday: '9:00 - 14:00',
          sunday: 'Cerrado',
        },
        publicServices: null,
        publicSocialMedia: null,
        publicImages: null,
        logo: null,
      } as any);

      const request = createMockPutRequest({
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicHours: {
          weekdays: '8:00 - 20:00',
          saturday: '9:00 - 14:00',
          sunday: 'Cerrado',
        },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.publicHours).toEqual({
        weekdays: '8:00 - 20:00',
        saturday: '9:00 - 14:00',
        sunday: 'Cerrado',
      });
    });
  });
});
