/**
 * Global Teardown for Playwright E2E Tests
 *
 * Cleans up test data created during E2E test runs.
 * Runs after all tests complete to prevent data accumulation.
 *
 * Only cleans data when:
 * - TEST_AUTH_ENABLED=true (auth tests were running)
 * - DATABASE_URL is available
 * - Running in CI or explicitly enabled
 */

import type { FullConfig } from '@playwright/test';

const TEST_TENANT_ID = 'ci-test-tenant-001';

async function globalTeardown(_config: FullConfig) {
  // Only clean up if auth tests were enabled (meaning test data was created)
  if (process.env.TEST_AUTH_ENABLED !== 'true') {
    return;
  }

  // Only run teardown in CI or when explicitly requested
  if (!process.env.CI && process.env.E2E_TEARDOWN !== 'true') {
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('Global teardown: DATABASE_URL not set, skipping cleanup');
    return;
  }

  console.log('Global teardown: Cleaning up E2E test data...');

  try {
    // Dynamic import to avoid bundling Prisma in non-teardown runs
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });

    try {
      // Delete test data in dependency order (children first)
      const deletedAppointments = await prisma.appointment.deleteMany({
        where: { tenantId: TEST_TENANT_ID },
      });
      console.log(`  Deleted ${deletedAppointments.count} test appointments`);

      const deletedPets = await prisma.pet.deleteMany({
        where: { tenantId: TEST_TENANT_ID },
      });
      console.log(`  Deleted ${deletedPets.count} test pets`);

      const deletedCustomers = await prisma.customer.deleteMany({
        where: { tenantId: TEST_TENANT_ID },
      });
      console.log(`  Deleted ${deletedCustomers.count} test customers`);

      const deletedStaff = await prisma.staff.deleteMany({
        where: { tenantId: TEST_TENANT_ID },
      });
      console.log(`  Deleted ${deletedStaff.count} test staff members`);

      // Only delete the test tenant if it exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: TEST_TENANT_ID },
      });

      if (tenant) {
        await prisma.tenant.delete({
          where: { id: TEST_TENANT_ID },
        });
        console.log('  Deleted test tenant');
      }

      console.log('Global teardown: Cleanup complete');
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    // Don't fail the test run if cleanup fails
    console.warn('Global teardown: Cleanup failed (non-fatal):', error);
  }
}

export default globalTeardown;
