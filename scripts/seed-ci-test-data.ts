/**
 * Seed test data for CI E2E testing
 *
 * Creates a test tenant whose owner is the E2E user (shaped like
 * createTenantWithDefaults in src/lib/tenant.ts: User, admin role, Staff
 * "Administrador", settings and default week), plus a customer, pet and
 * appointment so that authenticated E2E tests have data to work with.
 * Idempotent: safe to run more than once against the same database.
 *
 * Run after seed-ci-plans.ts:
 *   npx tsx scripts/seed-ci-test-data.ts
 */
import { PrismaClient } from '@prisma/client';
import { buildDefaultWeek } from '../src/lib/business-hours';

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

  // 2. Create test tenant: in an active trial, with public booking on so the
  // clinic-setup spec can check the services offered at /ci-test-clinic/agendar
  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  await prisma.tenant.upsert({
    where: { id: TEST_TENANT_ID },
    create: {
      id: TEST_TENANT_ID,
      name: 'CI Test Clinic',
      slug: 'ci-test-clinic',
      planType: 'PROFESIONAL',
      countryCode: 'MX',
      isTrialPeriod: true,
      trialEndsAt,
      subscriptionStatus: 'TRIALING',
      publicPageEnabled: true,
      publicBookingEnabled: true,
    },
    update: {
      isTrialPeriod: true,
      trialEndsAt,
      subscriptionStatus: 'TRIALING',
      publicPageEnabled: true,
      publicBookingEnabled: true,
    },
  });
  console.log('  ✓ Upserted test tenant');

  // 2a. Settings and the default week, as onboarding creates them
  const tenantSettings = await prisma.tenantSettings.upsert({
    where: { tenantId: TEST_TENANT_ID },
    create: {
      tenantId: TEST_TENANT_ID,
      timezone: 'America/Mexico_City',
      currencyCode: 'MXN',
      currencySymbol: '$',
      currencyConfirmed: true,
      appointmentDuration: 30,
    },
    update: {},
  });
  const existingHours = await prisma.businessHours.count({ where: { tenantId: TEST_TENANT_ID } });
  if (existingHours === 0) {
    await prisma.businessHours.createMany({
      data: buildDefaultWeek().map((day) => ({
        ...day,
        tenantId: TEST_TENANT_ID,
        tenantSettingsId: tenantSettings.id,
      })),
    });
    console.log('  ✓ Created default business hours');
  }

  // 2b. Create tenant subscription linking to plan
  const existingSubscription = await prisma.tenantSubscription.findUnique({
    where: { tenantId: TEST_TENANT_ID },
  });

  if (!existingSubscription) {
    await prisma.tenantSubscription.create({
      data: {
        tenantId: TEST_TENANT_ID,
        planId: plan.id,
        status: 'TRIALING',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    console.log('  ✓ Created tenant subscription');
  } else {
    console.log('  ✓ Tenant subscription already exists');
  }

  // 3. The E2E user owns the clinic: the first User of the tenant, with the
  // admin role and an "Administrador" Staff record. The id is the Kinde `sub`
  // the fake issuer puts in the test session (tests/e2e/support/constants.ts).
  await prisma.user.upsert({
    where: { id: TEST_KINDE_ID },
    create: {
      id: TEST_KINDE_ID,
      tenantId: TEST_TENANT_ID,
      email: TEST_EMAIL,
      firstName: 'E2E',
      lastName: 'Owner',
      name: 'E2E Owner',
    },
    update: { tenantId: TEST_TENANT_ID, isActive: true },
  });

  let adminRole = await prisma.role.findFirst({ where: { tenantId: TEST_TENANT_ID, key: 'admin' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { tenantId: TEST_TENANT_ID, key: 'admin', name: 'Administrador', isSystem: true },
    });
  }
  const existingUserRole = await prisma.userRole.findFirst({
    where: { userId: TEST_KINDE_ID, roleId: adminRole.id },
  });
  if (!existingUserRole) {
    await prisma.userRole.create({ data: { userId: TEST_KINDE_ID, roleId: adminRole.id } });
  }

  await prisma.staff.upsert({
    where: { userId: TEST_KINDE_ID },
    create: {
      tenantId: TEST_TENANT_ID,
      userId: TEST_KINDE_ID,
      name: 'E2E Owner',
      email: TEST_EMAIL,
      position: 'Administrador',
    },
    update: { tenantId: TEST_TENANT_ID, position: 'Administrador', isActive: true },
  });
  console.log('  ✓ Upserted clinic owner (user, admin role, staff)');

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
        gender: 'MALE',
        customerId,
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
      reason: 'CI Test Appointment',
    },
  });

  if (!existingAppointment) {
    await prisma.appointment.create({
      data: {
        tenantId: TEST_TENANT_ID,
        dateTime: tomorrow,
        duration: 30,
        reason: 'CI Test Appointment',
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
