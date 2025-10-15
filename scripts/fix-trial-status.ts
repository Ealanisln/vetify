/**
 * Fix trial status for tenants
 * This script updates tenants that are in trial period but have INACTIVE subscription status
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function fixTrialStatus() {
  try {
    console.log('🔍 Finding tenants with trial period but INACTIVE status...');

    // Find tenants that should be in trial but have wrong status
    const tenantsToFix = await prisma.tenant.findMany({
      where: {
        isTrialPeriod: true,
        subscriptionStatus: 'INACTIVE',
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        trialEndsAt: true,
      },
    });

    console.log(`\n📋 Found ${tenantsToFix.length} tenant(s) to fix:\n`);

    for (const tenant of tenantsToFix) {
      console.log(`  - ${tenant.name} (${tenant.id})`);
      console.log(`    Created: ${tenant.createdAt.toISOString()}`);
      console.log(`    Trial ends: ${tenant.trialEndsAt?.toISOString() || 'Not set'}`);
    }

    if (tenantsToFix.length === 0) {
      console.log('\n✅ No tenants to fix!');
      return;
    }

    console.log('\n🔧 Updating subscription status to TRIALING...\n');

    // Update each tenant
    const results = await Promise.all(
      tenantsToFix.map(async (tenant) => {
        // Calculate trial end date if not set (30 days from creation)
        const trialEndsAt = tenant.trialEndsAt ||
          new Date(tenant.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);

        const updated = await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            subscriptionStatus: 'TRIALING',
            trialEndsAt,
          },
        });

        console.log(`  ✅ Updated: ${updated.name}`);
        console.log(`     Status: INACTIVE → TRIALING`);
        console.log(`     Trial ends: ${updated.trialEndsAt?.toISOString()}\n`);

        return updated;
      })
    );

    console.log(`\n✅ Successfully updated ${results.length} tenant(s)!`);
    console.log('\n📊 Summary:');
    console.log(`   - Tenants fixed: ${results.length}`);
    console.log(`   - All trials are now active with TRIALING status`);

  } catch (error) {
    console.error('❌ Error fixing trial status:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixTrialStatus()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
