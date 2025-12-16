/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Kinde auth
const mockGetUser = jest.fn();
jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: () => ({
    getUser: mockGetUser,
  }),
}));

// Mock downgrade validation
const mockValidateDowngrade = jest.fn();
const mockIsPlanDowngrade = jest.fn();
jest.mock('@/lib/downgrade-validation', () => ({
  validateDowngrade: (...args: any[]) => mockValidateDowngrade(...args),
  isPlanDowngrade: (...args: any[]) => mockIsPlanDowngrade(...args),
}));

// Import after mocks
import { POST } from '@/app/api/plans/validate-downgrade/route';
import { NextRequest } from 'next/server';

// Test data factories
const createMockPlan = (overrides = {}) => ({
  id: 'plan-1',
  key: 'PROFESIONAL',
  name: 'Plan Profesional',
  monthlyPrice: new Decimal(1199),
  annualPrice: new Decimal(9588),
  ...overrides,
});

const createMockTenantSubscription = (overrides = {}) => ({
  id: 'sub-1',
  tenantId: 'tenant-1',
  planId: 'plan-1',
  status: 'ACTIVE',
  plan: createMockPlan(),
  ...overrides,
});

const createMockTenant = (overrides = {}) => ({
  id: 'tenant-1',
  name: 'Test Clinic',
  tenantSubscription: createMockTenantSubscription(),
  ...overrides,
});

const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  tenantId: 'tenant-1',
  tenant: createMockTenant(),
  ...overrides,
});

