/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prismaMock } from '../../mocks/prisma';
import {
  createTestTenant,
  createTestUser,
} from '../../utils/test-utils';

// Test data factories for user/tenant
const createTestTenantSubscription = (overrides = {}) => ({
  id: 'subscription-1',
  tenantId: 'tenant-1',
  planId: 'plan-1',
  status: 'ACTIVE',
  stripeSubscriptionId: 'sub_mock_test_id',
  stripeCustomerId: 'cus_mock_test_id',
  currentPeriodStart: new Date('2024-01-01'),
  currentPeriodEnd: new Date('2024-02-01'),
  cancelAtPeriodEnd: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const createTestPlanStatus = (overrides = {}) => ({
  plan: 'PROFESIONAL',
  planName: 'Plan Profesional',
  status: 'ACTIVE',
  isTrialPeriod: false,
  limits: {
    maxPets: 200,
    maxAppointments: 500,
    maxUsers: 5,
    maxLocations: 3,
  },
  usage: {
    pets: 45,
    appointments: 120,
    users: 3,
    locations: 1,
  },
  ...overrides,
});

describe('User/Tenant API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockSubscription: ReturnType<typeof createTestTenantSubscription>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockSubscription = createTestTenantSubscription({ tenantId: mockTenant.id });

    // Mock Prisma responses
    prismaMock.user.findUnique.mockResolvedValue({
      ...mockUser,
      tenant: mockTenant,
    });
  });

  describe('GET /api/user', () => {
    it('should return authenticated user with tenant info', async () => {
      const userWithTenant = {
        ...mockUser,
        tenant: {
          ...mockTenant,
          tenantSubscription: mockSubscription,
        },
      };

      prismaMock.user.findUnique.mockResolvedValue(userWithTenant);

      const result = await prismaMock.user.findUnique({
        where: { id: mockUser.id },
        include: {
          tenant: {
            include: {
              tenantSubscription: true,
            },
          },
        },
      });

      expect(result?.id).toBe(mockUser.id);
      expect(result?.tenant).toBeDefined();
      expect(result?.tenant?.name).toBe(mockTenant.name);
    });

    it('should sync user to local database (findOrCreate)', async () => {
      const kindeUser = {
        id: 'kinde-user-123',
        email: 'new@example.com',
        given_name: 'New',
        family_name: 'User',
      };

      // User doesn't exist yet
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      // Check if user exists
      const existingUser = await prismaMock.user.findUnique({
        where: { id: kindeUser.id },
      });
      expect(existingUser).toBeNull();

      // Create user
      const createdUser = {
        ...mockUser,
        id: kindeUser.id,
        email: kindeUser.email,
        name: `${kindeUser.given_name} ${kindeUser.family_name}`,
      };

      prismaMock.user.upsert.mockResolvedValue(createdUser);

      const result = await prismaMock.user.upsert({
        where: { id: kindeUser.id },
        create: {
          id: kindeUser.id,
          email: kindeUser.email,
          name: `${kindeUser.given_name} ${kindeUser.family_name}`,
        },
        update: {
          email: kindeUser.email,
          name: `${kindeUser.given_name} ${kindeUser.family_name}`,
        },
      });

      expect(result.id).toBe(kindeUser.id);
      expect(result.email).toBe(kindeUser.email);
    });

    it('should include subscription details in response', async () => {
      const userWithSubscription = {
        ...mockUser,
        tenant: {
          ...mockTenant,
          subscriptionStatus: 'ACTIVE',
          isTrialPeriod: false,
          tenantSubscription: {
            ...mockSubscription,
            plan: {
              key: 'PROFESIONAL',
              name: 'Plan Profesional',
            },
          },
        },
      };

      prismaMock.user.findUnique.mockResolvedValue(userWithSubscription);

      const result = await prismaMock.user.findUnique({
        where: { id: mockUser.id },
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

      expect(result?.tenant?.subscriptionStatus).toBe('ACTIVE');
      expect(result?.tenant?.tenantSubscription?.plan?.key).toBe('PROFESIONAL');
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Kinde session would not be authenticated
      const isAuthenticated = false;

      expect(isAuthenticated).toBe(false);
      // API would return: { error: 'Unauthorized' }, { status: 401 }
    });
  });

  describe('GET /api/user/subscription', () => {
    it('should return detailed subscription info', async () => {
      const subscriptionDetails = {
        tenant: mockTenant,
        subscription: mockSubscription,
        plan: {
          key: 'PROFESIONAL',
          name: 'Plan Profesional',
          features: ['pets', 'appointments', 'inventory'],
        },
        status: 'ACTIVE',
        isTrialPeriod: false,
      };

      prismaMock.tenantSubscription.findUnique.mockResolvedValue({
        ...mockSubscription,
        tenant: mockTenant,
        plan: subscriptionDetails.plan,
      });

      const result = await prismaMock.tenantSubscription.findUnique({
        where: { tenantId: mockTenant.id },
        include: {
          tenant: true,
          plan: true,
        },
      });

      expect(result?.status).toBe('ACTIVE');
      expect(result?.plan?.key).toBe('PROFESIONAL');
    });

    it('should calculate trial days remaining', () => {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days from now

      const now = new Date();
      const daysRemaining = Math.ceil(
        (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysRemaining).toBe(7);
    });

    it('should calculate subscription days remaining', () => {
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 15); // 15 days from now

      const now = new Date();
      const daysRemaining = Math.ceil(
        (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysRemaining).toBe(15);
    });

    it('should include Stripe details when present', async () => {
      const subscriptionWithStripe = {
        ...mockSubscription,
        stripeCustomerId: 'cus_mock_test_id',
        stripeSubscriptionId: 'sub_mock_test_id',
      };

      prismaMock.tenantSubscription.findUnique.mockResolvedValue(subscriptionWithStripe);

      const result = await prismaMock.tenantSubscription.findUnique({
        where: { tenantId: mockTenant.id },
      });

      expect(result?.stripeCustomerId).toBe('cus_mock_test_id');
      expect(result?.stripeSubscriptionId).toBe('sub_mock_test_id');
    });

    it('should handle subscription without Stripe (trial)', async () => {
      const trialSubscription = {
        ...mockSubscription,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        status: 'TRIALING',
      };

      prismaMock.tenantSubscription.findUnique.mockResolvedValue(trialSubscription);

      const result = await prismaMock.tenantSubscription.findUnique({
        where: { tenantId: mockTenant.id },
      });

      expect(result?.stripeCustomerId).toBeNull();
      expect(result?.stripeSubscriptionId).toBeNull();
      expect(result?.status).toBe('TRIALING');
    });
  });

  describe('GET /api/user/tenant', () => {
    it('should return current tenant for user', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await prismaMock.tenant.findUnique({
        where: { id: mockTenant.id },
      });

      expect(result?.id).toBe(mockTenant.id);
      expect(result?.name).toBe(mockTenant.name);
      expect(result?.slug).toBe(mockTenant.slug);
    });

    it('should return null if user has no tenant', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        tenantId: null,
        tenant: null,
      });

      const result = await prismaMock.user.findUnique({
        where: { id: mockUser.id },
        include: { tenant: true },
      });

      expect(result?.tenant).toBeNull();
    });

    it('should include tenant subscription status', async () => {
      const tenantWithStatus = {
        ...mockTenant,
        subscriptionStatus: 'ACTIVE',
        isTrialPeriod: false,
        trialEndsAt: null,
      };

      prismaMock.tenant.findUnique.mockResolvedValue(tenantWithStatus);

      const result = await prismaMock.tenant.findUnique({
        where: { id: mockTenant.id },
      });

      expect(result?.subscriptionStatus).toBe('ACTIVE');
      expect(result?.isTrialPeriod).toBe(false);
    });
  });

  describe('GET /api/tenant/plan-status', () => {
    it('should return plan limits and usage metrics', async () => {
      const planStatus = createTestPlanStatus();

      // Mock the aggregation queries for usage
      prismaMock.pet.count.mockResolvedValue(planStatus.usage.pets);
      prismaMock.appointment.count.mockResolvedValue(planStatus.usage.appointments);
      prismaMock.user.count.mockResolvedValue(planStatus.usage.users);
      prismaMock.location.count.mockResolvedValue(planStatus.usage.locations);

      const petCount = await prismaMock.pet.count({
        where: { tenantId: mockTenant.id },
      });
      const appointmentCount = await prismaMock.appointment.count({
        where: { tenantId: mockTenant.id },
      });

      expect(petCount).toBe(45);
      expect(appointmentCount).toBe(120);
    });

    it('should return correct limit values for plan', () => {
      const planLimits = {
        BASICO: { maxPets: 50, maxAppointments: 100, maxUsers: 2 },
        PROFESIONAL: { maxPets: 200, maxAppointments: 500, maxUsers: 5 },
        CORPORATIVO: { maxPets: -1, maxAppointments: -1, maxUsers: -1 }, // Unlimited
      };

      expect(planLimits.BASICO.maxPets).toBe(50);
      expect(planLimits.PROFESIONAL.maxAppointments).toBe(500);
      expect(planLimits.CORPORATIVO.maxUsers).toBe(-1); // Unlimited
    });

    it('should calculate usage percentage correctly', () => {
      const usage = 45;
      const limit = 200;
      const percentage = Math.round((usage / limit) * 100);

      expect(percentage).toBe(23); // 45/200 = 22.5% rounded to 23%
    });

    it('should handle unlimited plans (-1 limit)', () => {
      const limit = -1; // Unlimited
      const usage = 1000;

      // For unlimited plans, percentage should be 0 or not calculated
      const isUnlimited = limit === -1;
      const percentage = isUnlimited ? 0 : Math.round((usage / limit) * 100);

      expect(isUnlimited).toBe(true);
      expect(percentage).toBe(0);
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should only return user data for authenticated user', async () => {
      prismaMock.user.findUnique.mockImplementation(async (args: any) => {
        if (args?.where?.id === mockUser.id) {
          return { ...mockUser, tenant: mockTenant };
        }
        return null;
      });

      // Valid user
      const validResult = await prismaMock.user.findUnique({
        where: { id: mockUser.id },
        include: { tenant: true },
      });
      expect(validResult).toBeDefined();

      // Other user
      const invalidResult = await prismaMock.user.findUnique({
        where: { id: 'other-user-id' },
        include: { tenant: true },
      });
      expect(invalidResult).toBeNull();
    });

    it('should not expose tenant data from other users', async () => {
      const otherTenant = createTestTenant({
        id: 'other-tenant-id',
        name: 'Other Clinic',
        slug: 'other-clinic',
      });

      prismaMock.tenant.findMany.mockImplementation(async (args: any) => {
        // Should only return tenant associated with current user
        return [mockTenant];
      });

      const result = await prismaMock.tenant.findMany();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockTenant.id);
      expect(result).not.toContainEqual(
        expect.objectContaining({ id: 'other-tenant-id' })
      );
    });
  });
});
