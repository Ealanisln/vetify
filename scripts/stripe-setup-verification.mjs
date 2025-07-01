#!/usr/bin/env node

/**
 * Verificador de configuración de Stripe para Vetify
 * 
 * Este script verifica que todos los productos y precios estén
 * configurados correctamente en Stripe.
 */

import Stripe from 'stripe';

// Cargar variables de entorno desde .env.local
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

// IDs esperados según stripe-config.json
const EXPECTED_PRICES = {
  'price_1ReUmePwxz1bHxlHqTl0hRlY': { name: 'Plan Gratis', amount: 0 },
  'price_1ReUmfPwxz1bHxlHW0hxRpbS': { name: 'Plan Básico (Mensual)', amount: 44900 },
  'price_1ReUmgPwxz1bHxlHqPtryKmj': { name: 'Plan Básico (Anual)', amount: 34900 },
  'price_1ReUmhPwxz1bHxlHeIXwcnKA': { name: 'Plan Profesional (Mensual)', amount: 89900 },
  'price_1ReUmhPwxz1bHxlH0fWaKCKc': { name: 'Plan Profesional (Anual)', amount: 64900 }
};

async function verifyStripeSetup() {
  console.log('🔍 Verificando configuración de Stripe...\n');

  try {
    // Verificar variables de entorno
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('❌ STRIPE_SECRET_KEY no está configurada');
    }

    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') && !process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
      throw new Error('❌ STRIPE_SECRET_KEY no es válida');
    }

    console.log('✅ Variables de entorno configuradas correctamente');

    // Verificar conexión con Stripe
    await stripe.prices.list({ limit: 1 });
    console.log('✅ Conexión con Stripe establecida');

    // Verificar cada precio
    console.log('\n🔍 Verificando precios...');
    
    for (const [priceId, expectedData] of Object.entries(EXPECTED_PRICES)) {
      try {
        const price = await stripe.prices.retrieve(priceId);
        
        if (price.unit_amount === expectedData.amount) {
          console.log(`✅ ${expectedData.name}: $${(expectedData.amount / 100).toFixed(2)} MXN`);
        } else {
          console.log(`⚠️  ${expectedData.name}: Monto esperado $${(expectedData.amount / 100).toFixed(2)}, encontrado $${(price.unit_amount / 100).toFixed(2)}`);
        }
      } catch {
        console.log(`❌ ${expectedData.name}: Precio no encontrado (${priceId})`);
      }
    }

    // Verificar productos
    console.log('\n🔍 Verificando productos...');
    const products = await stripe.products.list({ limit: 10 });
    
    const expectedProducts = ['Plan Gratis Vetify', 'Plan Básico Vetify', 'Plan Profesional Vetify'];
    
    for (const expectedProduct of expectedProducts) {
      const found = products.data.find(p => p.name.includes(expectedProduct.split(' ')[1]));
      if (found) {
        console.log(`✅ ${found.name}`);
      } else {
        console.log(`❌ Producto no encontrado: ${expectedProduct}`);
      }
    }

    console.log('\n🎉 Verificación completada!');
    
    // Mostrar información adicional
    console.log('\n📋 Información adicional:');
    console.log(`🔑 Usando clave: ${process.env.STRIPE_SECRET_KEY.substring(0, 15)}...`);
    console.log(`🌎 Modo: ${process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'PRODUCCIÓN' : 'DESARROLLO'}`);

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    process.exit(1);
  }
}

// Ejecutar verificación
verifyStripeSetup(); 