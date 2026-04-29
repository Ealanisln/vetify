#!/usr/bin/env node

/**
 * Reconcile Tenant Subscriptions from Stripe
 *
 * After the silent sync bug fix (commit ca58e1b), existing affected users may
 * still have stale DB data — subscriptionStatus: 'TRIALING', isTrialPeriod: true,
 * missing stripeSubscriptionId, etc. — even though they have an active paid
 * subscription in Stripe.
 *
 * This script finds and fixes these mismatches.
 *
 * Usage:
 *   node scripts/reconcile-subscriptions.mjs                              # Dry-run all tenants
 *   node scripts/reconcile-subscriptions.mjs --email user@example.com     # Dry-run single tenant
 *   node scripts/reconcile-subscriptions.mjs --email user@example.com --apply  # Apply fix
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

// Load environment variables matching Next.js priority: .env.local overrides .env
dotenv.config({ path: '.env.local', override: true });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

// --- Stripe key detection (mirrors src/lib/payments/stripe.ts + pricing-config.ts) ---
const stripeSecretKey = process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY || '';
if (!stripeSecretKey) {
  console.error('❌ No Stripe secret key configured (STRIPE_SECRET_KEY or STRIPE_SECRET_KEY_LIVE)');
  process.exit(1);
}

const isLiveMode = stripeSecretKey.startsWith('sk_live_');

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
});

// --- Product ID constants (copied from src/lib/payments/stripe.ts) ---
const TEST_PRODUCTS = {
  BASICO: 'prod_TGDXKD2ksDenYm',
  PROFESIONAL: 'prod_TGDXLJxNFGsF9X',
  CORPORATIVO: 'prod_TGDXxUkqhta3cp',
};

const PRODUCTION_PRODUCTS = {
  BASICO: process.env.STRIPE_PRODUCT_BASICO_LIVE || 'prod_TOO1tpvYblty9Y',
  PROFESIONAL: process.env.STRIPE_PRODUCT_PROFESIONAL_LIVE || 'prod_TOO1RsH4C7mQmr',
  CORPORATIVO: process.env.STRIPE_PRODUCT_CORPORATIVO_LIVE || 'prod_TOO1q6SDg9CGMP',
};

const PRODUCTS = isLiveMode ? PRODUCTION_PRODUCTS : TEST_PRODUCTS;

// Reverse map: productId → planKey
const PRODUCT_TO_PLAN = {};
for (const [key, productId] of Object.entries(PRODUCTS)) {
  PRODUCT_TO_PLAN[productId] = key;
}

// --- CLI flags ---
const applyMode = process.argv.includes('--apply');
const emailIdx = process.argv.indexOf('--email');
const filterEmail = emailIdx !== -1 ? process.argv[emailIdx + 1] : null;

// --- Main ---
async function reconcile() {
  console.log('🔍 Reconcile Tenant Subscriptions from Stripe');
  console.log('==============================================');
  console.log(`Mode: ${isLiveMode ? '🔴 LIVE' : '🟡 TEST'}`);
  console.log(`Action: ${applyMode ? '✏️  APPLY (will write changes)' : '👀 DRY-RUN (read-only)'}`);
  if (filterEmail) console.log(`Filter: ${filterEmail}`);
  console.log(`Products:`, PRODUCTS);
  console.log('');

  // 1. Build tenant filter
  const whereClause = { stripeCustomerId: { not: null } };

  if (filterEmail) {
    // Find the tenant via the staff member's email
    const staff = await prisma.staff.findUnique({
      where: { email: filterEmail },
      select: { tenantId: true },
    });
    if (!staff) {
      console.error(`❌ No staff member found with email: ${filterEmail}`);
      return;
    }
    whereClause.id = staff.tenantId;
  }

  const tenants = await prisma.tenant.findMany({
    where: whereClause,
    include: {
      tenantSubscription: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${tenants.length} tenant(s) with a Stripe customer ID.\n`);

  let matchCount = 0;
  let mismatchCount = 0;
  let fixedCount = 0;
  let errorCount = 0;
  let noSubCount = 0;

  for (const tenant of tenants) {
    const label = `${tenant.name} (${tenant.id})`;

    try {
      // 2. List subscriptions from Stripe for this customer
      const stripeSubs = await stripe.subscriptions.list({
        customer: tenant.stripeCustomerId,
        limit: 10,
      });

      // Find the most relevant subscription: prefer active > trialing > others
      const activeSub =
        stripeSubs.data.find((s) => s.status === 'active') ||
        stripeSubs.data.find((s) => s.status === 'trialing') ||
        stripeSubs.data[0]; // fallback to most recent

      if (!activeSub) {
        noSubCount++;
        continue; // No subscriptions in Stripe at all — nothing to reconcile
      }

      const stripeStatus = activeSub.status; // e.g. 'active', 'trialing', 'canceled'
      const stripePlan = activeSub.items.data[0]?.plan;
      const stripeProductId = stripePlan?.product;
      const stripePlanKey = PRODUCT_TO_PLAN[stripeProductId] || null;

      // 3. Detect mismatches
      const mismatches = [];

      // subscriptionStatus mismatch
      const expectedDbStatus = stripeStatus.toUpperCase();
      if (tenant.subscriptionStatus !== expectedDbStatus) {
        mismatches.push(
          `subscriptionStatus: DB="${tenant.subscriptionStatus}" → Stripe="${expectedDbStatus}"`
        );
      }

      // stripeSubscriptionId missing or wrong
      if (tenant.stripeSubscriptionId !== activeSub.id) {
        mismatches.push(
          `stripeSubscriptionId: DB="${tenant.stripeSubscriptionId || '(null)'}" → Stripe="${activeSub.id}"`
        );
      }

      // isTrialPeriod is true but Stripe says active (not trialing)
      if (tenant.isTrialPeriod && stripeStatus === 'active') {
        mismatches.push(
          `isTrialPeriod: DB=true → should be false (Stripe status is "active")`
        );
      }

      // stripeProductId mismatch
      if (stripeProductId && tenant.stripeProductId !== stripeProductId) {
        mismatches.push(
          `stripeProductId: DB="${tenant.stripeProductId || '(null)'}" → Stripe="${stripeProductId}"`
        );
      }

      // planType mismatch
      if (stripePlanKey && tenant.planType !== stripePlanKey) {
        mismatches.push(
          `planType: DB="${tenant.planType}" → Stripe="${stripePlanKey}"`
        );
      }

      if (mismatches.length === 0) {
        matchCount++;
        continue; // Already in sync
      }

      mismatchCount++;
      console.log(`⚠️  ${label}`);
      console.log(`   Stripe sub: ${activeSub.id} (status: ${stripeStatus})`);
      for (const m of mismatches) {
        console.log(`   • ${m}`);
      }

      // 4. Apply fix if --apply
      if (applyMode) {
        if (!stripePlanKey) {
          console.log(`   ❌ Cannot fix: no plan mapping for product ${stripeProductId}`);
          errorCount++;
          continue;
        }

        // Look up the Plan record in our DB
        const dbPlan = await prisma.plan.findUnique({
          where: { key: stripePlanKey },
        });

        if (!dbPlan) {
          console.log(`   ❌ Cannot fix: Plan "${stripePlanKey}" not found in database`);
          errorCount++;
          continue;
        }

        // Apply the fix in a transaction (mirrors updateTenantSubscription in stripe.ts)
        await prisma.$transaction(async (tx) => {
          await tx.tenant.update({
            where: { id: tenant.id },
            data: {
              stripeSubscriptionId: activeSub.id,
              stripeProductId: stripeProductId,
              planName: dbPlan.name,
              planType: stripePlanKey,
              subscriptionStatus: expectedDbStatus,
              subscriptionEndsAt: new Date(activeSub.current_period_end * 1000),
              isTrialPeriod: stripeStatus === 'trialing',
              status: 'ACTIVE',
            },
          });

          await tx.tenantSubscription.upsert({
            where: { tenantId: tenant.id },
            create: {
              tenantId: tenant.id,
              planId: dbPlan.id,
              stripeSubscriptionId: activeSub.id,
              status: expectedDbStatus,
              currentPeriodStart: new Date(activeSub.current_period_start * 1000),
              currentPeriodEnd: new Date(activeSub.current_period_end * 1000),
              cancelAtPeriodEnd: activeSub.cancel_at_period_end,
            },
            update: {
              planId: dbPlan.id,
              stripeSubscriptionId: activeSub.id,
              status: expectedDbStatus,
              currentPeriodStart: new Date(activeSub.current_period_start * 1000),
              currentPeriodEnd: new Date(activeSub.current_period_end * 1000),
              cancelAtPeriodEnd: activeSub.cancel_at_period_end,
            },
          });
        });

        console.log(`   ✅ Fixed → plan=${stripePlanKey}, status=${expectedDbStatus}`);
        fixedCount++;
      }
    } catch (error) {
      console.log(`   ❌ Error processing ${label}: ${error.message}`);
      errorCount++;
    }
  }

  // 5. Summary
  console.log('\n📊 SUMMARY');
  console.log('==========');
  console.log(`Total tenants with Stripe customer: ${tenants.length}`);
  console.log(`  ✅ Already in sync: ${matchCount}`);
  console.log(`  ⚠️  Mismatches found: ${mismatchCount}`);
  console.log(`  📭 No Stripe subscription: ${noSubCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  if (applyMode) {
    console.log(`  🔧 Fixed: ${fixedCount}`);
  } else if (mismatchCount > 0) {
    console.log(`\n💡 Run with --apply to fix the ${mismatchCount} mismatch(es):`);
    console.log(`   node scripts/reconcile-subscriptions.mjs --apply`);
  }
}

reconcile()
  .then(() => {
    console.log('\n✅ Reconciliation complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
