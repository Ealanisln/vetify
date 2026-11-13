/**
 * Seed subscription plans for CI testing
 * This creates the minimal Plan records needed for integration tests
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
  {
    key: 'BASICO',
    name: 'Plan Básico',
    description: 'Plan ideal para clínicas pequeñas',
    monthlyPrice: new Prisma.Decimal(499),
    annualPrice: new Prisma.Decimal(4790),
    features: {
      users: 2,
      pets: 100,
      storage: 5,
      support: 'email',
    },
    maxUsers: 2,
    maxPets: 100,
    storageGB: 5,
    maxCashRegisters: 1,
    isRecommended: false,
    isActive: true,
    isMvp: true,
  },
  {
    key: 'PROFESIONAL',
    name: 'Plan Profesional',
    description: 'Plan ideal para clínicas medianas',
    monthlyPrice: new Prisma.Decimal(999),
    annualPrice: new Prisma.Decimal(9590),
    features: {
      users: 5,
      pets: 500,
      storage: 20,
      support: 'priority',
    },
    maxUsers: 5,
    maxPets: 500,
    storageGB: 20,
    maxCashRegisters: -1,
    isRecommended: true,
    isActive: true,
    isMvp: true,
  },
  {
    key: 'CORPORATIVO',
    name: 'Plan Corporativo',
    description: 'Plan para grandes clínicas y hospitales',
    monthlyPrice: new Prisma.Decimal(1999),
    annualPrice: new Prisma.Decimal(19190),
    features: {
      users: -1,
      pets: -1,
      storage: 100,
      support: 'dedicated',
      // As in src/lib/pricing-config.ts; the API key and webhook E2E specs need apiAccess
      multiLocation: true,
      apiAccess: true,
    },
    maxUsers: -1,
    maxPets: -1,
    storageGB: 100,
    maxCashRegisters: -1,
    isRecommended: false,
    isActive: true,
    isMvp: true,
  },
];

async function main() {
  console.log('🌱 Seeding subscription plans for CI...');

  for (const planData of plans) {
    const existingPlan = await prisma.plan.findUnique({
      where: { key: planData.key },
    });

    if (existingPlan) {
      console.log(`  ✓ Plan ${planData.key} already exists`);
    } else {
      await prisma.plan.create({ data: planData });
      console.log(`  ✓ Created plan ${planData.key}`);
    }
  }

  console.log('✅ CI plans seeded successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
