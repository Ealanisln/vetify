import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST() {
  try {
    // Only allow authenticated users
    await requireAuth();

    console.log('🔧 Fixing customers and pets without location...\n');

    // Find all tenants with their primary location
    const tenantsWithLocations = await prisma.tenant.findMany({
      include: {
        locations: {
          where: { isPrimary: true },
          take: 1
        }
      }
    });

    const results: Array<{
      tenant: string;
      customersUpdated: number;
      petsUpdated: number;
      location: string
    }> = [];

    for (const tenant of tenantsWithLocations) {
      const primaryLocation = tenant.locations[0];

      if (!primaryLocation) {
        console.log(`⚠️  Tenant "${tenant.name}" has no primary location, skipping...`);
        continue;
      }

      // Update all customers without a locationId
      const customersResult = await prisma.customer.updateMany({
        where: {
          tenantId: tenant.id,
          locationId: null
        },
        data: {
          locationId: primaryLocation.id
        }
      });

      // Update all pets without a locationId
      const petsResult = await prisma.pet.updateMany({
        where: {
          tenantId: tenant.id,
          locationId: null
        },
        data: {
          locationId: primaryLocation.id
        }
      });

      if (customersResult.count > 0 || petsResult.count > 0) {
        results.push({
          tenant: tenant.name || tenant.id,
          customersUpdated: customersResult.count,
          petsUpdated: petsResult.count,
          location: primaryLocation.name
        });
        console.log(`✅ Tenant "${tenant.name}" - Updated ${customersResult.count} customers and ${petsResult.count} pets to location "${primaryLocation.name}"`);
      }
    }

    const totalCustomers = results.reduce((sum, r) => sum + r.customersUpdated, 0);
    const totalPets = results.reduce((sum, r) => sum + r.petsUpdated, 0);

    return NextResponse.json({
      success: true,
      message: `Fixed ${totalCustomers} customers and ${totalPets} pets without location`,
      results
    });
  } catch (error) {
    console.error('Error fixing data:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
