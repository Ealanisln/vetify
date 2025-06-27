#!/usr/bin/env node

/**
 * Setup Stripe Products and Prices for Vetify
 * 
 * This script creates the necessary products and prices in Stripe dashboard
 * for the Mexican market using MXN currency.
 * 
 * Usage:
 * node scripts/setup-stripe-products.mjs
 */

import { createStripeProducts } from '../src/lib/stripe.ts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('🚀 Setting up Stripe products and prices for Vetify...\n');

    // Validate required environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      throw new Error('STRIPE_SECRET_KEY must be a valid Stripe secret key');
    }

    console.log('✅ Environment variables validated');
    console.log('🔄 Creating Stripe products and prices...\n');

    const result = await createStripeProducts();

    console.log('\n🎉 Stripe setup completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`- Created ${result.products.length} products`);
    console.log(`- Created ${result.prices.length} prices`);
    console.log('\n🔧 Next steps:');
    console.log('1. Update your .env file with the price IDs shown above');
    console.log('2. Configure your webhook endpoint in Stripe dashboard');
    console.log('3. Test the checkout flow in your application');

  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error.message);
    process.exit(1);
  }
}

// Run the script
main(); 