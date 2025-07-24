#!/usr/bin/env node

/**
 * Script para verificar el estado de la suscripción
 * 
 * Este script consulta el endpoint /api/user/subscription para obtener
 * información detallada sobre el estado de la suscripción del usuario
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function checkSubscriptionStatus() {
  console.log('🔍 Verificando estado de suscripción...\n');
  
  try {
    // Nota: En un entorno real, necesitarías autenticación
    // Este script es para testing local
    const response = await fetch(`${BASE_URL}/api/user/subscription`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // En un entorno real, necesitarías incluir el token de autenticación
        // 'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('⚠️ No autorizado - necesitas estar autenticado');
        console.log('💡 Ejecuta este script después de iniciar sesión en la aplicación');
        return;
      }
      
      const errorText = await response.text();
      console.error('❌ Error en la respuesta:', response.status, errorText);
      return;
    }

    const data = await response.json();
    
    console.log('📊 Estado de la Suscripción:');
    console.log('================================');
    
    // Información del tenant
    console.log('\n🏢 Tenant:');
    console.log(`  - ID: ${data.tenant.id}`);
    console.log(`  - Nombre: ${data.tenant.name}`);
    console.log(`  - Estado: ${data.tenant.status}`);
    
    // Información de la suscripción
    console.log('\n💳 Suscripción:');
    console.log(`  - Estado: ${data.subscription.status}`);
    console.log(`  - Plan: ${data.subscription.planName || 'No asignado'}`);
    console.log(`  - Es periodo de trial: ${data.subscription.isTrialPeriod ? 'Sí' : 'No'}`);
    
    if (data.subscription.trialDaysRemaining !== null) {
      console.log(`  - Días restantes de trial: ${data.subscription.trialDaysRemaining}`);
    }
    
    if (data.subscription.subscriptionDaysRemaining !== null) {
      console.log(`  - Días restantes de suscripción: ${data.subscription.subscriptionDaysRemaining}`);
    }
    
    if (data.subscription.endsAt) {
      console.log(`  - Termina el: ${new Date(data.subscription.endsAt).toLocaleDateString('es-MX')}`);
    }
    
    if (data.subscription.trialEndsAt) {
      console.log(`  - Trial termina el: ${new Date(data.subscription.trialEndsAt).toLocaleDateString('es-MX')}`);
    }
    
    // Información de Stripe
    console.log('\n🔗 Stripe:');
    console.log(`  - Customer ID: ${data.stripe.customerId || 'No asignado'}`);
    console.log(`  - Subscription ID: ${data.stripe.subscriptionId || 'No asignado'}`);
    console.log(`  - Product ID: ${data.stripe.productId || 'No asignado'}`);
    
    // Detalles adicionales de Stripe
    if (data.stripe.details) {
      console.log('\n📋 Detalles de Stripe:');
      console.log(`  - Status: ${data.stripe.details.status}`);
      console.log(`  - Periodo actual: ${new Date(data.stripe.details.currentPeriodStart).toLocaleDateString('es-MX')} - ${new Date(data.stripe.details.currentPeriodEnd).toLocaleDateString('es-MX')}`);
      
      if (data.stripe.details.trialStart && data.stripe.details.trialEnd) {
        console.log(`  - Trial: ${new Date(data.stripe.details.trialStart).toLocaleDateString('es-MX')} - ${new Date(data.stripe.details.trialEnd).toLocaleDateString('es-MX')}`);
      }
      
      console.log(`  - Cancelar al final del periodo: ${data.stripe.details.cancelAtPeriodEnd ? 'Sí' : 'No'}`);
      
      if (data.stripe.details.canceledAt) {
        console.log(`  - Cancelado el: ${new Date(data.stripe.details.canceledAt).toLocaleDateString('es-MX')}`);
      }
      
      if (data.stripe.details.items && data.stripe.details.items.length > 0) {
        console.log('\n📦 Items de suscripción:');
        data.stripe.details.items.forEach((item, index) => {
          console.log(`  ${index + 1}. Price ID: ${item.priceId}`);
          console.log(`     Cantidad: ${item.quantity}`);
          console.log(`     Intervalo: ${item.interval} (${item.intervalCount})`);
        });
      }
    }
    
    // Análisis del estado
    console.log('\n🔍 Análisis:');
    if (data.subscription.isTrialPeriod) {
      if (data.subscription.trialDaysRemaining > 0) {
        console.log(`  ✅ Trial activo - ${data.subscription.trialDaysRemaining} días restantes`);
      } else {
        console.log('  ⚠️ Trial expirado - necesita renovar');
      }
    } else if (data.subscription.status === 'ACTIVE') {
      console.log('  ✅ Suscripción activa');
    } else if (data.subscription.status === 'PAST_DUE') {
      console.log('  ⚠️ Pago vencido - necesita actualizar método de pago');
    } else if (data.subscription.status === 'CANCELED') {
      console.log('  ❌ Suscripción cancelada');
    } else {
      console.log(`  ❓ Estado desconocido: ${data.subscription.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error al verificar estado:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Asegúrate de que el servidor esté ejecutándose:');
      console.log('   pnpm dev');
    }
  }
}

// Función para verificar múltiples tenants (para testing)
async function checkMultipleTenants() {
  console.log('🔍 Verificando múltiples tenants...\n');
  
  // Esta función requeriría autenticación y acceso a múltiples tenants
  // Por ahora, solo mostramos la estructura
  console.log('💡 Para verificar múltiples tenants:');
  console.log('   1. Necesitas autenticación para cada tenant');
  console.log('   2. Puedes usar el endpoint con diferentes tokens de sesión');
  console.log('   3. O crear un endpoint admin para listar todos los tenants');
}

// Función para simular diferentes estados
function showExpectedStates() {
  console.log('\n📋 Estados esperados para trials:');
  console.log('================================');
  
  const states = [
    {
      name: 'Trial Recién Creado',
      subscription: {
        status: 'TRIALING',
        isTrialPeriod: true,
        trialDaysRemaining: 30,
        planName: 'Plan Profesional'
      }
    },
    {
      name: 'Trial por Terminar',
      subscription: {
        status: 'TRIALING',
        isTrialPeriod: true,
        trialDaysRemaining: 3,
        planName: 'Plan Profesional'
      }
    },
    {
      name: 'Suscripción Activa',
      subscription: {
        status: 'ACTIVE',
        isTrialPeriod: false,
        subscriptionDaysRemaining: 30,
        planName: 'Plan Profesional'
      }
    },
    {
      name: 'Pago Vencido',
      subscription: {
        status: 'PAST_DUE',
        isTrialPeriod: false,
        subscriptionDaysRemaining: -5,
        planName: 'Plan Profesional'
      }
    }
  ];
  
  states.forEach((state, index) => {
    console.log(`\n${index + 1}. ${state.name}:`);
    console.log(`   - Status: ${state.subscription.status}`);
    console.log(`   - Trial: ${state.subscription.isTrialPeriod ? 'Sí' : 'No'}`);
    if (state.subscription.trialDaysRemaining) {
      console.log(`   - Días trial: ${state.subscription.trialDaysRemaining}`);
    }
    if (state.subscription.subscriptionDaysRemaining) {
      console.log(`   - Días suscripción: ${state.subscription.subscriptionDaysRemaining}`);
    }
    console.log(`   - Plan: ${state.subscription.planName}`);
  });
}

// Ejecutar la verificación
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Uso: node check-subscription-status.mjs [opciones]');
    console.log('');
    console.log('Opciones:');
    console.log('  --help, -h     Mostrar esta ayuda');
    console.log('  --states       Mostrar estados esperados');
    console.log('  --multiple     Verificar múltiples tenants');
    console.log('');
    console.log('Ejemplos:');
    console.log('  node check-subscription-status.mjs');
    console.log('  node check-subscription-status.mjs --states');
    return;
  }
  
  if (args.includes('--states')) {
    showExpectedStates();
    return;
  }
  
  if (args.includes('--multiple')) {
    await checkMultipleTenants();
    return;
  }
  
  await checkSubscriptionStatus();
}

main()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en la verificación:', error);
    process.exit(1);
  }); 