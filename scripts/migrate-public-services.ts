/**
 * Migration script to migrate existing publicServices JSON data to the Service table
 *
 * Run with: npx tsx scripts/migrate-public-services.ts
 */

import { PrismaClient, ServiceCategory } from '@prisma/client';

const prisma = new PrismaClient();

interface PublicServiceJSON {
  title: string;
  description: string;
  price?: string;
  icon?: string;
}

function parsePrice(priceStr?: string): number {
  if (!priceStr) return 0;
  // Remove non-numeric characters except decimal point
  const numStr = priceStr.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(numStr);
  return isNaN(parsed) ? 0 : parsed;
}

async function migratePublicServices() {
  console.log('Starting migration of publicServices to Service table...\n');

  // Get all tenants with publicServices
  const tenants = await prisma.tenant.findMany({
    where: {
      publicServices: {
        not: null
      }
    },
    select: {
      id: true,
      name: true,
      publicServices: true
    }
  });

  console.log(`Found ${tenants.length} tenants with publicServices\n`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const tenant of tenants) {
    const publicServices = tenant.publicServices as PublicServiceJSON[] | null;

    if (!publicServices || publicServices.length === 0) {
      console.log(`Tenant "${tenant.name}": No services to migrate`);
      continue;
    }

    console.log(`\nTenant "${tenant.name}": ${publicServices.length} services to migrate`);

    for (let i = 0; i < publicServices.length; i++) {
      const ps = publicServices[i];

      if (!ps.title || ps.title.trim() === '') {
        console.log(`  - Skipping empty service at index ${i}`);
        skippedCount++;
        continue;
      }

      // Check if a service with the same name already exists
      const existingService = await prisma.service.findFirst({
        where: {
          tenantId: tenant.id,
          name: {
            equals: ps.title,
            mode: 'insensitive'
          }
        }
      });

      if (existingService) {
        // Update existing service with public fields
        await prisma.service.update({
          where: { id: existingService.id },
          data: {
            isFeatured: true,
            publicDisplayOrder: i + 1,
            publicIcon: ps.icon || null,
            publicPriceLabel: ps.price || null
          }
        });
        console.log(`  - Updated existing service: "${ps.title}"`);
      } else {
        // Create new service from public service data
        await prisma.service.create({
          data: {
            tenantId: tenant.id,
            name: ps.title,
            description: ps.description || null,
            category: ServiceCategory.OTHER,
            price: parsePrice(ps.price),
            isActive: true,
            isFeatured: true,
            publicDisplayOrder: i + 1,
            publicIcon: ps.icon || null,
            publicPriceLabel: ps.price || null
          }
        });
        console.log(`  - Created new service: "${ps.title}"`);
      }
      migratedCount++;
    }
  }

  console.log('\n========================================');
  console.log(`Migration complete!`);
  console.log(`  - Migrated: ${migratedCount} services`);
  console.log(`  - Skipped: ${skippedCount} services`);
  console.log('========================================\n');
}

async function main() {
  try {
    await migratePublicServices();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
