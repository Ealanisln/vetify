#!/usr/bin/env node

// Script para configurar productos en Stripe Dashboard
// Ejecutar después de configurar las claves de Stripe

console.log('🚀 Configuración de Productos en Stripe');
console.log('');
console.log('Para completar la configuración:');
console.log('');
console.log('1. Ve a https://dashboard.stripe.com/products');
console.log('2. Crea estos productos:');
console.log('');
console.log('   📦 Plan Básico');
console.log('   💰 Precio: $449 MXN/mes, $349 MXN/año');
console.log('   🏷️  ID sugerido: basic_plan');
console.log('');
console.log('   📦 Plan Profesional');
console.log('   💰 Precio: $899 MXN/mes, $649 MXN/año');
console.log('   🏷️  ID sugerido: professional_plan');
console.log('');
console.log('   📦 Plan Empresarial');
console.log('   💰 Precio: $1,499 MXN/mes, $1,199 MXN/año');
console.log('   🏷️  ID sugerido: enterprise_plan');
console.log('');
console.log('3. Configura webhook:');
console.log('   URL: http://localhost:3000/api/stripe/webhook');
console.log('   Eventos: checkout.session.completed, customer.subscription.*');
console.log('');
console.log('4. Actualiza PricingPageEnhanced.tsx con los Price IDs reales');
