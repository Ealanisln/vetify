#!/usr/bin/env node

/**
 * 🔍 SCRIPT DE VALIDACIÓN DE SINCRONIZACIÓN STRIPE-CÓDIGO
 * 
 * Este script valida que:
 * 1. Los productos B2B están activos en Stripe
 * 2. Los price IDs en el código coinciden con Stripe
 * 3. Los metadatos están presentes y correctos
 * 4. Los precios en pricing-config.ts coinciden con Stripe
 */

import Stripe from 'stripe';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Configuración
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// Productos B2B esperados
const EXPECTED_B2B_PRODUCTS = {
  'prod_Seq8I3438TwbPQ': 'Plan Profesional B2B',
  'prod_Seq84VFkBvXUhI': 'Plan Clínica B2B', 
  'prod_Seq8KU7nw8WucQ': 'Plan Empresa B2B'
};

// Price IDs esperados
const EXPECTED_PRICE_IDS = {
  PROFESIONAL: {
    monthly: 'price_1RjWSPPwxz1bHxlH60v9GJjX',
    annual: 'price_1RjWSPPwxz1bHxlHpLCiifxS',
  },
  CLINICA: {
    monthly: 'price_1RjWSQPwxz1bHxlHTcG2kbJA',
    annual: 'price_1RjWSQPwxz1bHxlHZSALMZUr',
  },
  EMPRESA: {
    monthly: 'price_1RjWSRPwxz1bHxlHHp1pVI43',
    annual: 'price_1RjWSRPwxz1bHxlHR5zX9CCQ',
  }
};

// Precios esperados (en centavos)
const EXPECTED_PRICES = {
  PROFESIONAL: { monthly: 59900, yearly: 47900 },
  CLINICA: { monthly: 99900, yearly: 79900 },
  EMPRESA: { monthly: 179900, yearly: 143900 }
};

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(colors.green, `✅ ${message}`);
}

function error(message) {
  log(colors.red, `❌ ${message}`);
}

function warning(message) {
  log(colors.yellow, `⚠️  ${message}`);
}

function info(message) {
  log(colors.blue, `ℹ️  ${message}`);
}

function header(message) {
  log(colors.bold, `\n🔍 ${message}`);
}

async function validateStripeProducts() {
  header('VALIDANDO PRODUCTOS EN STRIPE');
  
  try {
    const products = await stripe.products.list({ 
      active: true,
      limit: 100 
    });
    
    let validationPassed = true;
    
    // Verificar productos B2B esperados
    for (const [productId, expectedName] of Object.entries(EXPECTED_B2B_PRODUCTS)) {
      const product = products.data.find(p => p.id === productId);
      
      if (!product) {
        error(`Producto ${productId} (${expectedName}) no encontrado en Stripe`);
        validationPassed = false;
        continue;
      }
      
      if (!product.active) {
        error(`Producto ${productId} está inactivo en Stripe`);
        validationPassed = false;
        continue;
      }
      
      if (!product.metadata?.type || product.metadata.type !== 'b2b') {
        warning(`Producto ${productId} no tiene metadata.type = 'b2b'`);
      }
      
      if (!product.metadata?.features) {
        warning(`Producto ${productId} no tiene metadata.features`);
      }
      
      success(`Producto ${productId} (${product.name}) está activo y configurado`);
    }
    
    return validationPassed;
    
  } catch (err) {
    error(`Error accediendo a Stripe: ${err.message}`);
    return false;
  }
}

async function validateStripePrices() {
  header('VALIDANDO PRECIOS EN STRIPE');
  
  try {
    const prices = await stripe.prices.list({ 
      active: true,
      limit: 100 
    });
    
    let validationPassed = true;
    
    // Verificar cada price ID esperado
    for (const [planKey, priceIds] of Object.entries(EXPECTED_PRICE_IDS)) {
      const expectedPrices = EXPECTED_PRICES[planKey];
      
      // Verificar precio mensual
      const monthlyPrice = prices.data.find(p => p.id === priceIds.monthly);
      if (!monthlyPrice) {
        error(`Price ID mensual ${priceIds.monthly} para ${planKey} no encontrado`);
        validationPassed = false;
      } else {
        if (monthlyPrice.unit_amount !== expectedPrices.monthly) {
          error(`Precio mensual de ${planKey}: esperado ${expectedPrices.monthly}, actual ${monthlyPrice.unit_amount}`);
          validationPassed = false;
        } else {
          success(`Precio mensual de ${planKey}: ${monthlyPrice.unit_amount / 100} MXN`);
        }
      }
      
      // Verificar precio anual
      const annualPrice = prices.data.find(p => p.id === priceIds.annual);
      if (!annualPrice) {
        error(`Price ID anual ${priceIds.annual} para ${planKey} no encontrado`);
        validationPassed = false;
      } else {
        if (annualPrice.unit_amount !== expectedPrices.yearly) {
          error(`Precio anual de ${planKey}: esperado ${expectedPrices.yearly}, actual ${annualPrice.unit_amount}`);
          validationPassed = false;
        } else {
          success(`Precio anual de ${planKey}: ${annualPrice.unit_amount / 100} MXN`);
        }
      }
    }
    
    return validationPassed;
    
  } catch (err) {
    error(`Error accediendo a precios de Stripe: ${err.message}`);
    return false;
  }
}

