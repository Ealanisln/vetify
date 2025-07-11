#!/usr/bin/env node

/**
 * Script para configurar productos y precios B2B en Stripe
 * 
 * Este script crea los nuevos productos y precios para la estructura B2B:
 * - PROFESIONAL: $599/$479 MXN (300 mascotas, 3 usuarios)
 * - CLINICA: $999/$799 MXN (1,000 mascotas, 8 usuarios)  
 * - EMPRESA: $1,799/$1,439 MXN (ilimitado mascotas, 20 usuarios)
 * 
 * Uso:
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/setup-stripe-b2b-products.mjs
 */

import Stripe from 'stripe';

// Verificar que tenemos la clave de Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY no encontrada en las variables de entorno');
  console.error('   Asegúrate de configurar: STRIPE_SECRET_KEY=sk_test_...');
  console.error('   Ejemplo: STRIPE_SECRET_KEY=sk_test_... node scripts/setup-stripe-b2b-products.mjs');
  process.exit(1);
}

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Configuración de productos B2B
const B2B_PRODUCTS = [
  {
    id: 'profesional',
    name: 'Plan Profesional B2B',
    description: 'Ideal para clínicas establecidas que buscan profesionalizar su operación.',
    features: [
      'Hasta 300 mascotas',
      '3 usuarios veterinarios',
      'WhatsApp ilimitado',
      'Expedientes completos',
      'Automatización básica',
      'Soporte profesional'
    ],
    limits: {
      pets: 300,
      users: 3,
      whatsappMessages: -1,
      storageGB: 5
    },
    prices: {
      monthly: 59900, // $599 MXN
      annual: 47900   // $479 MXN
    }
  },
  {
    id: 'clinica',
    name: 'Plan Clínica B2B',
    description: 'Perfecto para clínicas en crecimiento con múltiples sucursales.',
    features: [
      'Hasta 1,000 mascotas',
      '8 usuarios veterinarios',
      'WhatsApp ilimitado',
      'Automatización completa',
      'Multi-sucursal',
      'Reportes avanzados',
      'Soporte prioritario'
    ],
    limits: {
      pets: 1000,
      users: 8,
      whatsappMessages: -1,
      storageGB: 20
    },
    prices: {
      monthly: 99900, // $999 MXN
      annual: 79900   // $799 MXN
    }
  },
  {
    id: 'empresa',
    name: 'Plan Empresa B2B',
    description: 'Solución integral para grandes organizaciones veterinarias.',
    features: [
      'Mascotas ilimitadas',
      '20 usuarios veterinarios',
      'WhatsApp ilimitado',
      'API personalizada',
      'Automatización avanzada',
      'Soporte 24/7',
      'Consultoría especializada'
    ],
    limits: {
      pets: -1, // ilimitado
      users: 20,
      whatsappMessages: -1,
      storageGB: 100
    },
    prices: {
      monthly: 179900, // $1,799 MXN
      annual: 143900   // $1,439 MXN
    }
  }
];

/**
 * Crear producto en Stripe
 */
async function createProduct(productConfig) {
  try {
    console.log(`📦 Creando producto: ${productConfig.name}...`);
    
    const product = await stripe.products.create({
      name: productConfig.name,
      description: productConfig.description,
      metadata: {
        plan_key: productConfig.id.toUpperCase(),
        features: JSON.stringify(productConfig.features),
        limits: JSON.stringify(productConfig.limits),
        type: 'b2b'
      }
    });

    console.log(`   ✅ Producto creado: ${product.id}`);
    console.log(`   📝 Nombre: ${product.name}`);
    console.log(`   📋 Descripción: ${product.description}`);
    console.log('');

    return product;
  } catch (error) {
    console.log(`   ❌ Error creando producto ${productConfig.name}:`, error.message);
    return null;
  }
}

/**
 * Crear precio en Stripe
 */
async function createPrice(product, amount, interval, planKey) {
  try {
    const intervalText = interval === 'month' ? 'Mensual' : 'Anual';
    console.log(`   💰 Creando precio ${intervalText}: $${(amount / 100).toFixed(2)} MXN...`);
    
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount,
      currency: 'mxn',
      recurring: {
        interval: interval,
        trial_period_days: 30 // 30 días de trial para todos los planes
      },
      nickname: `${product.name} - ${intervalText}`,
      metadata: {
        plan_key: planKey,
        interval: interval,
        type: 'b2b'
      }
    });

    console.log(`     ✅ Precio creado: ${price.id}`);
    console.log(`     💵 Cantidad: $${(price.unit_amount / 100).toFixed(2)} MXN`);
    console.log(`     📅 Intervalo: ${price.recurring.interval}`);
    console.log(`     🎁 Trial: ${price.recurring.trial_period_days} días`);
    console.log('');

    return price;
  } catch (error) {
    console.log(`     ❌ Error creando precio:`, error.message);
    return null;
  }
}

