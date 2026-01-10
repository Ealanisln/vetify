/**
 * Critical Production Test: Trial Activation Flow
 *
 * This test verifies the core subscription logic that was previously broken.
 * It ensures that when a new tenant is created, the trial subscription
 * is properly activated with the correct status.
 */

// Unmock Prisma for integration tests
jest.unmock('@prisma/client');

import { PrismaClient } from '@prisma/client';
import { createTenantWithDefaults } from '@/lib/tenant';

const prisma = new PrismaClient();

describe('Trial Activation Flow (CRITICAL)', () => {
  // Track all created resources for cleanup
  const createdUserIds: string[] = [];
  const createdTenantIds: string[] = [];

  // Helper to create a unique test user for each test
  async function createTestUser() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const testUser = await prisma.user.create({
      data: {
        id: `test-user-${timestamp}-${random}`,
        email: `test-${timestamp}-${random}@example.com`,
        name: 'Test User',
      },
    });
    createdUserIds.push(testUser.id);
    return testUser;
  }

  // Helper to track tenant for cleanup
  function trackTenant(tenantId: string) {
    if (!createdTenantIds.includes(tenantId)) {
      createdTenantIds.push(tenantId);
    }
  }

  afterAll(async () => {
    // Cleanup in proper order to handle foreign key constraints
    for (const tenantId of createdTenantIds) {
      try {
        // Delete related records first
        await prisma.staff.deleteMany({ where: { tenantId } });
        await prisma.userRole.deleteMany({
          where: {
            role: { tenantId }
          }
        });
        await prisma.role.deleteMany({ where: { tenantId } });
        await prisma.tenantUsageStats.deleteMany({ where: { tenantId } });
        await prisma.tenantSettings.deleteMany({ where: { tenantId } });
        await prisma.tenantSubscription.deleteMany({ where: { tenantId } });

        // Now safe to delete tenant
        await prisma.tenant.delete({
          where: { id: tenantId },
        });
      } catch (error) {
        console.warn(`Failed to cleanup tenant ${tenantId}:`, error);
      }
    }

    // Delete users after all tenants are cleaned up
    for (const userId of createdUserIds) {
      try {
        // Clear tenantId from user first (it may be set to a deleted tenant)
        await prisma.user.update({
          where: { id: userId },
          data: { tenantId: null },
        });

        await prisma.user.delete({
          where: { id: userId },
        });
      } catch (error) {
        console.warn(`Failed to cleanup user ${userId}:`, error);
      }
    }

    await prisma.$disconnect();
  });

  it('should create tenant with TRIALING subscription status', async () => {
    const testUser = await createTestUser();

    const result = await createTenantWithDefaults({
      name: 'Test Clinic',
      slug: `test-clinic-${Date.now()}`,
      userId: testUser.id,
      planKey: 'PROFESIONAL',
      billingInterval: 'monthly',
    });

    trackTenant(result.tenant.id);

    // CRITICAL: Verify tenant has TRIALING status
    expect(result.tenant.subscriptionStatus).toBe('TRIALING');
    expect(result.tenant.isTrialPeriod).toBe(true);
    expect(result.tenant.trialEndsAt).toBeDefined();

    // Verify trial period is approximately 30 days
    const trialDays = Math.round(
      (result.tenant.trialEndsAt!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(trialDays).toBeGreaterThanOrEqual(29);
    expect(trialDays).toBeLessThanOrEqual(31);
  });

  it('should create TenantSubscription with TRIALING status', async () => {
    const testUser = await createTestUser();

    const result = await createTenantWithDefaults({
      name: 'Test Clinic 2',
      slug: `test-clinic-2-${Date.now()}`,
      userId: testUser.id,
      planKey: 'PROFESIONAL',
      billingInterval: 'monthly',
    });

    trackTenant(result.tenant.id);

    const tenantSubscription = await prisma.tenantSubscription.findUnique({
      where: { tenantId: result.tenant.id },
      include: { plan: true },
    });

    // CRITICAL: Verify TenantSubscription exists and has correct status
    expect(tenantSubscription).toBeDefined();
    expect(tenantSubscription?.status).toBe('TRIALING');
    expect(tenantSubscription?.plan).toBeDefined();
    expect(tenantSubscription?.plan.key).toBe('PROFESIONAL');
  });

  it('should have matching status between Tenant and TenantSubscription', async () => {
    const testUser = await createTestUser();

    const result = await createTenantWithDefaults({
      name: 'Test Clinic 3',
      slug: `test-clinic-3-${Date.now()}`,
      userId: testUser.id,
      planKey: 'BASICO',
      billingInterval: 'yearly',
    });

    trackTenant(result.tenant.id);

    const tenant = await prisma.tenant.findUnique({
      where: { id: result.tenant.id },
      include: {
        tenantSubscription: true,
      },
    });

    // CRITICAL: Both statuses should match
    expect(tenant?.subscriptionStatus).toBe('TRIALING');
    expect(tenant?.tenantSubscription?.status).toBe('TRIALING');

    // Verify trial ends dates match (allow small timing difference < 1 second)
    const trialEndTime = tenant?.trialEndsAt?.getTime() || 0;
    const periodEndTime = tenant?.tenantSubscription?.currentPeriodEnd.getTime() || 0;
    const timeDiff = Math.abs(trialEndTime - periodEndTime);
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });

  it('should create all required related records', async () => {
    const testUser = await createTestUser();

    const result = await createTenantWithDefaults({
      name: 'Test Clinic 4',
      slug: `test-clinic-4-${Date.now()}`,
      userId: testUser.id,
      planKey: 'CORPORATIVO',
      billingInterval: 'monthly',
    });

    trackTenant(result.tenant.id);

    // Verify TenantSettings created
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: result.tenant.id },
    });
    expect(settings).toBeDefined();

    // Verify TenantUsageStats created
    const stats = await prisma.tenantUsageStats.findUnique({
      where: { tenantId: result.tenant.id },
    });
    expect(stats).toBeDefined();
    expect(stats?.totalUsers).toBe(1);

    // Verify default roles created
    const roles = await prisma.role.findMany({
      where: { tenantId: result.tenant.id },
    });
    expect(roles.length).toBeGreaterThanOrEqual(3); // admin, veterinarian, assistant

    // Verify user has admin role
    const userRoles = await prisma.userRole.findMany({
      where: { userId: testUser.id },
      include: { role: true },
    });
    const hasAdminRole = userRoles.some((ur) => ur.role.key === 'admin');
    expect(hasAdminRole).toBe(true);
  });

  it('should update user with tenantId', async () => {
    const testUser = await createTestUser();

    const result = await createTenantWithDefaults({
      name: 'Test Clinic 5',
      slug: `test-clinic-5-${Date.now()}`,
      userId: testUser.id,
      planKey: 'PROFESIONAL',
      billingInterval: 'monthly',
    });

    trackTenant(result.tenant.id);

    const updatedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });

    expect(updatedUser?.tenantId).toBe(result.tenant.id);
  });
});
