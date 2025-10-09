#!/usr/bin/env node

/**
 * Fix trial subscription status for existing tenants
 *
 * This script fixes tenants that are in trial period but have INACTIVE status
 * instead of TRIALING status, which prevents them from accessing the system.
 *
 * Usage: node scripts/fix-trial-subscriptions.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTrialSubscriptions() {
  console.log('🔍 Checking for affected trial subscriptions...\n');

  try {
    // First, check how many tenants are affected
    const affectedTenants = await prisma.tenant.findMany({
      where: {
        isTrialPeriod: true,
        subscriptionStatus: 'INACTIVE',
        trialEndsAt: {
          gte: new Date() // Only active trials (not expired)
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        trialEndsAt: true,
        createdAt: true,
        tenantSubscription: {
          select: {
            status: true,
            currentPeriodEnd: true
          }
        }
      }
    });

    if (affectedTenants.length === 0) {
      console.log('✅ No affected tenants found. All trial subscriptions are correct!');
      return;
    }

    console.log(`📋 Found ${affectedTenants.length} affected tenant(s):\n`);

    affectedTenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} (${tenant.slug})`);
      console.log(`   - Tenant ID: ${tenant.id}`);
      console.log(`   - Trial ends: ${tenant.trialEndsAt?.toLocaleDateString()}`);
      console.log(`   - Tenant.subscriptionStatus: INACTIVE ❌`);
      console.log(`   - TenantSubscription.status: ${tenant.tenantSubscription?.status || 'N/A'}`);
      console.log('');
    });

    console.log('🔧 Fixing subscription statuses...\n');

    // Fix the subscriptions
    const result = await prisma.tenant.updateMany({
      where: {
        isTrialPeriod: true,
        subscriptionStatus: 'INACTIVE',
        trialEndsAt: {
          gte: new Date()
        }
      },
      data: {
        subscriptionStatus: 'TRIALING'
      }
    });

    console.log(`✅ Successfully fixed ${result.count} trial subscription(s)!\n`);

    // Verify the fix
    console.log('🔍 Verifying fixes...\n');

    const verifiedTenants = await prisma.tenant.findMany({
      where: {
        id: {
          in: affectedTenants.map(t => t.id)
        }
      },
      select: {
        id: true,
        name: true,
        subscriptionStatus: true,
        isTrialPeriod: true
      }
    });

    verifiedTenants.forEach((tenant, index) => {
      const status = tenant.subscriptionStatus === 'TRIALING' ? '✅' : '❌';
      console.log(`${index + 1}. ${tenant.name}`);
      console.log(`   - Status: ${tenant.subscriptionStatus} ${status}`);
    });

    console.log('\n✨ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing trial subscriptions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixTrialSubscriptions()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