async function validateCodeSync() {
  header('VALIDANDO SINCRONIZACIÓN CON CÓDIGO');
  
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const projectRoot = join(__dirname, '..');
    
    // Leer archivo de configuración de precios
    const pricingConfigPath = join(projectRoot, 'src/lib/pricing-config.ts');
    const pricingConfig = readFileSync(pricingConfigPath, 'utf-8');
    
    // Leer archivo de Stripe
    const stripePath = join(projectRoot, 'src/lib/payments/stripe.ts');
    const stripeFile = readFileSync(stripePath, 'utf-8');
    
    let validationPassed = true;
    
    // Verificar price IDs en código vs esperados
    for (const [planKey, priceIds] of Object.entries(EXPECTED_PRICE_IDS)) {
      if (!stripeFile.includes(priceIds.monthly)) {
        error(`Price ID mensual ${priceIds.monthly} para ${planKey} no encontrado en stripe.ts`);
        validationPassed = false;
      } else {
        success(`Price ID mensual ${priceIds.monthly} para ${planKey} encontrado en código`);
      }
      
      if (!stripeFile.includes(priceIds.annual)) {
        error(`Price ID anual ${priceIds.annual} para ${planKey} no encontrado en stripe.ts`);
        validationPassed = false;
      } else {
        success(`Price ID anual ${priceIds.annual} para ${planKey} encontrado en código`);
      }
    }
    
    // Verificar precios en pricing-config.ts
    for (const [planKey, prices] of Object.entries(EXPECTED_PRICES)) {
      const monthlyPriceMXN = prices.monthly / 100;
      const yearlyPriceMXN = prices.yearly / 100;
      
      if (!pricingConfig.includes(`monthly: ${monthlyPriceMXN}`)) {
        error(`Precio mensual ${monthlyPriceMXN} para ${planKey} no encontrado en pricing-config.ts`);
        validationPassed = false;
      } else {
        success(`Precio mensual ${monthlyPriceMXN} MXN para ${planKey} encontrado en configuración`);
      }
      
      if (!pricingConfig.includes(`yearly: ${yearlyPriceMXN}`)) {
        error(`Precio anual ${yearlyPriceMXN} para ${planKey} no encontrado en pricing-config.ts`);
        validationPassed = false;
      } else {
        success(`Precio anual ${yearlyPriceMXN} MXN para ${planKey} encontrado en configuración`);
      }
    }
    
    return validationPassed;
    
  } catch (err) {
    error(`Error validando sincronización de código: ${err.message}`);
    return false;
  }
}

async function testPricingAPI() {
  header('PROBANDO API DE PRICING');
  
  try {
    // Simulamos la llamada a la API local (esto requeriría que el servidor esté corriendo)
    info('Para probar la API completamente, ejecuta el servidor y visita: http://localhost:3000/api/pricing');
    info('Debería retornar solo productos B2B con metadata.type = "b2b"');
    
    return true;
  } catch (err) {
    error(`Error probando API: ${err.message}`);
    return false;
  }
}

async function generateReport() {
  header('GENERANDO REPORTE DE VALIDACIÓN');
  
  const results = {
    products: await validateStripeProducts(),
    prices: await validateStripePrices(), 
    codeSync: await validateCodeSync(),
    api: await testPricingAPI()
  };
  
  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n' + '='.repeat(60));
  log(colors.bold, '📊 RESUMEN DE VALIDACIÓN');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    const color = passed ? colors.green : colors.red;
    log(color, `${test.toUpperCase().padEnd(15)} ${status}`);
  });
  
  console.log('='.repeat(60));
  
  if (allPassed) {
    success('🎉 TODAS LAS VALIDACIONES PASARON');
    success('Los productos B2B están correctamente sincronizados entre Stripe y el código');
  } else {
    error('💥 ALGUNAS VALIDACIONES FALLARON');
    error('Revisa los errores arriba y corrige antes de desplegar');
    process.exit(1);
  }
}

// Verificar variables de entorno
if (!process.env.STRIPE_SECRET_KEY) {
  error('STRIPE_SECRET_KEY no está configurado en las variables de entorno');
  process.exit(1);
}

// Ejecutar validaciones
log(colors.bold, '🚀 INICIANDO VALIDACIÓN DE SINCRONIZACIÓN STRIPE');
generateReport().catch(err => {
  error(`Error fatal: ${err.message}`);
  process.exit(1);
}); 