#!/usr/bin/env node

/**
 * Script para sincronizar productos de Stripe con la base de datos
 *
 * Este script:
 * 1. Lee los planes de la base de datos
 * 2. Crea/actualiza productos y precios en Stripe
 * 3. Genera archivo de configuración con los IDs correctos
 *
 * Uso:
 *   node scripts/sync-stripe-with-db.mjs
 */

import Stripe from 'stripe';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// Inicializar Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY no encontrada');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

const prisma = new PrismaClient();

/**
 * Crear producto en Stripe
 */
async function createProduct(plan) {
  try {
    console.log(`\n📦 Creando producto: ${plan.name}...`);

    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description || `Plan ${plan.name} de Vetify`,
      metadata: {
        plan_key: plan.key,
        plan_id: plan.id,
        max_users: plan.maxUsers.toString(),
        max_pets: plan.maxPets.toString(),
        storage_gb: plan.storageGB.toString(),
      }
    });

    console.log(`   ✅ Producto creado: ${product.id}`);
    return product;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Crear precio en Stripe
 */
async function createPrice(product, amount, interval, planKey) {
  try {
    const intervalText = interval === 'month' ? 'Mensual' : 'Anual';
    console.log(`   💰 Creando precio ${intervalText}: $${(amount / 100).toLocaleString()} MXN...`);

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount), // Asegurar que sea entero
      currency: 'mxn',
      recurring: {
        interval: interval,
        trial_period_days: 30
      },
      nickname: `${product.name} - ${intervalText}`,
      metadata: {
        plan_key: planKey,
        interval: interval,
      }
    });

    console.log(`     ✅ Precio creado: ${price.id}`);
    return price;
  } catch (error) {
    console.log(`     ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 SINCRONIZACIÓN DE STRIPE CON BASE DE DATOS');
  console.log('='.repeat(50));
  console.log('');

  try {
    // Leer planes de la base de datos
    console.log('📊 Leyendo planes de la base de datos...');
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' }
    });

    if (plans.length === 0) {
      console.log('❌ No se encontraron planes activos en la base de datos');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Encontrados ${plans.length} planes activos:\n`);
    plans.forEach(plan => {
      const monthly = parseFloat(plan.monthlyPrice);
      const annual = parseFloat(plan.annualPrice);
      console.log(`   • ${plan.key}: $${monthly} mensual / $${annual} anual`);
    });

    const results = [];

    // Procesar cada plan
    for (const plan of plans) {
      console.log('\n' + '='.repeat(50));
      console.log(`📦 PROCESANDO: ${plan.key.toUpperCase()}`);
      console.log('='.repeat(50));

      // Crear producto
      const product = await createProduct(plan);
      if (!product) continue;

      // Convertir precios de Decimal a centavos (enteros)
      const monthlyAmount = Math.round(parseFloat(plan.monthlyPrice) * 100);
      const annualAmount = Math.round(parseFloat(plan.annualPrice) * 100);

      // Crear precios
      const prices = {
        monthly: await createPrice(product, monthlyAmount, 'month', plan.key),
        annual: await createPrice(product, annualAmount, 'year', plan.key)
      };

      if (prices.monthly && prices.annual) {
        results.push({
          planKey: plan.key,
          planId: plan.id,
          product,
          prices,
          dbData: {
            monthlyPrice: parseFloat(plan.monthlyPrice),
            annualPrice: parseFloat(plan.annualPrice),
            maxUsers: plan.maxUsers,
            maxPets: plan.maxPets
          }
        });
      }
    }

    // Generar configuración
    console.log('\n' + '='.repeat(50));
    console.log('🎉 CONFIGURACIÓN COMPLETADA');
    console.log('='.repeat(50));
    console.log('');

    // Generar JSON de configuración
    const config = {
      products: {},
      prices: {},
      database_sync: {},
      created_at: new Date().toISOString(),
      type: 'current_b2b'
    };

    results.forEach(result => {
      const key = result.planKey.toLowerCase();

      config.products[key] = {
        id: result.product.id,
        name: result.product.name,
        plan_id_db: result.planId
      };

      config.prices[key] = {
        monthly: {
          id: result.prices.monthly.id,
          amount: result.prices.monthly.unit_amount,
          formatted: `$${(result.prices.monthly.unit_amount / 100).toLocaleString()}`
        },
        annual: {
          id: result.prices.annual.id,
          amount: result.prices.annual.unit_amount,
          formatted: `$${(result.prices.annual.unit_amount / 100).toLocaleString()}`
        }
      };

      config.database_sync[key] = result.dbData;
    });

    // Guardar configuración
    const fs = await import('fs');
    const configPath = './scripts/stripe-current-config.json';
    fs.default.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`💾 Configuración guardada en: ${configPath}\n`);

    // Mostrar configuración para archivos
    console.log('📋 ACTUALIZA ESTOS ARCHIVOS:');
    console.log('='.repeat(50));
    console.log('\n1️⃣  src/lib/payments/stripe.ts - STRIPE_PRODUCTS:');
    console.log('```typescript');
    console.log('export const STRIPE_PRODUCTS = {');
    results.forEach(r => {
      console.log(`  ${r.planKey}: '${r.product.id}',`);
    });
    console.log('} as const;');
    console.log('```\n');

    console.log('2️⃣  src/lib/payments/stripe.ts - STRIPE_PRICES:');
    console.log('```typescript');
    console.log('export const STRIPE_PRICES = {');
    results.forEach(r => {
      console.log(`  ${r.planKey}: {`);
      console.log(`    monthly: '${r.prices.monthly.id}',`);
      console.log(`    annual: '${r.prices.annual.id}',`);
      console.log(`  },`);
    });
    console.log('} as const;');
    console.log('```\n');

    console.log('3️⃣  src/lib/pricing-config.ts - PRICING_CONFIG.PLANS:');
    console.log('```typescript');
    results.forEach(r => {
      console.log(`  ${r.planKey}: {`);
      console.log(`    stripeProductId: '${r.product.id}',`);
      console.log(`    stripePriceMonthly: '${r.prices.monthly.id}',`);
      console.log(`    stripePriceYearly: '${r.prices.annual.id}',`);
      console.log(`  },`);
    });
    console.log('```\n');

    console.log('✅ ¡Sincronización completada exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
main().catch(console.error);