/**
 * Generar configuración de variables de entorno
 */
function generateEnvConfig(results) {
  console.log('\n📋 CONFIGURACIÓN PARA .env:');
  console.log('================================');
  
  results.forEach(result => {
    if (result.product && result.prices.monthly && result.prices.annual) {
      const planKey = result.planKey.toUpperCase();
      console.log(`STRIPE_PRODUCT_${planKey}="${result.product.id}"`);
      console.log(`STRIPE_PRICE_${planKey}_MONTHLY="${result.prices.monthly.id}"`);
      console.log(`STRIPE_PRICE_${planKey}_ANNUAL="${result.prices.annual.id}"`);
      console.log('');
    }
  });
}

/**
 * Generar archivo de configuración JSON
 */
function generateJSONConfig(results) {
  const config = {
    products: {},
    prices: {},
    environment_variables: {},
    created_at: new Date().toISOString(),
    type: 'b2b'
  };

  results.forEach(result => {
    if (result.product && result.prices.monthly && result.prices.annual) {
      const planKey = result.planKey.toLowerCase();
      const planKeyUpper = result.planKey.toUpperCase();

      // Productos
      config.products[planKey] = {
        id: result.product.id,
        name: result.product.name,
        description: result.product.description
      };

      // Precios
      config.prices[planKey] = {
        monthly: {
          id: result.prices.monthly.id,
          amount: result.prices.monthly.unit_amount,
          currency: result.prices.monthly.currency,
          formatted: `$${(result.prices.monthly.unit_amount / 100).toFixed(0)}`
        },
        annual: {
          id: result.prices.annual.id,
          amount: result.prices.annual.unit_amount,
          currency: result.prices.annual.currency,
          formatted: `$${(result.prices.annual.unit_amount / 100).toFixed(0)}`
        }
      };

      // Variables de entorno
      config.environment_variables[`STRIPE_PRODUCT_${planKeyUpper}`] = result.product.id;
      config.environment_variables[`STRIPE_PRICE_${planKeyUpper}_MONTHLY`] = result.prices.monthly.id;
      config.environment_variables[`STRIPE_PRICE_${planKeyUpper}_ANNUAL`] = result.prices.annual.id;
    }
  });

  return config;
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 CONFIGURACIÓN DE PRODUCTOS B2B EN STRIPE');
  console.log('=============================================');
  console.log('');
  console.log('📊 Estructura de precios B2B:');
  console.log('• PROFESIONAL: $599/$479 MXN (300 mascotas, 3 usuarios)');
  console.log('• CLÍNICA: $999/$799 MXN (1,000 mascotas, 8 usuarios)');
  console.log('• EMPRESA: $1,799/$1,439 MXN (ilimitado mascotas, 20 usuarios)');
  console.log('');
  console.log('⏱️  Todos los planes incluyen 30 días de trial gratuito');
  console.log('');

  const results = [];

  for (const productConfig of B2B_PRODUCTS) {
    console.log(`📦 PROCESANDO: ${productConfig.name.toUpperCase()}`);
    console.log('='.repeat(50));
    
    // Crear producto
    const product = await createProduct(productConfig);
    if (!product) {
      console.log('❌ Saltando creación de precios debido al error del producto\n');
      continue;
    }

    // Crear precios
    const prices = {
      monthly: await createPrice(product, productConfig.prices.monthly, 'month', productConfig.id.toUpperCase()),
      annual: await createPrice(product, productConfig.prices.annual, 'year', productConfig.id.toUpperCase())
    };

    results.push({
      planKey: productConfig.id,
      product,
      prices
    });

    console.log('✅ Producto y precios creados exitosamente\n');
  }

  // Generar configuración
  console.log('\n🎉 CONFIGURACIÓN COMPLETADA');
  console.log('============================');
  
  generateEnvConfig(results);
  
  const jsonConfig = generateJSONConfig(results);
  
  // Guardar configuración en archivo
  const fs = await import('fs');
  const configPath = './scripts/stripe-b2b-config.json';
  fs.default.writeFileSync(configPath, JSON.stringify(jsonConfig, null, 2));
  
  console.log(`💾 Configuración guardada en: ${configPath}`);
  console.log('');
  console.log('🔄 PRÓXIMOS PASOS:');
  console.log('1. Copiar las variables de entorno a tu archivo .env');
  console.log('2. Actualizar STRIPE_PRODUCTS y STRIPE_PRICES en src/lib/payments/stripe.ts');
  console.log('3. Ejecutar el script de migración de base de datos');
  console.log('4. Probar los flujos de suscripción en tu aplicación');
  console.log('');
  console.log('✅ Setup B2B completado exitosamente!');
}

// Ejecutar script
main().catch(console.error); 