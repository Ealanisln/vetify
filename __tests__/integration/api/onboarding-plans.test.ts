/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Mock pricing config
jest.mock('@/lib/pricing-config', () => ({
  COMPLETE_PLANS: {
    BASICO: {
      key: 'BASICO',
      name: 'Plan Básico',
      description: 'Ideal para clínicas pequeñas',
      badge: '30 DÍAS GRATIS',
      features: [{ name: 'Feature 1', included: true }],
    },
    PROFESIONAL: {
      key: 'PROFESIONAL',
      name: 'Plan Profesional',
      description: 'Para clínicas establecidas',
      badge: 'MÁS POPULAR',
      features: [{ name: 'Feature 2', included: true }],
    },
    CORPORATIVO: {
      key: 'CORPORATIVO',
      name: 'Plan Corporativo',
      description: 'Solución empresarial',
      badge: 'EMPRESARIAL',
      features: [{ name: 'Feature 3', included: true }],
    },
  },
}));

// Import after mocks
import { GET } from '@/app/api/onboarding/plans/route';

// Test data factories
const createMockDbPlan = (overrides = {}) => ({
  id: 'plan-1',
  key: 'BASICO',
  name: 'Plan Básico',
  description: 'Test description',
  monthlyPrice: new Decimal(599),
  annualPrice: new Decimal(5990),
  features: [],
  maxUsers: 3,
  maxPets: 500,
  storageGB: 5,
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-15'),
  ...overrides,
});

describe('Onboarding Plans API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/onboarding/plans', () => {
    describe('Success Cases', () => {
      it('should return plans successfully', async () => {
        const plans = [
          createMockDbPlan({ key: 'BASICO' }),
          createMockDbPlan({ key: 'PROFESIONAL', id: 'plan-2' }),
        ];
        prismaMock.plan.findMany.mockResolvedValue(plans as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
      });

      it('should filter by active plans only', async () => {
        prismaMock.plan.findMany.mockResolvedValue([]);

        await GET();

        expect(prismaMock.plan.findMany).toHaveBeenCalledWith({
          where: {
            isActive: true,
            key: { in: ['BASICO', 'PROFESIONAL', 'CORPORATIVO'] },
          },
        });
      });

      it('should filter by valid plan keys only', async () => {
        prismaMock.plan.findMany.mockResolvedValue([]);

        await GET();

        expect(prismaMock.plan.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              key: { in: ['BASICO', 'PROFESIONAL', 'CORPORATIVO'] },
            }),
          })
        );
      });

      it('should convert Decimal prices to numbers', async () => {
        const plans = [
          createMockDbPlan({
            monthlyPrice: new Decimal(599),
            annualPrice: new Decimal(5990),
          }),
        ];
        prismaMock.plan.findMany.mockResolvedValue(plans as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(typeof data[0].monthlyPrice).toBe('number');
        expect(typeof data[0].annualPrice).toBe('number');
        expect(data[0].monthlyPrice).toBe(599);
        expect(data[0].annualPrice).toBe(5990);
      });

      it('should merge with COMPLETE_PLANS config', async () => {
        const plans = [createMockDbPlan({ key: 'BASICO' })];
        prismaMock.plan.findMany.mockResolvedValue(plans as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        // Should have properties from both DB and COMPLETE_PLANS
        expect(data[0]).toHaveProperty('key', 'BASICO');
        expect(data[0]).toHaveProperty('badge', '30 DÍAS GRATIS');
      });
    });

    describe('Plan Data Structure', () => {
      it('should include database fields', async () => {
        const plans = [createMockDbPlan()];
        prismaMock.plan.findMany.mockResolvedValue(plans as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('key');
        expect(data[0]).toHaveProperty('name');
        expect(data[0]).toHaveProperty('monthlyPrice');
        expect(data[0]).toHaveProperty('annualPrice');
      });

      it('should include config fields from COMPLETE_PLANS', async () => {
        const plans = [createMockDbPlan({ key: 'PROFESIONAL' })];
        prismaMock.plan.findMany.mockResolvedValue(plans as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data[0]).toHaveProperty('badge', 'MÁS POPULAR');
        expect(data[0]).toHaveProperty('features');
      });
    });

    describe('Multiple Plans', () => {
      it('should return all active plans', async () => {
        const plans = [
          createMockDbPlan({ id: 'plan-1', key: 'BASICO' }),
          createMockDbPlan({ id: 'plan-2', key: 'PROFESIONAL' }),
          createMockDbPlan({ id: 'plan-3', key: 'CORPORATIVO' }),
        ];
        prismaMock.plan.findMany.mockResolvedValue(plans as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveLength(3);
      });

      it('should merge correct config for each plan', async () => {
        const plans = [
          createMockDbPlan({ id: 'plan-1', key: 'BASICO' }),
          createMockDbPlan({ id: 'plan-2', key: 'PROFESIONAL' }),
        ];
        prismaMock.plan.findMany.mockResolvedValue(plans as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data[0].badge).toBe('30 DÍAS GRATIS');
        expect(data[1].badge).toBe('MÁS POPULAR');
      });
    });

    describe('Edge Cases', () => {
      it('should return empty array when no plans exist', async () => {
        prismaMock.plan.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual([]);
      });

      it('should handle plans with missing config gracefully', async () => {
        const plans = [
          createMockDbPlan({ key: 'UNKNOWN_PLAN' }),
        ];
        prismaMock.plan.findMany.mockResolvedValue(plans as any);

        const response = await GET();
        const data = await response.json();

        // Should not throw, might have undefined merged properties
        expect(response.status).toBe(200);
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on database error', async () => {
        prismaMock.plan.findMany.mockRejectedValue(new Error('Database connection failed'));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch plans');
      });

      it('should log error on failure', async () => {
        const consoleSpy = jest.spyOn(console, 'error');
        prismaMock.plan.findMany.mockRejectedValue(new Error('Test error'));

        await GET();

        expect(consoleSpy).toHaveBeenCalled();
      });
    });
  });
});
