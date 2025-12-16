/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';

// Mock auth module
const mockRequireAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: () => mockRequireAuth(),
  hasActiveSubscription: jest.requireActual('@/lib/auth').hasActiveSubscription,
}));

// Mock serializers
jest.mock('@/lib/serializers', () => ({
  serializeTenant: (tenant: any) => tenant,
}));

// Import after mocks
import { GET } from '@/app/api/tenant/plan-status/route';

// Test data factories
const createTestTenant = (overrides = {}) => ({
  id: 'tenant-1',
  name: 'Test Clinic',
  slug: 'test-clinic',
  stripeCustomerId: 'cus_test123',
  stripeSubscriptionId: 'sub_test123',
  stripeProductId: 'prod_test123',
  planName: 'PROFESIONAL',
  subscriptionStatus: 'ACTIVE',
  subscriptionEndsAt: new Date('2025-12-31'),
  isTrialPeriod: false,
  trialEndsAt: null,
  status: 'ACTIVE',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  tenantSubscription: {
    plan: {
      id: 'plan-1',
      key: 'PROFESIONAL',
      name: 'Profesional',
      maxPets: 1000,
      maxUsers: 10,
      storageGB: 10,
      maxCashRegisters: -1,
      features: {
        whatsappMessages: -1,
        automations: false,
        advancedReports: true,
        advancedInventory: true,
        multiLocation: true,
        multiDoctor: true,
        smsReminders: true,
        apiAccess: false,
      },
    },
  },
  ...overrides,
});

const createTestUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  tenantId: 'tenant-1',
  isActive: true,
  ...overrides,
});

const createTestTrialTenant = (overrides = {}) => {
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  return createTestTenant({
    subscriptionStatus: 'TRIALING',
    isTrialPeriod: true,
    trialEndsAt,
    tenantSubscription: null,
    stripeSubscriptionId: null,
    ...overrides,
  });
};

