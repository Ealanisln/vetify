#!/usr/bin/env node

/**
 * Adds multi-currency options (CLP/COP/USD) to the recurring subscription
 * prices, so Checkout can charge in the tenant's billing currency.
 *
 * Source of truth for amounts: src/lib/payments/billing-prices.ts
 * (BILLING_PRICES). Keep both in sync when prices change.
 *
 * Detects test vs live mode from the configured STRIPE_SECRET_KEY and picks
 * the matching price IDs (same mapping as src/lib/payments/stripe.ts).
 *
 * Usage:
 *   node scripts/add-currency-options.mjs --dry-run   # print planned updates
 *   node scripts/add-currency-options.mjs             # apply
 */

import Stripe from 'stripe';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length && key.trim().startsWith('STRIPE_')) {
      const value = rest.join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key.trim()] = process.env[key.trim()] || value;
    }
  });
} catch {
  console.log('⚠️  No se pudo cargar .env.local, usando variables del sistema');
}

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error('❌ STRIPE_SECRET_KEY no configurada');
  process.exit(1);
}

const isLive = secretKey.startsWith('sk_live_');
const dryRun = process.argv.includes('--dry-run');

const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });

// Price IDs per mode — mirror of TEST_PRICES / PRODUCTION_PRICES in
// src/lib/payments/stripe.ts
const PRICE_IDS = isLive
  ? {
      BASICO: {
        monthly: process.env.STRIPE_PRICE_BASICO_MONTHLY_LIVE || 'price_1SRbeEL0nsUWmd4XBFJ39Vos',
        annual: process.env.STRIPE_PRICE_BASICO_ANNUAL_LIVE || 'price_1SRbeEL0nsUWmd4XKYm8XgQf',
      },
      PROFESIONAL: {
        monthly: process.env.STRIPE_PRICE_PROFESIONAL_MONTHLY_LIVE || 'price_1SRbeEL0nsUWmd4XeqTWgtqf',
        annual: process.env.STRIPE_PRICE_PROFESIONAL_ANNUAL_LIVE || 'price_1SRbeFL0nsUWmd4X3828tN8a',
      },
      CORPORATIVO: {
        monthly: process.env.STRIPE_PRICE_CORPORATIVO_MONTHLY_LIVE || 'price_1SRbeFL0nsUWmd4XAVO4h9rv',
        annual: process.env.STRIPE_PRICE_CORPORATIVO_ANNUAL_LIVE || 'price_1SRbeGL0nsUWmd4XKgS6jCso',
      },
    }
  : {
      BASICO: {
        monthly: 'price_1SJh6nPwxz1bHxlHQ15mCTij',
        annual: 'price_1SJh6oPwxz1bHxlH1gXSEuSF',
      },
      PROFESIONAL: {
        monthly: 'price_1SJh6oPwxz1bHxlHkJudNKvL',
        annual: 'price_1SJh6pPwxz1bHxlHcMip7KIU',
      },
      CORPORATIVO: {
        monthly: 'price_1SJh6pPwxz1bHxlHY9cnLnPw',
        annual: 'price_1SJh6qPwxz1bHxlHd3ud2WZ3',
      },
    };

// Minor units — mirror of BILLING_PRICES in src/lib/payments/billing-prices.ts
// (CLP is zero-decimal; COP/USD are two-decimal)
const CURRENCY_OPTIONS = {
  BASICO: {
    monthly: { clp: { unit_amount: 29900 }, cop: { unit_amount: 12990000 }, usd: { unit_amount: 3500 } },
    annual: { clp: { unit_amount: 239000 }, cop: { unit_amount: 103900000 }, usd: { unit_amount: 27900 } },
  },
  PROFESIONAL: {
    monthly: { clp: { unit_amount: 59900 }, cop: { unit_amount: 25990000 }, usd: { unit_amount: 6900 } },
    annual: { clp: { unit_amount: 479000 }, cop: { unit_amount: 207900000 }, usd: { unit_amount: 54900 } },
  },
  CORPORATIVO: {
    monthly: { clp: { unit_amount: 249900 }, cop: { unit_amount: 108900000 }, usd: { unit_amount: 28900 } },
    annual: { clp: { unit_amount: 2998800 }, cop: { unit_amount: 1306800000 }, usd: { unit_amount: 346800 } },
  },
};

console.log(`🚀 Agregando currency_options (${isLive ? '🔴 LIVE' : '🧪 TEST'} mode)${dryRun ? ' — DRY RUN' : ''}`);
console.log('');

let failures = 0;

for (const [plan, intervals] of Object.entries(CURRENCY_OPTIONS)) {
  for (const [interval, options] of Object.entries(intervals)) {
    const priceId = PRICE_IDS[plan][interval];
    const label = `${plan} ${interval} (${priceId})`;

    try {
      const price = await stripe.prices.retrieve(priceId);

      if (price.currency !== 'mxn') {
        console.error(`❌ ${label}: base currency es ${price.currency}, se esperaba mxn — omitido`);
        failures++;
        continue;
      }

      if (dryRun) {
        console.log(`🔍 ${label}:`);
        for (const [ccy, opt] of Object.entries(options)) {
          console.log(`     ${ccy}: ${opt.unit_amount} (minor units)`);
        }
        continue;
      }

      await stripe.prices.update(priceId, { currency_options: options });

      const updated = await stripe.prices.retrieve(priceId, { expand: ['currency_options'] });
      const applied = Object.keys(updated.currency_options || {}).sort().join(', ');
      console.log(`✅ ${label}: currency_options = ${applied}`);
    } catch (error) {
      console.error(`❌ ${label}: ${error.message}`);
      failures++;
    }
  }
}

console.log('');
if (failures > 0) {
  console.error(`❌ ${failures} precio(s) fallaron`);
  process.exit(1);
}
console.log(dryRun ? '🔍 Dry run completo — nada se modificó' : '🎉 Catálogo actualizado');
