#!/usr/bin/env node

import { existsSync } from 'fs';

const requiredKindeVars = [
  'KINDE_CLIENT_ID',
  'KINDE_CLIENT_SECRET', 
  'KINDE_ISSUER_URL',
  'KINDE_SITE_URL',
  'KINDE_POST_LOGOUT_REDIRECT_URL',
  'KINDE_POST_LOGIN_REDIRECT_URL'
];

console.log('🔍 DIAGNÓSTICO DE CONFIGURACIÓN KINDE');
console.log('=====================================\n');

// 1. Verificar variables de entorno
console.log('📋 Variables de entorno actuales:');
requiredKindeVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = value ? (varName.includes('SECRET') ? '***hidden***' : value) : 'NO CONFIGURADA';
  console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n' + '='.repeat(50) + '\n');

// 2. Detectar posibles problemas
console.log('🚨 PROBLEMAS DETECTADOS:');

const issuerUrl = process.env.KINDE_ISSUER_URL;
if (!issuerUrl) {
  console.log('❌ KINDE_ISSUER_URL no está configurada');
} else if (issuerUrl.includes('vetify.kinde.com') && !issuerUrl.includes('vetify-saas')) {
  console.log('⚠️  KINDE_ISSUER_URL parece usar el nombre antiguo "vetify"');
  console.log('   Actual:', issuerUrl);
  console.log('   Debería ser algo como: https://vetify-saas.kinde.com');
}

console.log('\n' + '='.repeat(50) + '\n');

// 3. Instrucciones para solucionarlo
console.log('🛠️  PASOS PARA SOLUCIONARLO:');
console.log('\n1. Ve a tu dashboard de Kinde (https://app.kinde.com)');
console.log('2. Selecciona tu aplicación "vetify-saas"');
console.log('3. Ve a Settings > Details');
console.log('4. Copia estos valores EXACTOS:\n');

console.log('   📋 KINDE_CLIENT_ID: [Copia desde "Client ID"]');
console.log('   📋 KINDE_CLIENT_SECRET: [Copia desde "Client secret"]');
console.log('   📋 KINDE_ISSUER_URL: [Copia desde "Issuer URL"]\n');

console.log('5. Verifica que las URLs de callback estén configuradas:');
console.log('   - Allowed callback URLs:');
console.log('     • http://localhost:3000/api/auth/kinde_callback');
console.log('     • https://development.vetify.pro/api/auth/kinde_callback');
console.log('     • https://vetify.pro/api/auth/kinde_callback');
console.log('   - Allowed logout redirect URLs:');
console.log('     • http://localhost:3000');
console.log('     • https://development.vetify.pro');
console.log('     • https://vetify.pro\n');

console.log('6. Actualiza tu archivo .env.local con los nuevos valores\n');

console.log('📝 EJEMPLO DE CONFIGURACIÓN CORRECTA:');
console.log('```');
console.log('KINDE_CLIENT_ID=tu_nuevo_client_id');
console.log('KINDE_CLIENT_SECRET=tu_nuevo_client_secret');
console.log('KINDE_ISSUER_URL=https://vetify-saas.kinde.com');
console.log('KINDE_SITE_URL=http://localhost:3000');
console.log('KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000');
console.log('KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000/dashboard');
console.log('```\n');

console.log('7. Reinicia tu servidor de desarrollo después de los cambios');
console.log('8. Limpia las cookies del navegador si persiste el error\n');

console.log('🔗 ENLACES ÚTILES:');
console.log('• Dashboard de Kinde: https://app.kinde.com');
console.log('• Documentación: https://kinde.com/docs/developer-tools/nextjs-sdk/\n');

// 4. Verificar archivos .env
console.log('📁 ARCHIVOS DE CONFIGURACIÓN ENCONTRADOS:');
const envFiles = ['.env.local', '.env', '.env.development', '.env.production'];
envFiles.forEach(file => {
  if (existsSync(file)) {
    console.log(`✅ ${file} existe`);
  } else {
    console.log(`❌ ${file} no encontrado`);
  }
});

console.log('\n' + '='.repeat(50) + '\n');
console.log('💡 CONSEJO: El error 1656 generalmente se soluciona actualizando');
console.log('   el KINDE_ISSUER_URL con la nueva URL de tu aplicación.\n'); 