describe('Tenant Plan Status API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTenant = createTestTenant();
    mockUser = createTestUser();

    // Default: authenticated with tenant
    mockRequireAuth.mockResolvedValue({
      user: mockUser,
      tenant: mockTenant,
    });
  });

  describe('GET /api/tenant/plan-status', () => {
    describe('Authentication', () => {
      it('should return 500 when authentication fails', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        mockRequireAuth.mockRejectedValue(new Error('No authenticated user'));

        const response = await GET();

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe('Failed to fetch plan status');

        consoleSpy.mockRestore();
      });

      it('should succeed with authenticated user', async () => {
        // Setup mocks for getPlanStatus
        prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
        prismaMock.pet.count.mockResolvedValue(50);
        prismaMock.user.count.mockResolvedValue(5);
        prismaMock.automationLog.count.mockResolvedValue(100);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue({
          tenantId: 'tenant-1',
          storageUsedBytes: BigInt(1024 * 1024 * 100), // 100MB
        } as any);

        const response = await GET();

        expect(response.status).toBe(200);
      });
    });

    describe('Plan Information', () => {
      it('should return plan name and key', async () => {
        prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
        prismaMock.pet.count.mockResolvedValue(50);
        prismaMock.user.count.mockResolvedValue(5);
        prismaMock.automationLog.count.mockResolvedValue(100);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plan).toBeDefined();
        expect(data.plan.name).toBe('Profesional');
        expect(data.plan.key).toBe('PROFESIONAL');
      });

      it('should return trial status', async () => {
        const trialTenant = createTestTrialTenant();
        mockRequireAuth.mockResolvedValue({
          user: mockUser,
          tenant: trialTenant,
        });

        prismaMock.tenant.findUnique.mockResolvedValue(trialTenant as any);
        prismaMock.pet.count.mockResolvedValue(10);
        prismaMock.user.count.mockResolvedValue(1);
        prismaMock.automationLog.count.mockResolvedValue(0);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plan.isTrialPeriod).toBe(true);
        expect(data.plan.trialEndsAt).toBeDefined();
      });

      it('should return default plan for trial without subscription', async () => {
        const trialTenant = createTestTrialTenant();
        mockRequireAuth.mockResolvedValue({
          user: mockUser,
          tenant: trialTenant,
        });

        prismaMock.tenant.findUnique.mockResolvedValue(trialTenant as any);
        prismaMock.pet.count.mockResolvedValue(10);
        prismaMock.user.count.mockResolvedValue(1);
        prismaMock.automationLog.count.mockResolvedValue(0);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plan.name).toBe('Plan Básico');
        expect(data.plan.key).toBe('STARTER');
      });
    });

    describe('Limits', () => {
      it('should return plan limits', async () => {
        prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
        prismaMock.pet.count.mockResolvedValue(50);
        prismaMock.user.count.mockResolvedValue(5);
        prismaMock.automationLog.count.mockResolvedValue(100);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.limits).toBeDefined();
        expect(data.limits.maxPets).toBe(1000);
        expect(data.limits.maxUsers).toBe(10);
        expect(data.limits.maxStorageGB).toBe(10);
      });

      it('should return feature flags', async () => {
        prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
        prismaMock.pet.count.mockResolvedValue(50);
        prismaMock.user.count.mockResolvedValue(5);
        prismaMock.automationLog.count.mockResolvedValue(100);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.limits.canUseAdvancedReports).toBe(true);
        expect(data.limits.canUseAdvancedInventory).toBe(true);
        expect(data.limits.canUseMultiLocation).toBe(true);
        expect(data.limits.canUseMultiDoctor).toBe(true);
        expect(data.limits.canUseSMSReminders).toBe(true);
        expect(data.limits.canUseAutomations).toBe(false);
      });

      it('should return zero limits for expired trial', async () => {
        const expiredTrialTenant = createTestTrialTenant({
          trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        });

        mockRequireAuth.mockResolvedValue({
          user: mockUser,
          tenant: expiredTrialTenant,
        });

        prismaMock.tenant.findUnique.mockResolvedValue(expiredTrialTenant as any);
        prismaMock.pet.count.mockResolvedValue(10);
        prismaMock.user.count.mockResolvedValue(1);
        prismaMock.automationLog.count.mockResolvedValue(0);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.limits.maxPets).toBe(0);
        expect(data.limits.maxUsers).toBe(0);
        expect(data.limits.canUseAutomations).toBe(false);
      });
    });

    describe('Usage Statistics', () => {
      it('should return current usage', async () => {
        prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
        prismaMock.pet.count.mockResolvedValue(250);
        prismaMock.user.count.mockResolvedValue(7);
        prismaMock.automationLog.count.mockResolvedValue(500);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue({
          tenantId: 'tenant-1',
          storageUsedBytes: BigInt(5 * 1024 * 1024 * 1024), // 5GB
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.usage).toBeDefined();
        expect(data.usage.currentPets).toBe(250);
        expect(data.usage.currentUsers).toBe(7);
        expect(data.usage.currentMonthlyWhatsApp).toBe(500);
        expect(data.usage.currentStorageBytes).toBe(5 * 1024 * 1024 * 1024);
      });

      it('should handle null usage stats', async () => {
        prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
        prismaMock.pet.count.mockResolvedValue(0);
        prismaMock.user.count.mockResolvedValue(1);
        prismaMock.automationLog.count.mockResolvedValue(0);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.usage.currentStorageBytes).toBe(0);
      });
    });

    describe('Percentages', () => {
      it('should calculate usage percentages', async () => {
        prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
        prismaMock.pet.count.mockResolvedValue(500); // 50% of 1000
        prismaMock.user.count.mockResolvedValue(5); // 50% of 10
        prismaMock.automationLog.count.mockResolvedValue(0);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue({
          tenantId: 'tenant-1',
          storageUsedBytes: BigInt(5 * 1024 * 1024 * 1024), // 5GB = 50% of 10GB
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.percentages).toBeDefined();
        expect(data.percentages.pets).toBe(50);
        expect(data.percentages.users).toBe(50);
        expect(data.percentages.storage).toBe(50);
      });

      it('should handle 0% usage', async () => {
        prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
        prismaMock.pet.count.mockResolvedValue(0);
        prismaMock.user.count.mockResolvedValue(0);
        prismaMock.automationLog.count.mockResolvedValue(0);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.percentages.pets).toBe(0);
        expect(data.percentages.users).toBe(0);
        expect(data.percentages.storage).toBe(0);
      });

      it('should handle 100% usage', async () => {
        prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
        prismaMock.pet.count.mockResolvedValue(1000);
        prismaMock.user.count.mockResolvedValue(10);
        prismaMock.automationLog.count.mockResolvedValue(0);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue({
          tenantId: 'tenant-1',
          storageUsedBytes: BigInt(10 * 1024 * 1024 * 1024),
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.percentages.pets).toBe(100);
        expect(data.percentages.users).toBe(100);
        expect(data.percentages.storage).toBe(100);
      });
    });

    describe('Warnings', () => {
      it('should return warnings when usage exceeds 80%', async () => {
        prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
        prismaMock.pet.count.mockResolvedValue(850); // 85% of 1000
        prismaMock.user.count.mockResolvedValue(9); // 90% of 10
        prismaMock.automationLog.count.mockResolvedValue(0);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue({
          tenantId: 'tenant-1',
          storageUsedBytes: BigInt(9 * 1024 * 1024 * 1024), // 90% of 10GB
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.warnings).toBeDefined();
        expect(data.warnings.pets).toBe(true);
        expect(data.warnings.users).toBe(true);
        expect(data.warnings.storage).toBe(true);
      });

      it('should return no warnings when usage is below 80%', async () => {
        prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
        prismaMock.pet.count.mockResolvedValue(500); // 50% of 1000
        prismaMock.user.count.mockResolvedValue(5); // 50% of 10
        prismaMock.automationLog.count.mockResolvedValue(0);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue({
          tenantId: 'tenant-1',
          storageUsedBytes: BigInt(5 * 1024 * 1024 * 1024), // 50% of 10GB
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.warnings.pets).toBe(false);
        expect(data.warnings.users).toBe(false);
        expect(data.warnings.storage).toBe(false);
      });

      it('should return warning at exactly 80%', async () => {
        prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
        prismaMock.pet.count.mockResolvedValue(800); // 80% of 1000
        prismaMock.user.count.mockResolvedValue(8); // 80% of 10
        prismaMock.automationLog.count.mockResolvedValue(0);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue({
          tenantId: 'tenant-1',
          storageUsedBytes: BigInt(8 * 1024 * 1024 * 1024), // 80% of 10GB
        } as any);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.warnings.pets).toBe(true);
        expect(data.warnings.users).toBe(true);
        expect(data.warnings.storage).toBe(true);
      });
    });

    describe('Response Structure', () => {
      it('should return complete response structure', async () => {
        prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
        prismaMock.pet.count.mockResolvedValue(50);
        prismaMock.user.count.mockResolvedValue(5);
        prismaMock.automationLog.count.mockResolvedValue(100);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);

        // Plan structure
        expect(data).toHaveProperty('plan');
        expect(data.plan).toHaveProperty('name');
        expect(data.plan).toHaveProperty('key');
        expect(data.plan).toHaveProperty('isTrialPeriod');
        expect(data.plan).toHaveProperty('trialEndsAt');

        // Limits structure
        expect(data).toHaveProperty('limits');
        expect(data.limits).toHaveProperty('maxPets');
        expect(data.limits).toHaveProperty('maxUsers');
        expect(data.limits).toHaveProperty('maxMonthlyWhatsApp');
        expect(data.limits).toHaveProperty('maxStorageGB');
        expect(data.limits).toHaveProperty('canUseAutomations');
        expect(data.limits).toHaveProperty('canUseAdvancedReports');

        // Usage structure
        expect(data).toHaveProperty('usage');
        expect(data.usage).toHaveProperty('currentPets');
        expect(data.usage).toHaveProperty('currentUsers');
        expect(data.usage).toHaveProperty('currentMonthlyWhatsApp');
        expect(data.usage).toHaveProperty('currentStorageBytes');

        // Percentages structure
        expect(data).toHaveProperty('percentages');
        expect(data.percentages).toHaveProperty('pets');
        expect(data.percentages).toHaveProperty('users');
        expect(data.percentages).toHaveProperty('whatsapp');
        expect(data.percentages).toHaveProperty('storage');

        // Warnings structure
        expect(data).toHaveProperty('warnings');
        expect(data.warnings).toHaveProperty('pets');
        expect(data.warnings).toHaveProperty('users');
        expect(data.warnings).toHaveProperty('whatsapp');
        expect(data.warnings).toHaveProperty('storage');
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        prismaMock.tenant.findUnique.mockRejectedValue(new Error('Database error'));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch plan status');

        consoleSpy.mockRestore();
      });

      it('should handle tenant not found', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        prismaMock.tenant.findUnique.mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch plan status');

        consoleSpy.mockRestore();
      });
    });

    describe('Different Plan Types', () => {
      it('should handle CLINICA plan', async () => {
        const clinicaTenant = createTestTenant({
          planName: 'CLINICA',
          tenantSubscription: {
            plan: {
              id: 'plan-2',
              key: 'CLINICA',
              name: 'Clínica',
              maxPets: 5000,
              maxUsers: 25,
              storageGB: 25,
              maxCashRegisters: -1,
              features: {
                whatsappMessages: -1,
                automations: true,
                advancedReports: true,
                advancedInventory: true,
                multiLocation: true,
                multiDoctor: true,
                smsReminders: true,
                apiAccess: true,
              },
            },
          },
        });

        mockRequireAuth.mockResolvedValue({
          user: mockUser,
          tenant: clinicaTenant,
        });

        prismaMock.tenant.findUnique.mockResolvedValue(clinicaTenant as any);
        prismaMock.pet.count.mockResolvedValue(1000);
        prismaMock.user.count.mockResolvedValue(10);
        prismaMock.automationLog.count.mockResolvedValue(200);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plan.key).toBe('CLINICA');
        expect(data.limits.maxPets).toBe(5000);
        expect(data.limits.maxUsers).toBe(25);
        expect(data.limits.canUseAutomations).toBe(true);
        expect(data.limits.canUseApiAccess).toBe(true);
      });

      it('should handle EMPRESA plan with unlimited pets', async () => {
        const empresaTenant = createTestTenant({
          planName: 'EMPRESA',
          tenantSubscription: {
            plan: {
              id: 'plan-3',
              key: 'EMPRESA',
              name: 'Empresa',
              maxPets: -1, // Unlimited
              maxUsers: 100,
              storageGB: 100,
              maxCashRegisters: -1,
              features: {
                whatsappMessages: -1,
                automations: true,
                advancedReports: true,
                advancedInventory: true,
                multiLocation: true,
                multiDoctor: true,
                smsReminders: true,
                apiAccess: true,
              },
            },
          },
        });

        mockRequireAuth.mockResolvedValue({
          user: mockUser,
          tenant: empresaTenant,
        });

        prismaMock.tenant.findUnique.mockResolvedValue(empresaTenant as any);
        prismaMock.pet.count.mockResolvedValue(10000);
        prismaMock.user.count.mockResolvedValue(50);
        prismaMock.automationLog.count.mockResolvedValue(1000);
        prismaMock.tenantUsageStats.findUnique.mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plan.key).toBe('EMPRESA');
        expect(data.limits.maxPets).toBe(Number.MAX_SAFE_INTEGER);
        expect(data.limits.maxUsers).toBe(100);
      });
    });
  });
});
