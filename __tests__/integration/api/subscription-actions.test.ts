/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Kinde auth
const mockGetUser = jest.fn();
const mockIsAuthenticated = jest.fn();
jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: () => ({
    getUser: mockGetUser,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

// Mock trial utils
const mockCalculateTrialStatus = jest.fn();
jest.mock('@/lib/trial/utils', () => ({
  calculateTrialStatus: (...args: any[]) => mockCalculateTrialStatus(...args),
}));

// Import after mocks
import {
  getSubscriptionStatus,
  checkFeatureAccess,
  requireActivePlan,
} from '@/app/actions/subscription';

// Test data factories
const createMockPlan = (overrides = {}) => ({
  id: 'plan-1',
  key: 'PROFESIONAL',
  name: 'Plan Profesional',
  monthlyPrice: new Decimal(1199),
  annualPrice: new Decimal(9588),
  features: {
    advancedReports: true,
    advancedInventory: true,
    multiLocation: true,
    automations: false,
    apiAccess: false,
    multiDoctor: true,
    smsReminders: true,
  },
  ...overrides,
});

const createMockTenantSubscription = (overrides = {}) => ({
  id: 'sub-1',
  tenantId: 'tenant-1',
  planId: 'plan-1',
  status: 'ACTIVE',
  currentPeriodStart: new Date('2025-01-01'),
  currentPeriodEnd: new Date('2025-02-01'),
  cancelAtPeriodEnd: false,
  plan: createMockPlan(),
  ...overrides,
});

const createMockTenant = (overrides = {}) => ({
  id: 'tenant-1',
  name: 'Test Clinic',
  subscriptionStatus: 'ACTIVE',
  isTrialPeriod: false,
  trialEndsAt: null,
  planType: 'PROFESIONAL',
  planName: 'Plan Profesional',
  subscriptionEndsAt: new Date('2025-02-01'),
  tenantSubscription: createMockTenantSubscription(),
  ...overrides,
});

const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  tenantId: 'tenant-1',
  tenant: createMockTenant(),
  ...overrides,
});

