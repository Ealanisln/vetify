/**
 * Critical Production Test: Trial Activation Flow
 *
 * This test verifies the core subscription logic that was previously broken.
 * It ensures that when a new tenant is created, the trial subscription
 * is properly activated with the correct status.
 */

import { PrismaClient } from '@prisma/client';
import { createTenantWithDefaults } from '@/lib/tenant';

const prisma = new PrismaClient();

describe('Trial Activation Flow (CRITICAL)', () => {
  let testUserId: string;
  let testTenantId: string;

  beforeAll(async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        id: `test-user-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
      },
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testTenantId) {
      await prisma.tenant.delete({
        where: { id: testTenantId },
      });
    }

    await prisma.user.delete({
      where: { id: testUserId },
    });

    await prisma.$disconnect();
  });

  it('should create tenant with TRIALING subscription status', async () => {
    const result = await createTenantWithDefaults({
      name: 'Test Clinic',
      slug: `test-clinic-${Date.now()}`,
      userId: testUserId,
      planKey: 'PROFESIONAL',
      billingInterval: 'monthly',
    });

    testTenantId = result.tenant.id;

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
    const result = await createTenantWithDefaults({
      name: 'Test Clinic 2',
      slug: `test-clinic-2-${Date.now()}`,
      userId: testUserId,
      planKey: 'PROFESIONAL',
      billingInterval: 'monthly',
    });

    testTenantId = result.tenant.id;

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
    const result = await createTenantWithDefaults({
      name: 'Test Clinic 3',
      slug: `test-clinic-3-${Date.now()}`,
      userId: testUserId,
      planKey: 'CLINICA',
      billingInterval: 'yearly',
    });

    testTenantId = result.tenant.id;

    const tenant = await prisma.tenant.findUnique({
      where: { id: result.tenant.id },
      include: {
        tenantSubscription: true,
      },
    });

    // CRITICAL: Both statuses should match
    expect(tenant?.subscriptionStatus).toBe('TRIALING');
    expect(tenant?.tenantSubscription?.status).toBe('TRIALING');

    // Verify trial ends dates match
    expect(tenant?.trialEndsAt?.getTime()).toBe(
      tenant?.tenantSubscription?.currentPeriodEnd.getTime()
    );
  });

  it('should create all required related records', async () => {
    const result = await createTenantWithDefaults({
      name: 'Test Clinic 4',
      slug: `test-clinic-4-${Date.now()}`,
      userId: testUserId,
      planKey: 'EMPRESA',
      billingInterval: 'monthly',
    });

    testTenantId = result.tenant.id;

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
      where: { userId: testUserId },
      include: { role: true },
    });
    const hasAdminRole = userRoles.some((ur) => ur.role.key === 'admin');
    expect(hasAdminRole).toBe(true);
  });

  it('should update user with tenantId', async () => {
    const result = await createTenantWithDefaults({
      name: 'Test Clinic 5',
      slug: `test-clinic-5-${Date.now()}`,
      userId: testUserId,
      planKey: 'PROFESIONAL',
      billingInterval: 'monthly',
    });

    testTenantId = result.tenant.id;

    const updatedUser = await prisma.user.findUnique({
      where: { id: testUserId },
    });

    expect(updatedUser?.tenantId).toBe(result.tenant.id);
  });
});
