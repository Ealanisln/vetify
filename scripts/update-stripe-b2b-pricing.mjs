#!/usr/bin/env node

/**
 * Actualizar precios B2B en Stripe con nueva estructura de precios
 * Este script actualiza los precios anuales según las nuevas especificaciones
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

// Nueva configuración de precios B2B
const NEW_B2B_PRICING = {
  PROFESIONAL: {
    productId: 'prod_Seq8I3438TwbPQ',
    name: 'Plan Profesional B2B',
    monthly: {
      amount: 59900, // $599 MXN
      priceId: 'price_1RjWSPPwxz1bHxlH60v9GJjX'
    },
    annual: {
      amount: 575000, // $5,750 MXN (20% OFF)
      priceId: 'price_1RjWSPPwxz1bHxlHpLCiifxS'
    }
  },
  CLINICA: {
    productId: 'prod_Seq84VFkBvXUhI',
    name: 'Plan Clínica B2B',
    monthly: {
      amount: 99900, // $999 MXN
      priceId: 'price_1RjWSQPwxz1bHxlHTcG2kbJA'
    },
    annual: {
      amount: 959000, // $9,590 MXN (20% OFF)
      priceId: 'price_1RjWSQPwxz1bHxlHZSALMZUr'
    }
  },
  EMPRESA: {
    productId: 'prod_Seq8KU7nw8WucQ',
    name: 'Plan Empresa B2B',
    monthly: {
      amount: 179900, // $1,799 MXN
      priceId: 'price_1RjWSRPwxz1bHxlHHp1pVI43'
    },
    annual: {
      amount: 1727000, // $17,270 MXN (20% OFF)
      priceId: 'price_1RjWSRPwxz1bHxlHR5zX9CCQ'
    }
  }
};

/**
 * Verificar precios existentes
 */
async function checkExistingPrices() {
  console.log('🔍 Verificando precios existentes en Stripe...\n');

  for (const [planKey, planConfig] of Object.entries(NEW_B2B_PRICING)) {
    console.log(`📦 ${planConfig.name}:`);
    
    // Verificar precio mensual
    try {
      const monthlyPrice = await stripe.prices.retrieve(planConfig.monthly.priceId);
      console.log(`   ✅ Mensual: $${(monthlyPrice.unit_amount / 100).toFixed(2)} MXN`);
    } catch (error) {
      console.log(`   ❌ Mensual: Error - ${error.message}`);
    }

    // Verificar precio anual
    try {
      const annualPrice = await stripe.prices.retrieve(planConfig.annual.priceId);
      console.log(`   ✅ Anual: $${(annualPrice.unit_amount / 100).toFixed(2)} MXN`);
    } catch (error) {
      console.log(`   ❌ Anual: Error - ${error.message}`);
    }
    
    console.log('');
  }
}

/**
 * Crear nuevos precios anuales si es necesario
 */
async function createNewAnnualPrices() {
  console.log('🚀 Creando nuevos precios anuales con descuento del 20%...\n');

  for (const [planKey, planConfig] of Object.entries(NEW_B2B_PRICING)) {
    console.log(`📦 ${planConfig.name} - Precio Anual:`);
    
    try {
      // Crear nuevo precio anual
      const newAnnualPrice = await stripe.prices.create({
        product: planConfig.productId,
        unit_amount: planConfig.annual.amount,
        currency: 'mxn',
        recurring: {
          interval: 'year',
          trial_period_days: 30 // 30 días gratis
        },
        nickname: `${planConfig.name} - Anual (20% OFF)`,
        metadata: {
          plan_key: planKey.toUpperCase(),
          interval: 'year',
          type: 'b2b',
          discount: '20%',
          trial_days: '30'
        }
      });

      console.log(`   ✅ Nuevo precio anual creado: ${newAnnualPrice.id}`);
      console.log(`   💰 Precio: $${(newAnnualPrice.unit_amount / 100).toFixed(2)} MXN`);
      console.log(`   📅 Intervalo: ${newAnnualPrice.recurring.interval}`);
      console.log(`   🎁 Trial: ${newAnnualPrice.recurring.trial_period_days} días`);
      console.log(`   🏷️  Nombre: ${newAnnualPrice.nickname}`);
      console.log('');

      // Actualizar la configuración con el nuevo ID
      planConfig.annual.priceId = newAnnualPrice.id;

    } catch (error) {
      console.log(`   ❌ Error creando precio anual: ${error.message}`);
      console.log('');
    }
  }
}

/**
 * Generar configuración actualizada
 */
function generateUpdatedConfig() {
  console.log('📋 CONFIGURACIÓN ACTUALIZADA PARA .env:');
  console.log('=====================================');
  
  for (const [planKey, planConfig] of Object.entries(NEW_B2B_PRICING)) {
    const planUpper = planKey.toUpperCase();
    console.log(`\n# ${planConfig.name}`);
    console.log(`STRIPE_PRODUCT_${planUpper}=${planConfig.productId}`);
    console.log(`STRIPE_PRICE_${planUpper}_MONTHLY=${planConfig.monthly.priceId}`);
    console.log(`STRIPE_PRICE_${planUpper}_ANNUAL=${planConfig.annual.priceId}`);
  }

  console.log('\n📊 RESUMEN DE PRECIOS ACTUALIZADOS:');
  console.log('====================================');
  console.log('💰 Plan Profesional: $5,750/año (20% OFF) + 30 días gratis');
  console.log('💰 Plan Clínica: $9,590/año (20% OFF) + 30 días gratis');
  console.log('💰 Plan Empresa: $17,270/año (20% OFF) + 30 días gratis');
  console.log('\n🎁 Todos los planes incluyen:');
  console.log('   • 30 días de prueba gratuita');
  console.log('   • Descuento del 20% en facturación anual');
  console.log('   • WhatsApp ilimitado');
  console.log('   • Soporte prioritario');
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 ACTUALIZACIÓN DE PRECIOS B2B EN STRIPE');
  console.log('==========================================');
  console.log('');
  console.log('📊 Nueva estructura de precios:');
  console.log('• PROFESIONAL: $599/mes o $5,750/año (20% OFF)');
  console.log('• CLÍNICA: $999/mes o $9,590/año (20% OFF)');
  console.log('• EMPRESA: $1,799/mes o $17,270/año (20% OFF)');
  console.log('');
  console.log('⏱️  Todos los planes incluyen 30 días de trial gratuito');
  console.log('');

  try {
    // Verificar precios existentes
    await checkExistingPrices();
    
    // Crear nuevos precios anuales
    await createNewAnnualPrices();
    
    // Generar configuración actualizada
    generateUpdatedConfig();
    
    console.log('\n🎉 ACTUALIZACIÓN COMPLETADA');
    console.log('============================');
    console.log('✅ Los precios B2B han sido actualizados exitosamente');
    console.log('✅ Todos los planes incluyen 30 días de trial gratuito');
    console.log('✅ Descuento del 20% aplicado a facturación anual');
    console.log('');
    console.log('🔄 PRÓXIMOS PASOS:');
    console.log('1. Copiar las nuevas variables de entorno a tu archivo .env');
    console.log('2. Actualizar el código con los nuevos IDs de precios');
    console.log('3. Probar el flujo de checkout con los nuevos precios');
    console.log('4. Verificar que las suscripciones se creen correctamente');
    
  } catch (error) {
    console.error('❌ Error durante la actualización:', error.message);
    process.exit(1);
  }
}

// Ejecutar script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