// Helper to create mock POST request
const createMockRequest = (body: object) => {
  return new NextRequest('http://localhost:3000/api/plans/validate-downgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

describe('Validate Downgrade API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ id: 'kinde-user-1' });
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/plans/validate-downgrade', () => {
    describe('Validation', () => {
      it('should return 400 when targetPlanKey is missing', async () => {
        const response = await POST(createMockRequest({}));
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('targetPlanKey es requerido');
      });
    });

    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue(null);

        const response = await POST(createMockRequest({ targetPlanKey: 'BASICO' }));
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('No autenticado');
      });

      it('should proceed when user is authenticated', async () => {
        mockGetUser.mockResolvedValue({ id: 'kinde-user-1' });
        prismaMock.user.findUnique.mockResolvedValue(createMockUser() as any);
        mockIsPlanDowngrade.mockReturnValue(false);

        const response = await POST(createMockRequest({ targetPlanKey: 'CORPORATIVO' }));
        const data = await response.json();

        expect(response.status).toBe(200);
      });
    });

    describe('User/Tenant Resolution', () => {
      it('should return 404 when user not found', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const response = await POST(createMockRequest({ targetPlanKey: 'BASICO' }));
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Tenant no encontrado');
      });

      it('should return 404 when user has no tenant', async () => {
        prismaMock.user.findUnique.mockResolvedValue({ ...createMockUser(), tenant: null } as any);

        const response = await POST(createMockRequest({ targetPlanKey: 'BASICO' }));
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Tenant no encontrado');
      });

      it('should return 404 when tenant has no current plan', async () => {
        const userWithNoSubscription = createMockUser();
        userWithNoSubscription.tenant.tenantSubscription = null as any;
        prismaMock.user.findUnique.mockResolvedValue(userWithNoSubscription as any);

        const response = await POST(createMockRequest({ targetPlanKey: 'BASICO' }));
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Plan actual no encontrado');
      });

      it('should return 404 when subscription has no plan', async () => {
        const userWithNoPlan = createMockUser();
        userWithNoPlan.tenant.tenantSubscription.plan = null as any;
        prismaMock.user.findUnique.mockResolvedValue(userWithNoPlan as any);

        const response = await POST(createMockRequest({ targetPlanKey: 'BASICO' }));
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Plan actual no encontrado');
      });
    });

    describe('Non-Downgrade Cases', () => {
      it('should return success for non-downgrade (upgrade)', async () => {
        prismaMock.user.findUnique.mockResolvedValue(createMockUser() as any);
        mockIsPlanDowngrade.mockReturnValue(false);

        const response = await POST(createMockRequest({ targetPlanKey: 'CORPORATIVO' }));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.isDowngrade).toBe(false);
        expect(data.canProceed).toBe(true);
        expect(data.message).toBe('Este cambio no es un downgrade, puedes proceder normalmente');
      });

      it('should call isPlanDowngrade with correct params', async () => {
        const user = createMockUser();
        prismaMock.user.findUnique.mockResolvedValue(user as any);
        mockIsPlanDowngrade.mockReturnValue(false);

        await POST(createMockRequest({ targetPlanKey: 'CORPORATIVO' }));

        expect(mockIsPlanDowngrade).toHaveBeenCalledWith('PROFESIONAL', 'CORPORATIVO');
      });
    });

    describe('Downgrade Validation', () => {
      it('should call validateDowngrade for actual downgrades', async () => {
        const user = createMockUser();
        prismaMock.user.findUnique.mockResolvedValue(user as any);
        mockIsPlanDowngrade.mockReturnValue(true);
        mockValidateDowngrade.mockResolvedValue({
          canDowngrade: true,
          blockers: [],
          warnings: [],
        });

        await POST(createMockRequest({ targetPlanKey: 'BASICO' }));

        expect(mockValidateDowngrade).toHaveBeenCalledWith('tenant-1', 'BASICO');
      });

      it('should return validation results for allowed downgrade', async () => {
        prismaMock.user.findUnique.mockResolvedValue(createMockUser() as any);
        mockIsPlanDowngrade.mockReturnValue(true);
        mockValidateDowngrade.mockResolvedValue({
          canDowngrade: true,
          blockers: [],
          warnings: [{ type: 'feature_loss', feature: 'API', description: 'Perderás API' }],
        });

        const response = await POST(createMockRequest({ targetPlanKey: 'BASICO' }));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.isDowngrade).toBe(true);
        expect(data.canProceed).toBe(true);
        expect(data.validation.canDowngrade).toBe(true);
        expect(data.validation.warnings).toHaveLength(1);
      });

      it('should return validation results for blocked downgrade', async () => {
        prismaMock.user.findUnique.mockResolvedValue(createMockUser() as any);
        mockIsPlanDowngrade.mockReturnValue(true);
        mockValidateDowngrade.mockResolvedValue({
          canDowngrade: false,
          blockers: [{
            type: 'limit_exceeded',
            resource: 'pets',
            current: 600,
            newLimit: 500,
            excess: 100,
            message: 'Tienes 600 mascotas, pero el plan Básico solo permite 500',
          }],
          warnings: [],
        });

        const response = await POST(createMockRequest({ targetPlanKey: 'BASICO' }));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.isDowngrade).toBe(true);
        expect(data.canProceed).toBe(false);
        expect(data.validation.canDowngrade).toBe(false);
        expect(data.validation.blockers).toHaveLength(1);
      });

      it('should include current plan info in response', async () => {
        const user = createMockUser();
        prismaMock.user.findUnique.mockResolvedValue(user as any);
        mockIsPlanDowngrade.mockReturnValue(true);
        mockValidateDowngrade.mockResolvedValue({
          canDowngrade: true,
          blockers: [],
          warnings: [],
        });

        const response = await POST(createMockRequest({ targetPlanKey: 'BASICO' }));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.currentPlan).toEqual({
          key: 'PROFESIONAL',
          name: 'Plan Profesional',
        });
      });
    });

    describe('Database Queries', () => {
      it('should query user with tenant and subscription includes', async () => {
        mockGetUser.mockResolvedValue({ id: 'kinde-user-1' });
        prismaMock.user.findUnique.mockResolvedValue(createMockUser() as any);
        mockIsPlanDowngrade.mockReturnValue(false);

        await POST(createMockRequest({ targetPlanKey: 'BASICO' }));

        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'kinde-user-1' },
          include: {
            tenant: {
              include: {
                tenantSubscription: {
                  include: { plan: true },
                },
              },
            },
          },
        });
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on database error', async () => {
        prismaMock.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

        const response = await POST(createMockRequest({ targetPlanKey: 'BASICO' }));
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });

      it('should return 500 on validation error', async () => {
        prismaMock.user.findUnique.mockResolvedValue(createMockUser() as any);
        mockIsPlanDowngrade.mockReturnValue(true);
        mockValidateDowngrade.mockRejectedValue(new Error('Validation failed'));

        const response = await POST(createMockRequest({ targetPlanKey: 'BASICO' }));
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });

      it('should include error details in error response', async () => {
        const errorMessage = 'Something went wrong';
        prismaMock.user.findUnique.mockRejectedValue(new Error(errorMessage));

        const response = await POST(createMockRequest({ targetPlanKey: 'BASICO' }));
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.details).toBe(errorMessage);
      });

      it('should log error on failure', async () => {
        const consoleSpy = jest.spyOn(console, 'error');
        prismaMock.user.findUnique.mockRejectedValue(new Error('Test error'));

        await POST(createMockRequest({ targetPlanKey: 'BASICO' }));

        expect(consoleSpy).toHaveBeenCalled();
      });
    });
  });
});
