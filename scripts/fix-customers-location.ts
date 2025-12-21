import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCustomersWithoutLocation() {
  console.log('🔧 Fixing customers without location...\n');

  // Find all tenants with their primary location
  const tenantsWithLocations = await prisma.tenant.findMany({
    include: {
      locations: {
        where: { isPrimary: true },
        take: 1
      }
    }
  });

  let totalUpdated = 0;

  for (const tenant of tenantsWithLocations) {
    const primaryLocation = tenant.locations[0];

    if (!primaryLocation) {
      console.log(`⚠️  Tenant "${tenant.name}" has no primary location, skipping...`);
      continue;
    }

    // Count customers without locationId
    const countWithoutLocation = await prisma.customer.count({
      where: {
        tenantId: tenant.id,
        locationId: null
      }
    });

    if (countWithoutLocation === 0) {
      console.log(`✅ Tenant "${tenant.name}" - all customers have locations`);
      continue;
    }

    // Update all customers without a locationId
    const result = await prisma.customer.updateMany({
      where: {
        tenantId: tenant.id,
        locationId: null
      },
      data: {
        locationId: primaryLocation.id
      }
    });

    console.log(`✅ Tenant "${tenant.name}" - Updated ${result.count} customers to location "${primaryLocation.name}"`);
    totalUpdated += result.count;
  }

  console.log(`\n📊 Total customers updated: ${totalUpdated}`);
  await prisma.$disconnect();
}

fixCustomersWithoutLocation().catch(console.error);
