#!/usr/bin/env node

/**
 * Script para listar todos los cupones en Stripe
 */

import Stripe from 'stripe';

const isProduction = process.argv.includes('--production');
const stripeKey = isProduction
  ? process.env.STRIPE_SECRET_KEY_LIVE
  : process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.error(`❌ ERROR: ${isProduction ? 'STRIPE_SECRET_KEY_LIVE' : 'STRIPE_SECRET_KEY'} no encontrada`);
  process.exit(1);
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-06-20',
});

async function listCoupons() {
  const mode = isProduction ? '🔴 PRODUCCIÓN (LIVE)' : '🧪 TEST';
  console.log('🎟️  LISTAR CUPONES DE STRIPE');
  console.log('='.repeat(70));
  console.log(`Modo: ${mode}`);
  console.log('');

  try {
    const coupons = await stripe.coupons.list({ limit: 100 });

    if (coupons.data.length === 0) {
      console.log('📭 No hay cupones creados en esta cuenta');
      console.log('');
      console.log('Para crear el cupón de promoción:');
      if (isProduction) {
        console.log('   node scripts/create-launch-promotion-coupon.mjs --production');
      } else {
        console.log('   node scripts/create-launch-promotion-coupon.mjs');
      }
      console.log('');
      return;
    }

    console.log(`📊 Total cupones: ${coupons.data.length}`);
    console.log('');

    for (const coupon of coupons.data) {
      const isValid = !coupon.redeem_by || (coupon.redeem_by * 1000 > Date.now());
      const status = isValid ? '✅ ACTIVO' : '❌ EXPIRADO';

      console.log(`${status} ${coupon.id}`);
      console.log(`   Nombre: ${coupon.name || 'N/A'}`);

      if (coupon.percent_off) {
        console.log(`   Descuento: ${coupon.percent_off}%`);
      } else if (coupon.amount_off) {
        console.log(`   Descuento: $${coupon.amount_off / 100} ${coupon.currency?.toUpperCase()}`);
      }

      if (coupon.duration === 'repeating') {
        console.log(`   Duración: ${coupon.duration_in_months} meses`);
      } else if (coupon.duration === 'forever') {
        console.log(`   Duración: Para siempre`);
      } else {
        console.log(`   Duración: Una vez`);
      }

      if (coupon.max_redemptions) {
        const remaining = coupon.max_redemptions - (coupon.times_redeemed || 0);
        console.log(`   Usos: ${coupon.times_redeemed || 0}/${coupon.max_redemptions} (${remaining} restantes)`);
      } else {
        console.log(`   Usos: ${coupon.times_redeemed || 0}/ilimitado`);
      }

      if (coupon.redeem_by) {
        const expiryDate = new Date(coupon.redeem_by * 1000);
        console.log(`   Válido hasta: ${expiryDate.toLocaleDateString('es-MX')}`);
      }

      console.log('');
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

listCoupons();
