#!/usr/bin/env node

/**
 * Vercel Environment Variables Exporter for Vetify
 * 
 * This script reads your .env.local file and generates the exact variables
 * you need to configure in Vercel Dashboard for deployment.
 */

import fs from 'fs';

const ENV_FILE = '.env.local';

/**
 * Read and parse environment file
 */
function readEnvFile() {
  try {
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const lines = content.split('\n');
    const env = {};
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return env;
  } catch (error) {
    console.error('❌ Error reading .env.local file:', error.message);
    process.exit(1);
  }
}

/**
 * Variables that should be configured in Vercel
 */
const VERCEL_VARIABLES = [
  // Database
  'DATABASE_URL',
  'DIRECT_URL',
  
  // Kinde Authentication
  'KINDE_CLIENT_ID',
  'KINDE_CLIENT_SECRET',
  'KINDE_ISSUER_URL',
  'KINDE_SITE_URL',
  'KINDE_POST_LOGOUT_REDIRECT_URL',
  'KINDE_POST_LOGIN_REDIRECT_URL',
  
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  
  // N8N Integration
  'N8N_WEBHOOK_URL',
  'N8N_API_KEY',
  'NEXT_PUBLIC_N8N_WEBHOOK_URL',
  
  // WhatsApp Business API
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
  'WHATSAPP_DEBUG_MODE',
  
  // Facebook/Meta
  'FACEBOOK_APP_ID',
  'FACEBOOK_APP_SECRET',
  
  // App URLs
  'VETIFY_API_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_BASE_URL'
];

/**
 * Generate Vercel environment configuration
 */
function generateVercelConfig(environment = 'development') {
  const env = readEnvFile();
  
  console.log('🚀 Vercel Environment Variables Configuration');
  console.log('===========================================');
  console.log(`📍 Environment: ${environment.toUpperCase()}`);
  console.log('');
  
  // Determine the correct URLs based on environment
  const baseUrl = environment === 'production' 
    ? 'https://vetify.pro' 
    : 'https://development.vetify.pro';
  
  console.log('📋 Copy these variables to Vercel Dashboard:');
  console.log('   Settings → Environment Variables');
  console.log('');
  
  const missingVars = [];
  const configuredVars = [];
  
  VERCEL_VARIABLES.forEach(key => {
    let value = env[key];
    
    // Override URLs for the target environment
    if (key === 'KINDE_SITE_URL') {
      value = baseUrl;
    } else if (key === 'KINDE_POST_LOGOUT_REDIRECT_URL') {
      value = baseUrl;
    } else if (key === 'KINDE_POST_LOGIN_REDIRECT_URL') {
      value = `${baseUrl}/dashboard`;
    } else if (key === 'VETIFY_API_URL') {
      value = baseUrl;
    } else if (key === 'NEXT_PUBLIC_APP_URL') {
      value = baseUrl;
    } else if (key === 'NEXT_PUBLIC_BASE_URL') {
      value = baseUrl;
    } else if (key === 'NEXT_PUBLIC_N8N_WEBHOOK_URL') {
      // Use the production N8N URL for both environments
      value = 'https://n8n.alanis.dev/webhook-test/pet-welcome';
    }
    
    if (value) {
      configuredVars.push({ key, value });
      console.log(`✅ ${key}`);
      console.log(`   Value: ${value}`);
      console.log('');
    } else {
      missingVars.push(key);
      console.log(`❌ ${key} - NOT SET IN .env.local`);
      console.log('');
    }
  });
  
  console.log('📊 Summary:');
  console.log(`   ✅ Configured: ${configuredVars.length} variables`);
  console.log(`   ❌ Missing: ${missingVars.length} variables`);
  
  if (missingVars.length > 0) {
    console.log('');
    console.log('⚠️  Missing variables:');
    missingVars.forEach(key => {
      console.log(`   - ${key}`);
    });
  }
  
  console.log('');
  console.log('🎯 Environment Settings in Vercel:');
  console.log('   - Production: Check this for production deployment');
  console.log('   - Preview: Check this for preview deployments');
  console.log('   - Development: Usually not needed for Vercel');
  
  return { configuredVars, missingVars };
}

/**
 * Generate a .env format for easy copying
 */
function generateEnvFormat(environment = 'development') {
  const env = readEnvFile();
  
  const baseUrl = environment === 'production' 
    ? 'https://vetify.pro' 
    : 'https://development.vetify.pro';
  
  console.log('');
  console.log('📄 .env Format (for reference):');
  console.log('================================');
  
  VERCEL_VARIABLES.forEach(key => {
    let value = env[key];
    
    // Override URLs for the target environment
    if (key === 'KINDE_SITE_URL') {
      value = baseUrl;
    } else if (key === 'KINDE_POST_LOGOUT_REDIRECT_URL') {
      value = baseUrl;
    } else if (key === 'KINDE_POST_LOGIN_REDIRECT_URL') {
      value = `${baseUrl}/dashboard`;
    } else if (key === 'VETIFY_API_URL') {
      value = baseUrl;
    } else if (key === 'NEXT_PUBLIC_APP_URL') {
      value = baseUrl;
    } else if (key === 'NEXT_PUBLIC_BASE_URL') {
      value = baseUrl;
    } else if (key === 'NEXT_PUBLIC_N8N_WEBHOOK_URL') {
      // Use the production N8N URL for both environments
      value = 'https://n8n.alanis.dev/webhook-test/pet-welcome';
    }
    
    if (value) {
      console.log(`${key}=${value}`);
    }
  });
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'development';
  
  switch (command) {
    case 'production':
    case 'prod':
      generateVercelConfig('production');
      generateEnvFormat('production');
      break;
      
    case 'development':
    case 'dev':
      generateVercelConfig('development');
      generateEnvFormat('development');
      break;
      
    case 'help':
    case '--help':
    case '-h':
      console.log('🚀 Vercel Environment Variables Exporter');
      console.log('========================================');
      console.log('');
      console.log('Usage:');
      console.log('  node scripts/vercel-env-export.mjs [environment]');
      console.log('  pnpm vercel:env [environment]');
      console.log('');
      console.log('Environments:');
      console.log('  development  Generate variables for development.vetify.pro (default)');
      console.log('  production   Generate variables for vetify.pro');
      console.log('');
      console.log('Examples:');
      console.log('  pnpm vercel:env development');
      console.log('  pnpm vercel:env production');
      break;
      
    default:
      generateVercelConfig(command);
      generateEnvFormat(command);
      break;
  }
}

// Run the script
main(); 