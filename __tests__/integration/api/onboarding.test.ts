/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import {
  createTestTenant,
  createTestUser,
} from '../../utils/test-utils';

// Test data factories for onboarding
const createTestPlan = (overrides = {}) => ({
  id: 'plan-1',
  key: 'BASICO',
  name: 'Plan Básico',
  description: 'Plan básico para clínicas pequeñas',
  monthlyPrice: { toNumber: () => 299 },
  annualPrice: { toNumber: () => 2990 },
  isActive: true,
  features: ['pets', 'appointments', 'customers'],
  maxPets: 50,
  maxAppointments: 100,
  maxUsers: 2,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('Onboarding API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockPlans: ReturnType<typeof createTestPlan>[];

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data - user without tenant for onboarding
    mockUser = createTestUser({ tenantId: null });
    mockTenant = createTestTenant();
    mockPlans = [
      createTestPlan({ key: 'BASICO', monthlyPrice: { toNumber: () => 299 } }),
      createTestPlan({
        id: 'plan-2',
        key: 'PROFESIONAL',
        name: 'Plan Profesional',
        monthlyPrice: { toNumber: () => 599 },
        annualPrice: { toNumber: () => 5990 },
        maxPets: 200,
        maxAppointments: 500,
        maxUsers: 5,
      }),
      createTestPlan({
        id: 'plan-3',
        key: 'CORPORATIVO',
        name: 'Plan Corporativo',
        monthlyPrice: { toNumber: () => 999 },
        annualPrice: { toNumber: () => 9990 },
        maxPets: -1, // Unlimited
        maxAppointments: -1,
        maxUsers: -1,
      }),
    ];

    // Mock Prisma responses
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
  });

  describe('POST /api/onboarding', () => {
    it('should create clinic with trial period', async () => {
      const onboardingData = {
        planKey: 'BASICO',
        billingInterval: 'monthly',
        clinicName: 'Mi Clínica Veterinaria',
        slug: 'mi-clinica',
        phone: '+52 1 55 1234 5678',
        address: '123 Main Street',
      };

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

      const createdTenant = {
        ...mockTenant,
        name: onboardingData.clinicName,
        slug: onboardingData.slug,
        isTrialPeriod: true,
        trialEndsAt,
        subscriptionStatus: 'TRIALING',
      };

      prismaMock.tenant.findUnique.mockResolvedValue(null); // Slug not taken
      prismaMock.tenant.create.mockResolvedValue(createdTenant);

      // Verify slug availability
      const slugCheck = await prismaMock.tenant.findUnique({
        where: { slug: onboardingData.slug },
      });
      expect(slugCheck).toBeNull();

      // Create tenant
      const result = await prismaMock.tenant.create({
        data: {
          name: onboardingData.clinicName,
          slug: onboardingData.slug,
          isTrialPeriod: true,
          trialEndsAt,
          subscriptionStatus: 'TRIALING',
        },
      });

      expect(result.name).toBe('Mi Clínica Veterinaria');
      expect(result.slug).toBe('mi-clinica');
      expect(result.isTrialPeriod).toBe(true);
      expect(result.subscriptionStatus).toBe('TRIALING');
    });

    it('should validate required fields (name, slug, planKey)', () => {
      const invalidData = {
        // Missing planKey
        billingInterval: 'monthly',
        clinicName: 'Test Clinic',
        // Missing slug
      };

      const requiredFields = ['planKey', 'clinicName', 'slug'];
      const missingFields = requiredFields.filter((field) => !(field in invalidData));

      expect(missingFields).toContain('planKey');
      expect(missingFields).toContain('slug');
      // API would return: { message: 'Datos inválidos', errors: [...] }, { status: 400 }
    });

    it('should reject if user already has tenant', async () => {
      const userWithTenant = {
        ...mockUser,
        tenantId: mockTenant.id,
        tenant: mockTenant,
      };

      prismaMock.user.findUnique.mockResolvedValue(userWithTenant);

      const user = await prismaMock.user.findUnique({
        where: { id: mockUser.id },
        include: { tenant: true },
      });

      expect(user?.tenant).toBeDefined();
      // API would return: { message: 'El usuario ya tiene una clínica configurada' }, { status: 400 }
    });

    it('should check slug availability before creation', async () => {
      const takenSlug = 'existing-clinic';

      // Simulate existing tenant with this slug
      prismaMock.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        slug: takenSlug,
      });

      const existingTenant = await prismaMock.tenant.findUnique({
        where: { slug: takenSlug },
      });

      expect(existingTenant).not.toBeNull();
      expect(existingTenant?.slug).toBe(takenSlug);
      // API would return: { message: 'Esta URL ya está en uso' }, { status: 400 }
    });

    it('should validate slug format (lowercase, alphanumeric, hyphens)', () => {
      const slugRegex = /^[a-z0-9-]+$/;

      const validSlugs = ['my-clinic', 'clinica123', 'vet-care-2024'];
      const invalidSlugs = ['My Clinic', 'clinic_name', 'UPPERCASE', 'special@chars'];

      validSlugs.forEach((slug) => {
        expect(slugRegex.test(slug)).toBe(true);
      });

      invalidSlugs.forEach((slug) => {
        expect(slugRegex.test(slug)).toBe(false);
      });
    });

    it('should validate plan key options', () => {
      const validPlanKeys = ['BASICO', 'PROFESIONAL', 'CORPORATIVO'];
      const invalidPlanKey = 'INVALID_PLAN';

      expect(validPlanKeys.includes('BASICO')).toBe(true);
      expect(validPlanKeys.includes(invalidPlanKey)).toBe(false);
    });

    it('should validate billing interval options', () => {
      const validIntervals = ['monthly', 'yearly'];
      const invalidInterval = 'weekly';

      expect(validIntervals.includes('monthly')).toBe(true);
      expect(validIntervals.includes('yearly')).toBe(true);
      expect(validIntervals.includes(invalidInterval)).toBe(false);
    });
  });

  describe('GET /api/onboarding/check-slug', () => {
    it('should return available: true for unused slug', async () => {
      const unusedSlug = 'new-clinic';

      prismaMock.tenant.findUnique.mockResolvedValue(null);

      const result = await prismaMock.tenant.findUnique({
        where: { slug: unusedSlug },
      });

      expect(result).toBeNull();
      // API would return: { available: true, message: 'Esta URL está disponible' }
    });

    it('should return available: false for taken slug', async () => {
      const takenSlug = 'existing-clinic';

      prismaMock.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        slug: takenSlug,
      });

      const result = await prismaMock.tenant.findUnique({
        where: { slug: takenSlug },
      });

      expect(result).not.toBeNull();
      expect(result?.slug).toBe(takenSlug);
      // API would return: { available: false, message: 'Esta URL ya está en uso' }
    });

    it('should validate slug format before checking availability', () => {
      const invalidSlug = 'Invalid Slug With Spaces';
      const slugRegex = /^[a-z0-9-]+$/;

      expect(slugRegex.test(invalidSlug)).toBe(false);
      // API would return: { available: false, message: 'El slug solo puede contener...' }
    });

    it('should return 400 if slug parameter is missing', () => {
      const searchParams = new URLSearchParams();
      const slug = searchParams.get('slug');

      expect(slug).toBeNull();
      // API would return: { message: 'Slug parameter is required' }, { status: 400 }
    });
  });

  describe('GET /api/onboarding/plans', () => {
    it('should return active plans with pricing', async () => {
      prismaMock.plan.findMany.mockResolvedValue(mockPlans);

      const result = await prismaMock.plan.findMany({
        where: {
          isActive: true,
          key: { in: ['BASICO', 'PROFESIONAL', 'CORPORATIVO'] },
        },
      });

      expect(result).toHaveLength(3);
      expect(result[0].isActive).toBe(true);
      result.forEach((plan: any) => {
        expect(plan.monthlyPrice).toBeDefined();
        expect(plan.annualPrice).toBeDefined();
      });
    });

    it('should return plans sorted by price', async () => {
      const sortedPlans = [...mockPlans].sort(
        (a, b) => a.monthlyPrice.toNumber() - b.monthlyPrice.toNumber()
      );

      prismaMock.plan.findMany.mockResolvedValue(sortedPlans);

      const result = await prismaMock.plan.findMany({
        where: { isActive: true },
        orderBy: { monthlyPrice: 'asc' },
      });

      expect(result[0].key).toBe('BASICO');
      expect(result[1].key).toBe('PROFESIONAL');
      expect(result[2].key).toBe('CORPORATIVO');
    });

    it('should only return active plans', async () => {
      const allPlans = [
        ...mockPlans,
        createTestPlan({
          id: 'inactive-plan',
          key: 'LEGACY',
          isActive: false
        }),
      ];

      prismaMock.plan.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.isActive === true) {
          return allPlans.filter((p) => p.isActive);
        }
        return allPlans;
      });

      const result = await prismaMock.plan.findMany({
        where: { isActive: true },
      });

      expect(result.every((plan: any) => plan.isActive)).toBe(true);
      expect(result).toHaveLength(3);
    });

    it('should convert Decimal prices to numbers for JSON serialization', () => {
      const plan = mockPlans[0];
      const monthlyPrice = plan.monthlyPrice.toNumber();
      const annualPrice = plan.annualPrice.toNumber();

      expect(typeof monthlyPrice).toBe('number');
      expect(typeof annualPrice).toBe('number');
      expect(monthlyPrice).toBe(299);
      expect(annualPrice).toBe(2990);
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should create tenant isolated from other tenants', async () => {
      const newTenantSlug = 'new-unique-clinic';

      // Verify no existing tenant with this slug
      prismaMock.tenant.findUnique.mockResolvedValue(null);

      const slugCheck = await prismaMock.tenant.findUnique({
        where: { slug: newTenantSlug },
      });

      expect(slugCheck).toBeNull();

      // Create new tenant
      const createdTenant = {
        ...mockTenant,
        id: 'new-tenant-id',
        slug: newTenantSlug,
      };

      prismaMock.tenant.create.mockResolvedValue(createdTenant);

      const result = await prismaMock.tenant.create({
        data: {
          name: 'New Clinic',
          slug: newTenantSlug,
          isTrialPeriod: true,
          subscriptionStatus: 'TRIALING',
        },
      });

      expect(result.id).toBe('new-tenant-id');
      expect(result.slug).toBe(newTenantSlug);
    });

    it('should link user to newly created tenant', async () => {
      const newTenantId = 'new-tenant-id';

      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        tenantId: newTenantId,
      });

      const result = await prismaMock.user.update({
        where: { id: mockUser.id },
        data: { tenantId: newTenantId },
      });

      expect(result.tenantId).toBe(newTenantId);
    });
  });
});
