#!/usr/bin/env node

/**
 * Verificar tipos de precios en Stripe
 * Este script verifica si los precios están configurados como recurrentes o únicos
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

// IDs de precios que deberían ser recurrentes (NUEVOS PRECIOS)
const PRICE_IDS = [
  'price_1RftdkPwxz1bHxlH49ZHb4ZT', // Básico Mensual (recurrente)
  'price_1RftdlPwxz1bHxlHdr6Ia4pj', // Básico Anual (recurrente)
  'price_1RftdlPwxz1bHxlH4oW9dMDZ', // Profesional Mensual (recurrente)
  'price_1RftdmPwxz1bHxlH2lDZ07Rw', // Profesional Anual (recurrente)
];

async function checkPriceTypes() {
  console.log('🔍 Verificando tipos de precios en Stripe...\n');

  for (const priceId of PRICE_IDS) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      
      console.log(`📦 Precio: ${priceId}`);
      console.log(`   💰 Monto: $${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`);
      console.log(`   🔄 Tipo: ${price.type}`);
      console.log(`   📅 Intervalo: ${price.recurring ? price.recurring.interval : 'N/A'}`);
      console.log(`   ✅ Es recurrente: ${price.type === 'recurring' ? 'SÍ' : 'NO'}`);
      
      if (price.type !== 'recurring') {
        console.log(`   ⚠️  PROBLEMA: Este precio debe ser recurrente para suscripciones`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`❌ Error al verificar precio ${priceId}:`, error.message);
      console.log('');
    }
  }

  // Verificar el precio gratuito por separado
  try {
    const freePrice = await stripe.prices.retrieve('price_1RftdmPwxz1bHxlHvj8h32S6');
    console.log(`📦 Precio Gratuito: ${freePrice.id}`);
    console.log(`   💰 Monto: $${(freePrice.unit_amount / 100).toFixed(2)} ${freePrice.currency.toUpperCase()}`);
    console.log(`   🔄 Tipo: ${freePrice.type}`);
    console.log('   ℹ️  Los precios gratuitos pueden ser one_time o recurring\n');
  } catch (error) {
    console.log(`❌ Error al verificar precio gratuito:`, error.message);
  }
}

async function createRecurringPrices() {
  console.log('🛠️  ¿Necesitas crear precios recurrentes? Aquí tienes los comandos:\n');
  
  console.log('Para crear precios recurrentes correctos:');
  console.log('1. Ve a https://dashboard.stripe.com/products');
  console.log('2. Para cada producto, crea precios con estos parámetros:');
  console.log('');
  console.log('   📦 Plan Básico Mensual:');
  console.log('   - Precio: $449.00 MXN');
  console.log('   - Tipo: Recurring');
  console.log('   - Intervalo: Monthly');
  console.log('');
  console.log('   📦 Plan Básico Anual:');
  console.log('   - Precio: $349.00 MXN');
  console.log('   - Tipo: Recurring');
  console.log('   - Intervalo: Yearly');
  console.log('');
  console.log('   📦 Plan Profesional Mensual:');
  console.log('   - Precio: $899.00 MXN');
  console.log('   - Tipo: Recurring');
  console.log('   - Intervalo: Monthly');
  console.log('');
  console.log('   📦 Plan Profesional Anual:');
  console.log('   - Precio: $649.00 MXN');
  console.log('   - Tipo: Recurring');
  console.log('   - Intervalo: Yearly');
}

async function main() {
  try {
    await checkPriceTypes();
    await createRecurringPrices();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main(); 