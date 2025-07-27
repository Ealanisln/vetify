#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Mapping from Stripe product IDs to our plan keys
const STRIPE_PLAN_MAPPING = {
  'PROFESIONAL': {
    productId: 'prod_Seq8I3438TwbPQ',
    limits: { pets: 300, users: 3, whatsappMessages: -1 }
  },
  'CLINICA': {
    productId: 'prod_Seq84VFkBvXUhI',
    limits: { pets: 1000, users: 8, whatsappMessages: -1 }
  },
  'EMPRESA': {
    productId: 'prod_Seq8KU7nw8WucQ',
    limits: { pets: -1, users: 20, whatsappMessages: -1 }
  }
};

async function backfillTenantSubscriptions() {
  console.log('🔄 Starting TenantSubscription backfill process...');
  console.log('===============================================');

  try {
    // Find all tenants with Stripe subscription IDs but no TenantSubscription record
    const tenantsToBackfill = await prisma.tenant.findMany({
      where: {
        stripeSubscriptionId: { not: null },
        tenantSubscription: null
      },
      select: {
        id: true,
        name: true,
        stripeSubscriptionId: true,
        stripeProductId: true,
        planName: true,
        subscriptionStatus: true
      }
    });

    console.log(`Found ${tenantsToBackfill.length} tenants that need backfilling`);

    if (tenantsToBackfill.length === 0) {
      console.log('✅ No tenants need backfilling. All are up to date!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const tenant of tenantsToBackfill) {
      console.log(`\n📋 Processing tenant: ${tenant.name} (${tenant.id})`);
      
      try {
        // Get the subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
        
        // Map Stripe product ID to our plan key
        let planKey = null;
        for (const [key, mapping] of Object.entries(STRIPE_PLAN_MAPPING)) {
          if (mapping.productId === tenant.stripeProductId) {
            planKey = key;
            break;
          }
        }

        if (!planKey) {
          console.log(`   ⚠️  No plan mapping found for product: ${tenant.stripeProductId}`);
          errorCount++;
          continue;
        }

        // Get the Plan record from our database
        const dbPlan = await prisma.plan.findUnique({
          where: { key: planKey }
        });

        if (!dbPlan) {
          console.log(`   ⚠️  Plan not found in database: ${planKey}`);
          errorCount++;
          continue;
        }

        // Create the TenantSubscription record
        await prisma.tenantSubscription.create({
          data: {
            tenantId: tenant.id,
            planId: dbPlan.id,
            stripeSubscriptionId: tenant.stripeSubscriptionId,
            status: tenant.subscriptionStatus || 'ACTIVE',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          }
        });

        console.log(`   ✅ Created TenantSubscription for plan: ${planKey}`);
        successCount++;

      } catch (error) {
        console.log(`   ❌ Error processing tenant ${tenant.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n🎉 BACKFILL COMPLETED');
    console.log('====================');
    console.log(`✅ Successfully processed: ${successCount} tenants`);
    console.log(`❌ Errors: ${errorCount} tenants`);
    
    if (successCount > 0) {
      console.log('\n📊 Plan limits should now be properly displayed in the dashboard for all upgraded users!');
    }

  } catch (error) {
    console.error('❌ Fatal error during backfill:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillTenantSubscriptions()
  .then(() => {
    console.log('\n✅ Backfill script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Backfill script failed:', error);
    process.exit(1);
  }); 