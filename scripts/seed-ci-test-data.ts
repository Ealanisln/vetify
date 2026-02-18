/**
 * Seed test data for CI E2E testing
 *
 * Creates a test tenant, user, customer, pet, and appointment
 * so that authenticated E2E tests have data to work with.
 *
 * Run after seed-ci-plans.ts:
 *   npx tsx scripts/seed-ci-test-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_TENANT_ID = 'ci-test-tenant-001';
const TEST_KINDE_ID = 'kp_e2e_test_user_ci';
const TEST_EMAIL = 'e2e-test@vetify-ci.com';

async function main() {
  console.log('🌱 Seeding E2E test data for CI...');

  // 1. Find or create test plan
  const plan = await prisma.plan.findFirst({
    where: { key: 'PROFESIONAL' },
  });

  if (!plan) {
    console.error('❌ PROFESIONAL plan not found. Run seed-ci-plans.ts first.');
    process.exit(1);
  }

  // 2. Create test tenant
  const existingTenant = await prisma.tenant.findUnique({
    where: { id: TEST_TENANT_ID },
  });

  if (!existingTenant) {
    await prisma.tenant.create({
      data: {
        id: TEST_TENANT_ID,
        name: 'CI Test Clinic',
        slug: 'ci-test-clinic',
        planId: plan.id,
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });
    console.log('  ✓ Created test tenant');
  } else {
    console.log('  ✓ Test tenant already exists');
  }

  // 3. Create test staff/user
  const existingStaff = await prisma.staff.findFirst({
    where: { tenantId: TEST_TENANT_ID, userId: TEST_KINDE_ID },
  });

  if (!existingStaff) {
    await prisma.staff.create({
      data: {
        tenantId: TEST_TENANT_ID,
        userId: TEST_KINDE_ID,
        name: 'E2E Test User',
        email: TEST_EMAIL,
        role: 'ADMIN',
      },
    });
    console.log('  ✓ Created test staff member');
  } else {
    console.log('  ✓ Test staff member already exists');
  }

  // 4. Create test customer
  const existingCustomer = await prisma.customer.findFirst({
    where: { tenantId: TEST_TENANT_ID, email: 'test-customer@vetify-ci.com' },
  });

  let customerId: string;
  if (!existingCustomer) {
    const customer = await prisma.customer.create({
      data: {
        tenantId: TEST_TENANT_ID,
        name: 'CI Test Customer',
        email: 'test-customer@vetify-ci.com',
        phone: '5551234567',
        address: '123 Test Street, CI City',
      },
    });
    customerId = customer.id;
    console.log('  ✓ Created test customer');
  } else {
    customerId = existingCustomer.id;
    console.log('  ✓ Test customer already exists');
  }

  // 5. Create test pet
  const existingPet = await prisma.pet.findFirst({
    where: { tenantId: TEST_TENANT_ID, name: 'CI Test Pet' },
  });

  let petId: string;
  if (!existingPet) {
    const pet = await prisma.pet.create({
      data: {
        tenantId: TEST_TENANT_ID,
        name: 'CI Test Pet',
        species: 'DOG',
        breed: 'Labrador',
        ownerId: customerId,
        dateOfBirth: new Date('2022-01-01'),
      },
    });
    petId = pet.id;
    console.log('  ✓ Created test pet');
  } else {
    petId = existingPet.id;
    console.log('  ✓ Test pet already exists');
  }

  // 6. Create test appointment
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      tenantId: TEST_TENANT_ID,
      title: 'CI Test Appointment',
    },
  });

  if (!existingAppointment) {
    await prisma.appointment.create({
      data: {
        tenantId: TEST_TENANT_ID,
        title: 'CI Test Appointment',
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // +1 hour
        status: 'SCHEDULED',
        petId,
        customerId,
      },
    });
    console.log('  ✓ Created test appointment');
  } else {
    console.log('  ✓ Test appointment already exists');
  }

  console.log('✅ CI test data seeded successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
