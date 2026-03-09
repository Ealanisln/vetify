/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prismaMock } from '../../mocks/prisma';

// Mock super-admin check
const mockRequireSuperAdmin = jest.fn();
jest.mock('@/lib/super-admin', () => ({
  requireSuperAdmin: () => mockRequireSuperAdmin(),
}));

// Mock promotion queries
const mockGetAllPromotions = jest.fn();
const mockCreatePromotion = jest.fn();
const mockGetPromotionStats = jest.fn();
const mockGetPromotionByCode = jest.fn();
jest.mock('@/lib/promotions/queries', () => ({
  getAllPromotions: (...args: any[]) => mockGetAllPromotions(...args),
  createPromotion: (...args: any[]) => mockCreatePromotion(...args),
  getPromotionStats: (...args: any[]) => mockGetPromotionStats(...args),
  getPromotionByCode: (...args: any[]) => mockGetPromotionByCode(...args),
}));

// Mock promotion cache
const mockClearPromotionCache = jest.fn();
jest.mock('@/lib/pricing-config', () => ({
  clearPromotionCache: () => mockClearPromotionCache(),
}));

// Import after mocks
import { GET, POST } from '@/app/api/admin/promotions/route';
import { NextRequest } from 'next/server';

const createRequest = (url: string, options?: RequestInit) =>
  new NextRequest(`http://localhost:3000${url}`, options);

// Test data factories
const createMockPromotion = (overrides = {}) => ({
  id: 'promo-1',
  name: 'Test Promotion',
  code: 'TEST50',
  isActive: true,
  discountPercent: 50,
  durationMonths: 3,
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-06-01'),
  badgeText: '50% OFF',
  description: 'Test promotion description',
  applicablePlans: [],
  promotionType: 'DISCOUNT',
  maxRedemptions: null,
  trialDays: null,
  stripeCouponId: null,
  createdBy: 'admin-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

const validPromotionBody = {
  name: 'New Promotion',
  code: 'NEW50',
  discountPercent: 50,
  durationMonths: 3,
  startDate: '2026-01-01',
  endDate: '2026-06-01',
  badgeText: '50% OFF',
  description: 'A new promotion',
};

describe('Admin Promotions API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSuperAdmin.mockResolvedValue({ user: { id: 'admin-1', email: 'admin@vetify.pro' } });
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/admin/promotions', () => {
    it('should return 500 when not super admin', async () => {
      mockRequireSuperAdmin.mockRejectedValue(new Error('Access denied'));

      const request = createRequest('/api/admin/promotions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Error al obtener las promociones');
    });

    it('should return promotions list', async () => {
      const promotions = [createMockPromotion(), createMockPromotion({ id: 'promo-2', code: 'SAVE30' })];
      mockGetAllPromotions.mockResolvedValue(promotions);

      const request = createRequest('/api/admin/promotions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(mockGetAllPromotions).toHaveBeenCalled();
    });

    it('should include stats when includeStats=true', async () => {
      const promotions = [createMockPromotion()];
      const stats = { totalRedemptions: 10, totalRevenue: 5000 };
      mockGetAllPromotions.mockResolvedValue(promotions);
      mockGetPromotionStats.mockResolvedValue(stats);

      const request = createRequest('/api/admin/promotions?includeStats=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.stats).toEqual(stats);
      expect(mockGetPromotionStats).toHaveBeenCalled();
    });

    it('should not include stats when includeStats is not set', async () => {
      mockGetAllPromotions.mockResolvedValue([]);

      const request = createRequest('/api/admin/promotions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats).toBeUndefined();
      expect(mockGetPromotionStats).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/admin/promotions', () => {
    it('should return 500 when not super admin', async () => {
      mockRequireSuperAdmin.mockRejectedValue(new Error('Access denied'));

      const request = createRequest('/api/admin/promotions', {
        method: 'POST',
        body: JSON.stringify(validPromotionBody),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Error al crear la promoción');
    });

    it('should create promotion with valid data', async () => {
      const createdPromotion = createMockPromotion({ code: 'NEW50' });
      mockGetPromotionByCode.mockResolvedValue(null);
      mockCreatePromotion.mockResolvedValue(createdPromotion);

      const request = createRequest('/api/admin/promotions', {
        method: 'POST',
        body: JSON.stringify(validPromotionBody),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Promoción creada exitosamente');
      expect(mockCreatePromotion).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Promotion',
          code: 'NEW50',
          discountPercent: 50,
          createdBy: 'admin-1',
        })
      );
      expect(mockClearPromotionCache).toHaveBeenCalled();
    });

    it('should reject duplicate promotion code', async () => {
      mockGetPromotionByCode.mockResolvedValue(createMockPromotion());

      const request = createRequest('/api/admin/promotions', {
        method: 'POST',
        body: JSON.stringify({ ...validPromotionBody, code: 'TEST50' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Ya existe una promoción con ese código');
    });

    it('should reject invalid date range (endDate before startDate)', async () => {
      mockGetPromotionByCode.mockResolvedValue(null);

      const request = createRequest('/api/admin/promotions', {
        method: 'POST',
        body: JSON.stringify({
          ...validPromotionBody,
          startDate: '2026-06-01',
          endDate: '2026-01-01',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('La fecha de inicio debe ser anterior a la fecha de fin');
    });

    it('should validate required fields', async () => {
      const request = createRequest('/api/admin/promotions', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Datos inválidos');
      expect(data.details).toBeDefined();
    });

    it('should reject invalid promotion code format', async () => {
      const request = createRequest('/api/admin/promotions', {
        method: 'POST',
        body: JSON.stringify({
          ...validPromotionBody,
          code: 'invalid code!',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Datos inválidos');
    });
  });
});
