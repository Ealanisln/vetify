/**
 * Clean up duplicate Stripe subscriptions
 *
 * This script finds and cancels duplicate subscriptions for the same customer,
 * keeping only the most recent one.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Check if Stripe key is loaded
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY not found in environment variables');
  console.error('   Make sure .env.local exists and contains STRIPE_SECRET_KEY');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

interface SubscriptionGroup {
  customerId: string;
  customerEmail: string | null;
  subscriptions: Stripe.Subscription[];
}

async function cleanupDuplicateSubscriptions() {
  try {
    console.log('🔍 Searching for duplicate subscriptions...\n');

    // Get all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.customer']
    });

    if (subscriptions.data.length === 0) {
      console.log('✅ No active subscriptions found');
      return;
    }

    console.log(`📊 Found ${subscriptions.data.length} active subscription(s)\n`);

    // Group subscriptions by customer
    const groupedByCustomer = new Map<string, SubscriptionGroup>();

    for (const sub of subscriptions.data) {
      const customerId = typeof sub.customer === 'string'
        ? sub.customer
        : sub.customer.id;

      const customerEmail = typeof sub.customer === 'string'
        ? null
        : sub.customer.email;

      if (!groupedByCustomer.has(customerId)) {
        groupedByCustomer.set(customerId, {
          customerId,
          customerEmail,
          subscriptions: []
        });
      }

      groupedByCustomer.get(customerId)!.subscriptions.push(sub);
    }

    // Find customers with multiple subscriptions
    const customersWithDuplicates = Array.from(groupedByCustomer.values())
      .filter(group => group.subscriptions.length > 1);

    if (customersWithDuplicates.length === 0) {
      console.log('✅ No duplicate subscriptions found!\n');
      return;
    }

    console.log(`⚠️  Found ${customersWithDuplicates.length} customer(s) with duplicate subscriptions:\n`);

    let totalCanceled = 0;

    for (const group of customersWithDuplicates) {
      console.log(`👤 Customer: ${group.customerEmail || group.customerId}`);
      console.log(`   Subscriptions: ${group.subscriptions.length}`);

      // Sort by creation date (newest first)
      const sortedSubs = group.subscriptions.sort((a, b) => b.created - a.created);

      // Keep the newest, cancel the rest
      const [newest, ...duplicates] = sortedSubs;

      console.log(`   ✅ Keeping newest: ${newest.id} (created ${new Date(newest.created * 1000).toISOString()})`);

      for (const duplicate of duplicates) {
        console.log(`   ❌ Canceling duplicate: ${duplicate.id} (created ${new Date(duplicate.created * 1000).toISOString()})`);

        try {
          await stripe.subscriptions.cancel(duplicate.id);
          totalCanceled++;
          console.log(`      ✓ Canceled successfully`);
        } catch (error) {
          console.error(`      ✗ Error canceling:`, error);
        }
      }

      console.log('');
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   - Subscriptions canceled: ${totalCanceled}`);
    console.log(`   - Active subscriptions remaining: ${groupedByCustomer.size}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run the script
cleanupDuplicateSubscriptions()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
