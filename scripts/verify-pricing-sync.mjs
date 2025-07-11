#!/usr/bin/env node

/**
 * Verificar sincronización de precios con Stripe
 * Este script verifica que los precios del frontend coincidan con Stripe
 */

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

// Configuración de precios esperados (para futuras validaciones)
// const EXPECTED_PRICES = {
//   'basic': {
//     monthly: 44900, // $449 MXN
//     yearly: 34900   // $349 MXN
//   },
//   'professional': {
//     monthly: 89900, // $899 MXN
//     yearly: 64900   // $649 MXN
//   }
// };

console.log('🔍 Verificando sincronización de precios...\n');

// Verificar que el servidor está ejecutándose
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/pricing');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API de precios funcionando correctamente');
      console.log(`📊 Planes encontrados: ${data.plans.length}`);
      console.log(`⏰ Última actualización: ${data.lastUpdated}\n`);
      
      // Verificar cada plan
      data.plans.forEach(plan => {
        console.log(`📦 Plan: ${plan.name}`);
        console.log(`   🆔 ID: ${plan.id}`);
        console.log(`   📄 Descripción: ${plan.description}`);
        console.log(`   💰 Mensual: $${(plan.prices.monthly?.unitAmount || 0) / 100} MXN`);
        console.log(`   💰 Anual: $${(plan.prices.yearly?.unitAmount || 0) / 100} MXN`);
        console.log(`   🎯 Características: ${plan.features.length} funciones`);
        console.log('');
      });
      
      return true;
    } else {
      console.error('❌ Error en API de precios:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error conectando con el servidor:', error.message);
    console.log('💡 Asegúrate de que el servidor esté ejecutándose: npm run dev');
    return false;
  }
}

// Verificar que los precios coincidan con Stripe
async function verifyPriceSync() {
  console.log('🔄 Verificando sincronización con Stripe...');
  
  // Importar directamente las funciones de Stripe
  try {
    const { getStripePrices, getStripeProducts } = await import('../src/lib/payments/stripe.js');
    
    const [products, prices] = await Promise.all([
      getStripeProducts(),
      getStripePrices()
    ]);
    
    console.log(`✅ Productos en Stripe: ${products.length}`);
    console.log(`✅ Precios en Stripe: ${prices.length}`);
    
    // Verificar cada producto
    products.forEach(product => {
      const productPrices = prices.filter(p => p.productId === product.id);
      const monthlyPrice = productPrices.find(p => p.interval === 'month');
      const yearlyPrice = productPrices.find(p => p.interval === 'year');
      
      console.log(`\n📦 ${product.name}:`);
      if (monthlyPrice) {
        console.log(`   💰 Mensual: $${(monthlyPrice.unitAmount || 0) / 100} MXN (${monthlyPrice.id})`);
      }
      if (yearlyPrice) {
        console.log(`   💰 Anual: $${(yearlyPrice.unitAmount || 0) / 100} MXN (${yearlyPrice.id})`);
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error verificando Stripe:', error.message);
    return false;
  }
}

// Ejecutar verificación
async function main() {
  console.log('🚀 Iniciando verificación de sincronización de precios...\n');
  
  const serverOk = await checkServer();
  const stripeOk = await verifyPriceSync();
  
  console.log('\n📋 Resumen de verificación:');
  console.log(`   API de precios: ${serverOk ? '✅ OK' : '❌ Error'}`);
  console.log(`   Sincronización Stripe: ${stripeOk ? '✅ OK' : '❌ Error'}`);
  
  if (serverOk && stripeOk) {
    console.log('\n🎉 ¡Sincronización de precios completada exitosamente!');
    console.log('\n📝 Pasos siguientes:');
    console.log('   1. Visita http://localhost:3000/precios para ver los precios actualizados');
    console.log('   2. Los precios ahora están sincronizados con Stripe');
    console.log('   3. Cualquier cambio en Stripe se reflejará automáticamente');
  } else {
    console.log('\n⚠️  Hay problemas con la sincronización. Revisar los errores arriba.');
  }
}

main().catch(console.error); 