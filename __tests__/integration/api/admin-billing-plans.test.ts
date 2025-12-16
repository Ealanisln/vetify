/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Mock super-admin check
const mockRequireSuperAdmin = jest.fn();
jest.mock('@/lib/super-admin', () => ({
  requireSuperAdmin: () => mockRequireSuperAdmin(),
}));

// Mock serializer
jest.mock('@/lib/serializers', () => ({
  serializePlan: jest.fn((plan) => ({
    ...plan,
    monthlyPrice: typeof plan.monthlyPrice?.toNumber === 'function'
      ? plan.monthlyPrice.toNumber()
      : plan.monthlyPrice,
    annualPrice: typeof plan.annualPrice?.toNumber === 'function'
      ? plan.annualPrice.toNumber()
      : plan.annualPrice,
  })),
}));

// Import after mocks
import { GET, POST } from '@/app/api/admin/billing/plans/route';

// Test data factories
const createMockPlan = (overrides = {}) => ({
  id: 'plan-1',
  key: 'profesional',
  name: 'Profesional',
  description: 'Plan profesional para clínicas',
  monthlyPrice: new Decimal(599),
  annualPrice: new Decimal(5990),
  features: ['feature1', 'feature2'],
  maxUsers: 10,
  maxPets: 100,
  storageGB: 5,
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-15'),
  ...overrides,
});

