/**
 * Seed test data for CI E2E testing
 *
 * Creates a test tenant whose owner is the E2E user (shaped like
 * createTenantWithDefaults in src/lib/tenant.ts: User, admin role, Staff
 * "Administrador", settings and default week), plus a customer, pet and
 * appointment so that authenticated E2E tests have data to work with.
 *
 * Also seeds the other E2E users (ids match tests/e2e/support/constants.ts):
 * - a veterinarian on the same clinic, without the admin role, for the
 *   role-access specs;
 * - a second clinic on the CORPORATIVO plan (active subscription, one
 *   location) with its own owner, for the API key and webhook specs.
 *
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

const VET_KINDE_ID = 'kp_e2e_test_vet_ci';
const VET_EMAIL = 'e2e-vet@vetify-ci.com';

const CORPORATIVO_TENANT_ID = 'ci-test-tenant-corporativo';
const CORPORATIVO_KINDE_ID = 'kp_e2e_corporativo_owner_ci';
const CORPORATIVO_EMAIL = 'e2e-corporativo@vetify-ci.com';

/**
 * The owner of a clinic: the tenant's first User, with the admin role and an
 * "Administrador" Staff record, as createTenantWithDefaults leaves them.
 */
async function upsertClinicOwner(
  tenantId: string,
  owner: { id: string; email: string; firstName: string; lastName: string }
) {
  const name = `${owner.firstName} ${owner.lastName}`;
  await prisma.user.upsert({
    where: { id: owner.id },
    create: { ...owner, tenantId, name },
    update: { tenantId, isActive: true },
  });

  let adminRole = await prisma.role.findFirst({ where: { tenantId, key: 'admin' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { tenantId, key: 'admin', name: 'Administrador', isSystem: true },
    });
  }
  const existingUserRole = await prisma.userRole.findFirst({
    where: { userId: owner.id, roleId: adminRole.id },
  });
  if (!existingUserRole) {
    await prisma.userRole.create({ data: { userId: owner.id, roleId: adminRole.id } });
  }

  await prisma.staff.upsert({
    where: { userId: owner.id },
    create: { tenantId, userId: owner.id, name, email: owner.email, position: 'Administrador' },
    update: { tenantId, position: 'Administrador', isActive: true },
  });
}

/** Tenant settings plus the default week, as onboarding creates them. */
async function upsertSettingsAndHours(tenantId: string) {
  const tenantSettings = await prisma.tenantSettings.upsert({
    where: { tenantId },
    create: {
      tenantId,
      timezone: 'America/Mexico_City',
      currencyCode: 'MXN',
      currencySymbol: '$',
      currencyConfirmed: true,
      appointmentDuration: 30,
    },
    update: {},
  });
  const existingHours = await prisma.businessHours.count({ where: { tenantId } });
  if (existingHours === 0) {
    await prisma.businessHours.createMany({
      data: buildDefaultWeek().map((day) => ({
        ...day,
        tenantId,
        tenantSettingsId: tenantSettings.id,
      })),
    });
  }
}

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
  await upsertSettingsAndHours(TEST_TENANT_ID);
  console.log('  ✓ Upserted settings and business hours');

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

  // 3. The E2E user owns the clinic. The id is the Kinde `sub` the fake
  // issuer puts in the test session (tests/e2e/support/constants.ts).
  await upsertClinicOwner(TEST_TENANT_ID, {
    id: TEST_KINDE_ID,
    email: TEST_EMAIL,
    firstName: 'E2E',
    lastName: 'Owner',
  });
  console.log('  ✓ Upserted clinic owner (user, admin role, staff)');

  // 3a. A veterinarian on the same clinic: no role and not the first user, so
  // requirePermission('settings') denies them (src/lib/staff-permissions.ts).
  // Created after the owner, so isTenantOwner still picks the owner.
  await prisma.user.upsert({
    where: { id: VET_KINDE_ID },
    create: {
      id: VET_KINDE_ID,
      tenantId: TEST_TENANT_ID,
      email: VET_EMAIL,
      firstName: 'E2E',
      lastName: 'Vet',
      name: 'E2E Vet',
    },
    update: { tenantId: TEST_TENANT_ID, isActive: true },
  });
  await prisma.staff.upsert({
    where: { userId: VET_KINDE_ID },
    create: {
      tenantId: TEST_TENANT_ID,
      userId: VET_KINDE_ID,
      name: 'E2E Vet',
      email: VET_EMAIL,
      position: 'VETERINARIAN',
    },
    update: { tenantId: TEST_TENANT_ID, position: 'VETERINARIAN', isActive: true },
  });
  console.log('  ✓ Upserted veterinarian (user, staff, no admin role)');

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

  // 7. A second clinic on the CORPORATIVO plan, with an active subscription
  await seedCorporativoClinic();

  console.log('✅ CI test data seeded successfully');
}

async function seedCorporativoClinic() {
  const plan = await prisma.plan.findFirst({ where: { key: 'CORPORATIVO' } });
  if (!plan) {
    console.error('❌ CORPORATIVO plan not found. Run seed-ci-plans.ts first.');
    process.exit(1);
  }

  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const activePlan = {
    planType: 'CORPORATIVO' as const,
    isTrialPeriod: false,
    subscriptionStatus: 'ACTIVE' as const,
  };
  await prisma.tenant.upsert({
    where: { id: CORPORATIVO_TENANT_ID },
    create: {
      id: CORPORATIVO_TENANT_ID,
      name: 'CI Corporativo Clinic',
      slug: 'ci-corporativo-clinic',
      countryCode: 'MX',
      ...activePlan,
    },
    update: activePlan,
  });
  await upsertSettingsAndHours(CORPORATIVO_TENANT_ID);

  await prisma.tenantSubscription.upsert({
    where: { tenantId: CORPORATIVO_TENANT_ID },
    create: {
      tenantId: CORPORATIVO_TENANT_ID,
      planId: plan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
    },
    update: { planId: plan.id, status: 'ACTIVE', currentPeriodEnd: periodEnd },
  });

  await upsertClinicOwner(CORPORATIVO_TENANT_ID, {
    id: CORPORATIVO_KINDE_ID,
    email: CORPORATIVO_EMAIL,
    firstName: 'E2E',
    lastName: 'Corporativo',
  });

  // One location, so the API key modal offers a location
  const existingLocation = await prisma.location.findFirst({
    where: { tenantId: CORPORATIVO_TENANT_ID, slug: 'sucursal-centro' },
  });
  if (!existingLocation) {
    await prisma.location.create({
      data: {
        tenantId: CORPORATIVO_TENANT_ID,
        name: 'Sucursal Centro',
        slug: 'sucursal-centro',
        isPrimary: true,
      },
    });
  }
  console.log('  ✓ Upserted CORPORATIVO clinic (tenant, subscription, owner, location)');
}

main()
  .catch((e) => {
    console.error('Error seeding test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