describe('Subscription Server Actions Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetUser.mockResolvedValue({ id: 'kinde-user-1' });
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getSubscriptionStatus', () => {
    describe('Authentication', () => {
      it('should return null when not authenticated', async () => {
        mockIsAuthenticated.mockResolvedValue(false);

        const result = await getSubscriptionStatus();

        expect(result).toBeNull();
      });

      it('should return null when user has no id', async () => {
        mockGetUser.mockResolvedValue({});

        const result = await getSubscriptionStatus();

        expect(result).toBeNull();
      });

      it('should return null when user is null', async () => {
        mockGetUser.mockResolvedValue(null);

        const result = await getSubscriptionStatus();

        expect(result).toBeNull();
      });
    });

    describe('User/Tenant Resolution', () => {
      it('should return null when user not found in database', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const result = await getSubscriptionStatus();

        expect(result).toBeNull();
      });

      it('should return null when user has no tenant', async () => {
        prismaMock.user.findUnique.mockResolvedValue({ ...createMockUser(), tenant: null } as any);

        const result = await getSubscriptionStatus();

        expect(result).toBeNull();
      });
    });

    describe('Active Subscription', () => {
      it('should return active status for paid subscription', async () => {
        const user = createMockUser();
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const result = await getSubscriptionStatus();

        expect(result).not.toBeNull();
        expect(result?.isActive).toBe(true);
        expect(result?.status).toBe('ACTIVE');
        expect(result?.isTrialPeriod).toBe(false);
      });

      it('should include plan information', async () => {
        const user = createMockUser();
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const result = await getSubscriptionStatus();

        expect(result?.planType).toBe('PROFESIONAL');
        expect(result?.planName).toBe('Plan Profesional');
      });

      it('should include renewal date from subscription', async () => {
        const renewalDate = new Date('2025-02-01');
        const user = createMockUser();
        user.tenant.tenantSubscription.currentPeriodEnd = renewalDate;
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const result = await getSubscriptionStatus();

        expect(result?.renewalDate).toEqual(renewalDate);
      });
    });

    describe('Trial Period', () => {
      it('should return active status for trial period', async () => {
        const user = createMockUser();
        user.tenant.isTrialPeriod = true;
        user.tenant.subscriptionStatus = 'TRIALING';
        user.tenant.trialEndsAt = new Date('2025-02-15');
        prismaMock.user.findUnique.mockResolvedValue(user as any);
        mockCalculateTrialStatus.mockReturnValue({ daysRemaining: 15 });

        const result = await getSubscriptionStatus();

        expect(result?.isActive).toBe(true);
        expect(result?.isTrialPeriod).toBe(true);
        expect(result?.daysRemaining).toBe(15);
      });

      it('should include trial end date', async () => {
        const trialEnd = new Date('2025-02-15');
        const user = createMockUser();
        user.tenant.isTrialPeriod = true;
        user.tenant.trialEndsAt = trialEnd;
        prismaMock.user.findUnique.mockResolvedValue(user as any);
        mockCalculateTrialStatus.mockReturnValue({ daysRemaining: 15 });

        const result = await getSubscriptionStatus();

        expect(result?.trialEndsAt).toEqual(trialEnd);
      });

      it('should not calculate days remaining when not in trial', async () => {
        const user = createMockUser();
        user.tenant.isTrialPeriod = false;
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const result = await getSubscriptionStatus();

        expect(result?.daysRemaining).toBeNull();
        expect(mockCalculateTrialStatus).not.toHaveBeenCalled();
      });
    });

    describe('Inactive Status', () => {
      it('should return inactive when subscription is not active and not trialing', async () => {
        const user = createMockUser();
        user.tenant.subscriptionStatus = 'CANCELED';
        user.tenant.isTrialPeriod = false;
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const result = await getSubscriptionStatus();

        expect(result?.isActive).toBe(false);
        expect(result?.status).toBe('CANCELED');
      });
    });

    describe('Edge Cases', () => {
      it('should use tenant planName when subscription plan is missing', async () => {
        const user = createMockUser();
        user.tenant.tenantSubscription = null as any;
        user.tenant.planName = 'Legacy Plan';
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const result = await getSubscriptionStatus();

        expect(result?.planName).toBe('Legacy Plan');
      });

      it('should use subscriptionEndsAt when subscription currentPeriodEnd is missing', async () => {
        const subscriptionEnd = new Date('2025-03-01');
        const user = createMockUser();
        user.tenant.tenantSubscription = null as any;
        user.tenant.subscriptionEndsAt = subscriptionEnd;
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const result = await getSubscriptionStatus();

        expect(result?.renewalDate).toEqual(subscriptionEnd);
      });
    });

    describe('Error Handling', () => {
      it('should return null on database error', async () => {
        prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'));

        const result = await getSubscriptionStatus();

        expect(result).toBeNull();
      });

      it('should log error on failure', async () => {
        const consoleSpy = jest.spyOn(console, 'error');
        prismaMock.user.findUnique.mockRejectedValue(new Error('Test error'));

        await getSubscriptionStatus();

        expect(consoleSpy).toHaveBeenCalled();
      });
    });
  });

  describe('checkFeatureAccess', () => {
    describe('Authentication', () => {
      it('should return false when not authenticated', async () => {
        mockIsAuthenticated.mockResolvedValue(false);

        const result = await checkFeatureAccess('advancedReports');

        expect(result).toBe(false);
      });

      it('should return false when user has no id', async () => {
        mockGetUser.mockResolvedValue({});

        const result = await checkFeatureAccess('advancedReports');

        expect(result).toBe(false);
      });
    });

    describe('User/Tenant Resolution', () => {
      it('should return false when user not found', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const result = await checkFeatureAccess('advancedReports');

        expect(result).toBe(false);
      });

      it('should return false when user has no tenant', async () => {
        prismaMock.user.findUnique.mockResolvedValue({ ...createMockUser(), tenant: null } as any);

        const result = await checkFeatureAccess('advancedReports');

        expect(result).toBe(false);
      });
    });

    describe('Trial User Feature Access', () => {
      it('should restrict advanced features for trial users', async () => {
        const user = createMockUser();
        user.tenant.tenantSubscription = null as any;
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        expect(await checkFeatureAccess('advancedInventory')).toBe(false);
        expect(await checkFeatureAccess('advancedReports')).toBe(false);
        expect(await checkFeatureAccess('multiLocation')).toBe(false);
        expect(await checkFeatureAccess('automations')).toBe(false);
        expect(await checkFeatureAccess('apiAccess')).toBe(false);
      });

      it('should allow basic features for trial users', async () => {
        const user = createMockUser();
        user.tenant.tenantSubscription = null as any;
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        expect(await checkFeatureAccess('basicFeature')).toBe(true);
        expect(await checkFeatureAccess('multiDoctor')).toBe(true);
      });
    });

    describe('Plan-Based Feature Access', () => {
      it('should allow features enabled in plan', async () => {
        const user = createMockUser();
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        expect(await checkFeatureAccess('advancedReports')).toBe(true);
        expect(await checkFeatureAccess('advancedInventory')).toBe(true);
        expect(await checkFeatureAccess('multiLocation')).toBe(true);
        expect(await checkFeatureAccess('multiDoctor')).toBe(true);
        expect(await checkFeatureAccess('smsReminders')).toBe(true);
      });

      it('should deny features disabled in plan', async () => {
        const user = createMockUser();
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        expect(await checkFeatureAccess('automations')).toBe(false);
        expect(await checkFeatureAccess('apiAccess')).toBe(false);
      });

      it('should return false for unknown features', async () => {
        const user = createMockUser();
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        expect(await checkFeatureAccess('unknownFeature')).toBe(false);
      });
    });

    describe('Feature Checks', () => {
      it('should check advancedReports feature', async () => {
        const user = createMockUser();
        user.tenant.tenantSubscription.plan.features = { advancedReports: true };
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const result = await checkFeatureAccess('advancedReports');

        expect(result).toBe(true);
      });

      it('should check advancedInventory feature', async () => {
        const user = createMockUser();
        user.tenant.tenantSubscription.plan.features = { advancedInventory: false };
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const result = await checkFeatureAccess('advancedInventory');

        expect(result).toBe(false);
      });

      it('should check multiLocation feature', async () => {
        const user = createMockUser();
        user.tenant.tenantSubscription.plan.features = { multiLocation: true };
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const result = await checkFeatureAccess('multiLocation');

        expect(result).toBe(true);
      });

      it('should check automations feature', async () => {
        const user = createMockUser();
        user.tenant.tenantSubscription.plan.features = { automations: true };
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const result = await checkFeatureAccess('automations');

        expect(result).toBe(true);
      });

      it('should check apiAccess feature', async () => {
        const user = createMockUser();
        user.tenant.tenantSubscription.plan.features = { apiAccess: true };
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const result = await checkFeatureAccess('apiAccess');

        expect(result).toBe(true);
      });

      it('should check multiDoctor feature', async () => {
        const user = createMockUser();
        user.tenant.tenantSubscription.plan.features = { multiDoctor: false };
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const result = await checkFeatureAccess('multiDoctor');

        expect(result).toBe(false);
      });

      it('should check smsReminders feature', async () => {
        const user = createMockUser();
        user.tenant.tenantSubscription.plan.features = { smsReminders: true };
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const result = await checkFeatureAccess('smsReminders');

        expect(result).toBe(true);
      });
    });

    describe('Error Handling', () => {
      it('should return false on database error', async () => {
        prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'));

        const result = await checkFeatureAccess('advancedReports');

        expect(result).toBe(false);
      });

      it('should log error on failure', async () => {
        const consoleSpy = jest.spyOn(console, 'error');
        prismaMock.user.findUnique.mockRejectedValue(new Error('Test error'));

        await checkFeatureAccess('advancedReports');

        expect(consoleSpy).toHaveBeenCalled();
      });
    });
  });

  describe('requireActivePlan', () => {
    describe('Authentication', () => {
      it('should redirect to login when not authenticated', async () => {
        mockIsAuthenticated.mockResolvedValue(false);

        const result = await requireActivePlan();

        expect(result.allowed).toBe(false);
        expect(result.redirectTo).toBe('/api/auth/login');
      });
    });

    describe('Active Plan Check', () => {
      it('should allow access when plan is active', async () => {
        const user = createMockUser();
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const result = await requireActivePlan();

        expect(result.allowed).toBe(true);
        expect(result.redirectTo).toBeUndefined();
      });

      it('should redirect when no active plan', async () => {
        const user = createMockUser();
        user.tenant.subscriptionStatus = 'CANCELED';
        user.tenant.isTrialPeriod = false;
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const result = await requireActivePlan();

        expect(result.allowed).toBe(false);
        expect(result.redirectTo).toBe('/dashboard/settings?tab=subscription&reason=no_plan');
      });

      it('should allow access for active trial', async () => {
        const user = createMockUser();
        user.tenant.isTrialPeriod = true;
        user.tenant.subscriptionStatus = 'TRIALING';
        user.tenant.trialEndsAt = new Date('2025-02-15');
        prismaMock.user.findUnique.mockResolvedValue(user as any);
        mockCalculateTrialStatus.mockReturnValue({ daysRemaining: 15 });

        const result = await requireActivePlan();

        expect(result.allowed).toBe(true);
      });
    });

    describe('User Not Found', () => {
      it('should redirect to login when user not found', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const result = await requireActivePlan();

        expect(result.allowed).toBe(false);
        expect(result.redirectTo).toBe('/api/auth/login');
      });
    });

    describe('Error Handling', () => {
      it('should redirect to login when getSubscriptionStatus returns null due to error', async () => {
        // getSubscriptionStatus catches its own errors and returns null
        // So requireActivePlan sees null status and redirects to login
        prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'));

        const result = await requireActivePlan();

        expect(result.allowed).toBe(false);
        expect(result.redirectTo).toBe('/api/auth/login');
      });

      it('should log error when getSubscriptionStatus fails', async () => {
        const consoleSpy = jest.spyOn(console, 'error');
        prismaMock.user.findUnique.mockRejectedValue(new Error('Test error'));

        await requireActivePlan();

        // Error is logged by getSubscriptionStatus
        expect(consoleSpy).toHaveBeenCalled();
      });
    });
  });
});