// Helper to create mock POST request
const createMockPostRequest = (body: object) => {
  return new Request('http://localhost:3000/api/admin/billing/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

describe('Admin Billing Plans API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSuperAdmin.mockResolvedValue({ user: { id: 'admin-1', email: 'admin@vetify.pro' } });
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/admin/billing/plans', () => {
    describe('Authorization', () => {
      it('should return 500 when user is not super admin', async () => {
        mockRequireSuperAdmin.mockRejectedValue(new Error('Access denied'));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });

      it('should proceed when user is super admin', async () => {
        prismaMock.plan.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('plans');
      });
    });

    describe('Plan Listing', () => {
      it('should return empty plans array when no plans exist', async () => {
        prismaMock.plan.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plans).toEqual([]);
      });

      it('should return transformed plans with correct structure', async () => {
        const plans = [createMockPlan()];
        prismaMock.plan.findMany.mockResolvedValue(plans as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plans).toHaveLength(1);
        expect(data.plans[0]).toHaveProperty('id', 'plan-1');
        expect(data.plans[0]).toHaveProperty('name', 'Profesional');
        expect(data.plans[0]).toHaveProperty('price', 599);
        expect(data.plans[0]).toHaveProperty('currency', 'MXN');
        expect(data.plans[0]).toHaveProperty('interval', 'month');
        expect(data.plans[0]).toHaveProperty('isActive', true);
      });

      it('should return features as array', async () => {
        const plans = [createMockPlan({ features: ['feature1', 'feature2', 'feature3'] })];
        prismaMock.plan.findMany.mockResolvedValue(plans as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plans[0].features).toEqual(['feature1', 'feature2', 'feature3']);
      });

      it('should handle plans without features', async () => {
        const plans = [createMockPlan({ features: null })];
        prismaMock.plan.findMany.mockResolvedValue(plans as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plans[0].features).toEqual([]);
      });

      it('should handle plans without description', async () => {
        const plans = [createMockPlan({ description: null })];
        prismaMock.plan.findMany.mockResolvedValue(plans as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plans[0].description).toBe('');
      });

      it('should order plans by monthly price ascending', async () => {
        prismaMock.plan.findMany.mockResolvedValue([]);

        await GET();

        expect(prismaMock.plan.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: {
              monthlyPrice: 'asc',
            },
          })
        );
      });

      it('should return multiple plans', async () => {
        const plans = [
          createMockPlan({ id: 'plan-1', name: 'Básico', monthlyPrice: new Decimal(299) }),
          createMockPlan({ id: 'plan-2', name: 'Profesional', monthlyPrice: new Decimal(599) }),
          createMockPlan({ id: 'plan-3', name: 'Corporativo', monthlyPrice: new Decimal(1199) }),
        ];
        prismaMock.plan.findMany.mockResolvedValue(plans as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plans).toHaveLength(3);
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        prismaMock.plan.findMany.mockRejectedValue(new Error('Database error'));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });
    });
  });

  describe('POST /api/admin/billing/plans', () => {
    describe('Authorization', () => {
      it('should return 500 when user is not super admin', async () => {
        mockRequireSuperAdmin.mockRejectedValue(new Error('Access denied'));

        const response = await POST(createMockPostRequest({
          name: 'Test Plan',
          price: 499,
        }));
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });
    });

    describe('Validation', () => {
      it('should return 400 when name is missing', async () => {
        const response = await POST(createMockPostRequest({
          price: 499,
        }));
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Nombre y precio son requeridos');
      });

      it('should return 400 when price is missing', async () => {
        const response = await POST(createMockPostRequest({
          name: 'Test Plan',
        }));
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Nombre y precio son requeridos');
      });

      it('should return 400 when both name and price are missing', async () => {
        const response = await POST(createMockPostRequest({}));
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Nombre y precio son requeridos');
      });
    });

    describe('Plan Creation', () => {
      it('should create a plan with required fields', async () => {
        const createdPlan = createMockPlan({ id: 'new-plan-1', name: 'New Plan' });
        prismaMock.plan.create.mockResolvedValue(createdPlan as any);

        const response = await POST(createMockPostRequest({
          name: 'New Plan',
          price: 499,
        }));

        expect(response.status).toBe(201);
        expect(prismaMock.plan.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            key: 'new-plan',
            name: 'New Plan',
            monthlyPrice: 499,
            annualPrice: 5988, // 499 * 12
          }),
        });
      });

      it('should create key from name (lowercase, hyphenated)', async () => {
        const createdPlan = createMockPlan({ name: 'Premium Enterprise' });
        prismaMock.plan.create.mockResolvedValue(createdPlan as any);

        await POST(createMockPostRequest({
          name: 'Premium Enterprise',
          price: 1999,
        }));

        expect(prismaMock.plan.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            key: 'premium-enterprise',
          }),
        });
      });

      it('should include optional description', async () => {
        const createdPlan = createMockPlan({ description: 'Test description' });
        prismaMock.plan.create.mockResolvedValue(createdPlan as any);

        await POST(createMockPostRequest({
          name: 'Test Plan',
          price: 499,
          description: 'Test description',
        }));

        expect(prismaMock.plan.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            description: 'Test description',
          }),
        });
      });

      it('should default description to empty string', async () => {
        const createdPlan = createMockPlan();
        prismaMock.plan.create.mockResolvedValue(createdPlan as any);

        await POST(createMockPostRequest({
          name: 'Test Plan',
          price: 499,
        }));

        expect(prismaMock.plan.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            description: '',
          }),
        });
      });

      it('should include features array', async () => {
        const createdPlan = createMockPlan({ features: ['feat1', 'feat2'] });
        prismaMock.plan.create.mockResolvedValue(createdPlan as any);

        await POST(createMockPostRequest({
          name: 'Test Plan',
          price: 499,
          features: ['feat1', 'feat2'],
        }));

        expect(prismaMock.plan.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            features: ['feat1', 'feat2'],
          }),
        });
      });

      it('should default features to empty array', async () => {
        const createdPlan = createMockPlan();
        prismaMock.plan.create.mockResolvedValue(createdPlan as any);

        await POST(createMockPostRequest({
          name: 'Test Plan',
          price: 499,
        }));

        expect(prismaMock.plan.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            features: [],
          }),
        });
      });

      it('should allow setting isActive to false', async () => {
        const createdPlan = createMockPlan({ isActive: false });
        prismaMock.plan.create.mockResolvedValue(createdPlan as any);

        await POST(createMockPostRequest({
          name: 'Test Plan',
          price: 499,
          isActive: false,
        }));

        expect(prismaMock.plan.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            isActive: false,
          }),
        });
      });

      it('should default isActive to true', async () => {
        const createdPlan = createMockPlan();
        prismaMock.plan.create.mockResolvedValue(createdPlan as any);

        await POST(createMockPostRequest({
          name: 'Test Plan',
          price: 499,
        }));

        expect(prismaMock.plan.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            isActive: true,
          }),
        });
      });

      it('should set default limits', async () => {
        const createdPlan = createMockPlan();
        prismaMock.plan.create.mockResolvedValue(createdPlan as any);

        await POST(createMockPostRequest({
          name: 'Test Plan',
          price: 499,
        }));

        expect(prismaMock.plan.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            maxUsers: 10,
            maxPets: 100,
            storageGB: 5,
          }),
        });
      });

      it('should return 201 status on successful creation', async () => {
        const createdPlan = createMockPlan();
        prismaMock.plan.create.mockResolvedValue(createdPlan as any);

        const response = await POST(createMockPostRequest({
          name: 'Test Plan',
          price: 499,
        }));

        expect(response.status).toBe(201);
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        prismaMock.plan.create.mockRejectedValue(new Error('Database error'));

        const response = await POST(createMockPostRequest({
          name: 'Test Plan',
          price: 499,
        }));
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });

      it('should handle invalid JSON body', async () => {
        const request = new Request('http://localhost:3000/api/admin/billing/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });
    });
  });
});
