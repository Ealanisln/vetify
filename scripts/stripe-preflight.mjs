/**
 * Stripe LIVE preflight — READ ONLY.
 *
 * Verifies that the product/price IDs configured for production actually exist
 * in Stripe live mode and that each price belongs to its mapped product, so a
 * real subscription webhook (handleSubscriptionChange) won't fail with
 * "plan_mapping_missing" the first time a customer actually pays.
 *
 * Run with the prod env loaded (never prints secrets):
 *   node --env-file=.env.preflight scripts/stripe-preflight.mjs
 *
 * Performs NO writes and NO charges. Only list/retrieve calls.
 */
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('✗ No Stripe key found in env (STRIPE_SECRET_KEY_LIVE / STRIPE_SECRET_KEY).');
  process.exit(1);
}
const mode = key.startsWith('sk_live_') ? 'LIVE' : key.startsWith('sk_test_') ? 'TEST' : 'UNKNOWN';
console.log(`\n=== Stripe preflight (${mode} mode) ===\n`);
if (mode !== 'LIVE') {
  console.warn(`⚠ Key is ${mode}, not LIVE. Verifying that mode instead.\n`);
}

const stripe = new Stripe(key, { apiVersion: '2024-06-20' });

// Mirror of getStripePlanMapping(): product + price IDs the app will use in prod.
const PLANS = {
  BASICO: {
    product: process.env.STRIPE_PRODUCT_BASICO_LIVE,
    prices: {
      monthly: process.env.STRIPE_PRICE_BASICO_MONTHLY_LIVE,
      annual: process.env.STRIPE_PRICE_BASICO_ANNUAL_LIVE,
    },
  },
  PROFESIONAL: {
    product: process.env.STRIPE_PRODUCT_PROFESIONAL_LIVE,
    prices: {
      monthly: process.env.STRIPE_PRICE_PROFESIONAL_MONTHLY_LIVE,
      annual: process.env.STRIPE_PRICE_PROFESIONAL_ANNUAL_LIVE,
    },
  },
  CORPORATIVO: {
    product: process.env.STRIPE_PRODUCT_CORPORATIVO_LIVE,
    prices: {
      monthly: process.env.STRIPE_PRICE_CORPORATIVO_MONTHLY_LIVE,
      annual: process.env.STRIPE_PRICE_CORPORATIVO_ANNUAL_LIVE,
    },
  },
};

let failures = 0;
const fail = (msg) => { failures++; console.log(`  ✗ ${msg}`); };
const ok = (msg) => console.log(`  ✓ ${msg}`);

for (const [planKey, cfg] of Object.entries(PLANS)) {
  console.log(`\n[${planKey}]`);

  if (!cfg.product) { fail(`product env var missing`); continue; }

  // 1) Product exists and is active
  let product;
  try {
    product = await stripe.products.retrieve(cfg.product);
    ok(`product ${cfg.product} exists ("${product.name}")${product.active ? '' : ' [INACTIVE!]'}`);
    if (!product.active) fail(`product ${cfg.product} is INACTIVE`);
  } catch (e) {
    fail(`product ${cfg.product} NOT FOUND in ${mode} (${e.code || e.message})`);
    continue;
  }

  // 2) Each price exists, is active, recurring, and belongs to this product
  for (const [interval, priceId] of Object.entries(cfg.prices)) {
    if (!priceId) { fail(`${interval} price env var missing`); continue; }
    try {
      const price = await stripe.prices.retrieve(priceId);
      const belongs = price.product === cfg.product;
      const amount = price.unit_amount != null ? (price.unit_amount / 100).toFixed(2) : '?';
      if (!belongs) {
        fail(`${interval} price ${priceId} belongs to ${price.product}, NOT ${cfg.product}`);
      } else if (!price.active) {
        fail(`${interval} price ${priceId} is INACTIVE`);
      } else if (!price.recurring) {
        fail(`${interval} price ${priceId} is not recurring`);
      } else {
        ok(`${interval}: ${priceId} — ${amount} ${price.currency.toUpperCase()}/${price.recurring.interval} ✓ maps to product`);
      }
    } catch (e) {
      fail(`${interval} price ${priceId} NOT FOUND in ${mode} (${e.code || e.message})`);
    }
  }
}

// 3) Webhook endpoints registered in this account
console.log(`\n[webhook endpoints]`);
try {
  const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });
  if (endpoints.data.length === 0) {
    fail('No webhook endpoints registered in this Stripe account');
  }
  for (const ep of endpoints.data) {
    const events = ep.enabled_events.includes('*') ? 'ALL events' : `${ep.enabled_events.length} events`;
    console.log(`  • ${ep.url}  [${ep.status}]  ${events}`);
    const needed = [
      'checkout.session.completed',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
    ];
    if (!ep.enabled_events.includes('*')) {
      const missing = needed.filter((n) => !ep.enabled_events.includes(n));
      if (missing.length) console.log(`      ⚠ missing handled events: ${missing.join(', ')}`);
    }
  }
} catch (e) {
  fail(`Could not list webhook endpoints (${e.code || e.message})`);
}

console.log(`\n=== Result: ${failures === 0 ? 'PASS ✓ — mapping is consistent' : `FAIL ✗ — ${failures} issue(s) found`} ===\n`);
process.exit(failures === 0 ? 0 : 1);
