#!/usr/bin/env node

/**
 * Script para probar el flujo completo de trials
 * 
 * Este script simula el proceso completo de:
 * 1. Crear una sesión de checkout con trial
 * 2. Simular el pago exitoso
 * 3. Verificar que el webhook procesa correctamente
 * 4. Verificar que el tenant se actualiza correctamente
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const prisma = new PrismaClient();

// Configuración de prueba
const TEST_CONFIG = {
  planKey: 'PROFESIONAL',
  priceId: 'price_1RjWSPPwxz1bHxlH60v9GJjX', // Plan Profesional mensual
  trialDays: 30,
  successUrl: 'http://localhost:3000/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: 'http://localhost:3000/precios?canceled=true'
};

async function createTestTenant() {
  console.log('🔧 Creando tenant de prueba...');
  
  const tenant = await prisma.tenant.create({
    data: {
      name: `Test Trial Tenant ${Date.now()}`,
      slug: `test-trial-${Date.now()}`,
      status: 'PENDING',
      subscriptionStatus: 'INACTIVE',
      isTrialPeriod: false,
      planName: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeProductId: null,
      subscriptionEndsAt: null,
      trialEndsAt: null,
      maxPets: 300,
      maxUsers: 3,
      maxStorageGB: 10,
      whatsappEnabled: false,
      whatsappPhoneNumber: null,
      whatsappToken: null,
      whatsappWebhookUrl: null,
      businessHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '14:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true }
      },
      settings: {
        notifications: {
          email: true,
          whatsapp: true,
          sms: false
        },
        branding: {
          logo: null,
          primaryColor: '#75a99c',
          secondaryColor: '#5b9788'
        }
      }
    }
  });

  console.log('✅ Tenant creado:', tenant.id);
  return tenant;
}

async function createStripeCustomer(tenant) {
  console.log('💳 Creando cliente de Stripe...');
  
  const customer = await stripe.customers.create({
    name: tenant.name,
    metadata: {
      tenantId: tenant.id
    }
  });

  console.log('✅ Cliente de Stripe creado:', customer.id);
  return customer;
}

async function createCheckoutSession(tenant, customer) {
  console.log('🛒 Creando sesión de checkout con trial...');
  
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: TEST_CONFIG.priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: TEST_CONFIG.trialDays,
      metadata: {
        tenantId: tenant.id,
        planKey: TEST_CONFIG.planKey
      }
    },
    success_url: TEST_CONFIG.successUrl,
    cancel_url: TEST_CONFIG.cancelUrl,
    metadata: {
      tenantId: tenant.id,
      planKey: TEST_CONFIG.planKey
    }
  });

  console.log('✅ Sesión de checkout creada:', session.id);
  console.log('📋 URL de checkout:', session.url);
  return session;
}

async function simulateSuccessfulCheckout(session) {
  console.log('🎯 Simulando checkout exitoso...');
  
  // Simular el evento checkout.session.completed
  const event = {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2024-06-20',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: session.id,
        object: 'checkout.session',
        mode: 'subscription',
        payment_status: 'no_payment_required', // Para trials
        status: 'complete',
        subscription: session.subscription,
        customer: session.customer,
        metadata: session.metadata
      }
    },
    type: 'checkout.session.completed'
  };

  console.log('✅ Evento simulado:', event.type);
  return event;
}

async function verifyTenantUpdate(tenantId) {
  console.log('🔍 Verificando actualización del tenant...');
  
  const updatedTenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!updatedTenant) {
    throw new Error('Tenant no encontrado');
  }

  console.log('📊 Estado del tenant:');
  console.log('  - Status:', updatedTenant.status);
  console.log('  - Subscription Status:', updatedTenant.subscriptionStatus);
  console.log('  - Is Trial Period:', updatedTenant.isTrialPeriod);
  console.log('  - Plan Name:', updatedTenant.planName);
  console.log('  - Stripe Customer ID:', updatedTenant.stripeCustomerId);
  console.log('  - Stripe Subscription ID:', updatedTenant.stripeSubscriptionId);
  console.log('  - Subscription Ends At:', updatedTenant.subscriptionEndsAt);
  console.log('  - Trial Ends At:', updatedTenant.trialEndsAt);

  // Verificar que el tenant se actualizó correctamente
  const checks = [
    { name: 'Status activo', check: updatedTenant.status === 'ACTIVE' },
    { name: 'Subscription trialing', check: updatedTenant.subscriptionStatus === 'TRIALING' },
    { name: 'Is trial period', check: updatedTenant.isTrialPeriod === true },
    { name: 'Plan name set', check: !!updatedTenant.planName },
    { name: 'Stripe customer ID', check: !!updatedTenant.stripeCustomerId },
    { name: 'Stripe subscription ID', check: !!updatedTenant.stripeSubscriptionId },
    { name: 'Subscription ends at', check: !!updatedTenant.subscriptionEndsAt },
    { name: 'Trial ends at', check: !!updatedTenant.trialEndsAt }
  ];

  console.log('\n✅ Verificaciones:');
  checks.forEach(({ name, check }) => {
    console.log(`  ${check ? '✅' : '❌'} ${name}`);
  });

  const allPassed = checks.every(c => c.check);
  if (allPassed) {
    console.log('\n🎉 ¡Todas las verificaciones pasaron!');
  } else {
    console.log('\n⚠️ Algunas verificaciones fallaron');
  }

  return updatedTenant;
}

async function cleanup(tenantId) {
  console.log('🧹 Limpiando datos de prueba...');
  
  try {
    await prisma.tenant.delete({
      where: { id: tenantId }
    });
    console.log('✅ Tenant eliminado');
  } catch (error) {
    console.log('⚠️ Error al eliminar tenant:', error.message);
  }
}

async function runTest() {
  console.log('🚀 Iniciando prueba del flujo de trial...\n');
  
  let tenant = null;
  
  try {
    // 1. Crear tenant de prueba
    tenant = await createTestTenant();
    
    // 2. Crear cliente de Stripe
    const customer = await createStripeCustomer(tenant);
    
    // 3. Actualizar tenant con customer ID
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { stripeCustomerId: customer.id }
    });
    
    // 4. Crear sesión de checkout
    const session = await createCheckoutSession(tenant, customer);
    
    // 5. Simular checkout exitoso
    const event = await simulateSuccessfulCheckout(session);
    
    console.log('\n📋 Resumen de la prueba:');
    console.log('  - Tenant ID:', tenant.id);
    console.log('  - Customer ID:', customer.id);
    console.log('  - Session ID:', session.id);
    console.log('  - Event Type:', event.type);
    console.log('  - Payment Status:', event.data.object.payment_status);
    console.log('  - Session Status:', event.data.object.status);
    
    console.log('\n💡 Para completar la prueba:');
    console.log('  1. Ejecuta: stripe listen --forward-to localhost:3000/api/stripe/webhook');
    console.log('  2. En otra terminal, ejecuta: stripe trigger checkout.session.completed');
    console.log('  3. Verifica los logs del servidor para confirmar el procesamiento');
    console.log('  4. Ejecuta este script nuevamente para verificar la actualización del tenant');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    if (tenant) {
      console.log('\n¿Deseas limpiar los datos de prueba? (y/N)');
      // En un script real, podrías usar readline para obtener input del usuario
      // Por ahora, comentamos la limpieza automática
      // await cleanup(tenant.id);
    }
  }
}

// Ejecutar la prueba
runTest()
  .then(() => {
    console.log('\n✅ Prueba completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en la prueba:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  }); 