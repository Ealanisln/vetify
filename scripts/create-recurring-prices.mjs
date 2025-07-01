#!/usr/bin/env node

/**
 * Crear precios recurrentes en Stripe
 * Este script crea los precios correctos como recurrentes para suscripciones
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
    const [key, value] = line.split('=');
    if (key && value && key.startsWith('STRIPE_')) {
      process.env[key] = value;
    }
  });
} catch {
  console.log('⚠️  No se pudo cargar .env.local, usando variables del sistema');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
});

// IDs de productos existentes
const PRODUCT_IDS = {
  free: 'prod_SZe4GCWqiEsIEf',
  basic: 'prod_SZe4NA8cu4P54h',
  professional: 'prod_SZe4xMYFaIBERq'
};

async function createRecurringPrices() {
  console.log('🚀 Creando precios recurrentes en Stripe...\n');

  const pricesToCreate = [
    {
      product: PRODUCT_IDS.basic,
      name: 'Plan Básico Mensual',
      amount: 44900, // $449 MXN
      interval: 'month',
      key: 'BASIC_MONTHLY'
    },
    {
      product: PRODUCT_IDS.basic,
      name: 'Plan Básico Anual',
      amount: 34900, // $349 MXN
      interval: 'year',
      key: 'BASIC_YEARLY'
    },
    {
      product: PRODUCT_IDS.professional,
      name: 'Plan Profesional Mensual',
      amount: 89900, // $899 MXN
      interval: 'month',
      key: 'PROFESSIONAL_MONTHLY'
    },
    {
      product: PRODUCT_IDS.professional,
      name: 'Plan Profesional Anual',
      amount: 64900, // $649 MXN
      interval: 'year',
      key: 'PROFESSIONAL_YEARLY'
    }
  ];

  const createdPrices = {};

  for (const priceConfig of pricesToCreate) {
    try {
      console.log(`📦 Creando ${priceConfig.name}...`);
      
      const price = await stripe.prices.create({
        product: priceConfig.product,
        unit_amount: priceConfig.amount,
        currency: 'mxn',
        recurring: {
          interval: priceConfig.interval,
        },
        nickname: priceConfig.name
      });

      createdPrices[priceConfig.key] = price.id;
      
      console.log(`   ✅ Creado: ${price.id}`);
      console.log(`   💰 Precio: $${(price.unit_amount / 100).toFixed(2)} MXN`);
      console.log(`   📅 Intervalo: ${price.recurring.interval}`);
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Error creando ${priceConfig.name}:`, error.message);
      console.log('');
    }
  }

  // También crear un precio recurrente gratuito (trial)
  try {
    console.log('📦 Creando Plan Gratuito (trial)...');
    
    const freePrice = await stripe.prices.create({
      product: PRODUCT_IDS.free,
      unit_amount: 0,
      currency: 'mxn',
      recurring: {
        interval: 'month',
      },
      nickname: 'Plan Gratuito Trial'
    });

    createdPrices.FREE = freePrice.id;
    
    console.log(`   ✅ Creado: ${freePrice.id}`);
    console.log(`   💰 Precio: $0.00 MXN (trial)`);
    console.log(`   📅 Intervalo: month`);
    console.log('');
    
  } catch (error) {
    console.log(`   ❌ Error creando plan gratuito:`, error.message);
    console.log('');
  }

  return createdPrices;
}

async function updateConfigFile(createdPrices) {
  console.log('📝 Nuevos IDs de precios recurrentes:\n');
  
  Object.entries(createdPrices).forEach(([key, priceId]) => {
    console.log(`${key}: ${priceId}`);
  });

  console.log('\n🔧 Para actualizar tu código, copia estos IDs a:');
  console.log('- src/lib/payments/stripe.ts');
  console.log('- src/components/pricing/PricingPageEnhanced.tsx');
  console.log('');
  
  console.log('🗂️  Archivo de configuración actualizado en stripe-config.json');
}

async function main() {
  try {
    console.log('🎯 Este script creará precios RECURRENTES para suscripciones\n');
    
    const createdPrices = await createRecurringPrices();
    await updateConfigFile(createdPrices);
    
    console.log('🎉 ¡Precios recurrentes creados exitosamente!');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('1. Actualiza los IDs en tu código con los nuevos precios');
    console.log('2. Prueba el checkout nuevamente');
    console.log('3. Los precios anteriores (one_time) pueden eliminarse del dashboard de Stripe');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main(); 