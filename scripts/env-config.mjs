#!/usr/bin/env node

/**
 * Environment Configuration Manager for Vetify
 * 
 * This script helps manage environment variables for different deployment targets:
 * - localhost:3000 (local development)
 * - development.vetify.pro (staging/development deployment)
 */

import fs from 'fs';

const ENV_FILE = '.env.local';
const BACKUP_FILE = '.env.local.backup';

// Environment configurations
const ENVIRONMENTS = {
  localhost: {
    name: 'Local Development (localhost:3000)',
    config: {
      KINDE_SITE_URL: 'http://localhost:3000',
      KINDE_POST_LOGOUT_REDIRECT_URL: 'http://localhost:3000',
      KINDE_POST_LOGIN_REDIRECT_URL: 'http://localhost:3000/dashboard',
      VETIFY_API_URL: 'http://localhost:3000',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
      NEXT_PUBLIC_N8N_WEBHOOK_URL: 'http://localhost:3000/api/webhooks/n8n'
    }
  },
  localip: {
    name: 'Local Development (192.168.1.4:3000) - Safari Compatible',
    config: {
      KINDE_SITE_URL: 'http://192.168.1.4:3000',
      KINDE_POST_LOGOUT_REDIRECT_URL: 'http://192.168.1.4:3000',
      KINDE_POST_LOGIN_REDIRECT_URL: 'http://192.168.1.4:3000/dashboard',
      VETIFY_API_URL: 'http://192.168.1.4:3000',
      NEXT_PUBLIC_APP_URL: 'http://192.168.1.4:3000',
      NEXT_PUBLIC_BASE_URL: 'http://192.168.1.4:3000',
      NEXT_PUBLIC_N8N_WEBHOOK_URL: 'http://192.168.1.4:3000/api/webhooks/n8n'
    }
  },
  development: {
    name: 'Development Deployment (development.vetify.pro)',
    config: {
      KINDE_SITE_URL: 'https://development.vetify.pro',
      KINDE_POST_LOGOUT_REDIRECT_URL: 'https://development.vetify.pro',
      KINDE_POST_LOGIN_REDIRECT_URL: 'https://development.vetify.pro/dashboard',
      VETIFY_API_URL: 'https://development.vetify.pro',
      NEXT_PUBLIC_APP_URL: 'https://development.vetify.pro',
      NEXT_PUBLIC_BASE_URL: 'https://development.vetify.pro',
      NEXT_PUBLIC_N8N_WEBHOOK_URL: 'https://n8n.alanis.dev/webhook-test/pet-welcome'
    }
  }
};

/**
 * Read current environment file
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
    
    return { content, env };
  } catch (error) {
    console.error('❌ Error reading .env.local file:', error.message);
    process.exit(1);
  }
}

/**
 * Write environment file with updated configuration
 */
function writeEnvFile(content, updates) {
  // Create backup
  fs.writeFileSync(BACKUP_FILE, content);
  console.log(`📋 Backup created: ${BACKUP_FILE}`);
  
  let updatedContent = content;
  
  // Update each configuration value
  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(updatedContent)) {
      updatedContent = updatedContent.replace(regex, `${key}=${value}`);
    } else {
      // Add new variable if it doesn't exist
      updatedContent += `\n${key}=${value}`;
    }
  });
  
  fs.writeFileSync(ENV_FILE, updatedContent);
  console.log(`✅ Environment file updated: ${ENV_FILE}`);
}

/**
 * Display current configuration
 */
function showCurrentConfig() {
  const { env } = readEnvFile();
  
  console.log('\n🔍 Current Environment Configuration:');
  console.log('=====================================');
  
  // Check which environment is currently configured
  const isLocalhost = env.KINDE_SITE_URL?.includes('localhost');
  const isLocalIP = env.KINDE_SITE_URL?.includes('192.168.1.4');
  const isDevelopment = env.KINDE_SITE_URL?.includes('development.vetify.pro');
  
  if (isLocalhost) {
    console.log('📍 Currently configured for: LOCAL DEVELOPMENT (localhost:3000)');
  } else if (isLocalIP) {
    console.log('📍 Currently configured for: LOCAL DEVELOPMENT (192.168.1.4:3000) - Safari Compatible');
  } else if (isDevelopment) {
    console.log('📍 Currently configured for: DEVELOPMENT DEPLOYMENT (development.vetify.pro)');
  } else {
    console.log('📍 Currently configured for: CUSTOM/UNKNOWN');
  }
  
  console.log('\nKinde Authentication URLs:');
  console.log(`  KINDE_SITE_URL: ${env.KINDE_SITE_URL || 'NOT SET'}`);
  console.log(`  KINDE_POST_LOGOUT_REDIRECT_URL: ${env.KINDE_POST_LOGOUT_REDIRECT_URL || 'NOT SET'}`);
  console.log(`  KINDE_POST_LOGIN_REDIRECT_URL: ${env.KINDE_POST_LOGIN_REDIRECT_URL || 'NOT SET'}`);
  
  console.log('\nApp URLs:');
  console.log(`  VETIFY_API_URL: ${env.VETIFY_API_URL || 'NOT SET'}`);
  console.log(`  NEXT_PUBLIC_APP_URL: ${env.NEXT_PUBLIC_APP_URL || 'NOT SET'}`);
  console.log(`  NEXT_PUBLIC_BASE_URL: ${env.NEXT_PUBLIC_BASE_URL || 'NOT SET'}`);
}

/**
 * Switch to specified environment
 */
function switchEnvironment(envName) {
  if (!ENVIRONMENTS[envName]) {
    console.error(`❌ Unknown environment: ${envName}`);
    console.log('Available environments:', Object.keys(ENVIRONMENTS).join(', '));
    process.exit(1);
  }
  
  const { content } = readEnvFile();
  const targetConfig = ENVIRONMENTS[envName];
  
  console.log(`\n🔄 Switching to: ${targetConfig.name}`);
  console.log('=====================================');
  
  writeEnvFile(content, targetConfig.config);
  
  console.log('\n✅ Environment switched successfully!');
  console.log('\nUpdated variables:');
  Object.entries(targetConfig.config).forEach(([key, value]) => {
    console.log(`  ${key}=${value}`);
  });
  
  console.log('\n💡 Remember to restart your development server for changes to take effect.');
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🚀 Vetify Environment Configuration Manager');
  console.log('==========================================');
  
  switch (command) {
    case 'show':
    case 'status':
      showCurrentConfig();
      break;
      
    case 'localhost':
    case 'local':
      switchEnvironment('localhost');
      break;
      
    case 'localip':
    case 'safari':
      switchEnvironment('localip');
      break;
      
    case 'development':
    case 'dev':
      switchEnvironment('development');
      break;
      
    case 'help':
    case '--help':
    case '-h':
      console.log('\nUsage:');
      console.log('  node scripts/env-config.mjs <command>');
      console.log('  # Or with pnpm (recommended for this project):');
      console.log('  pnpm env:<command>');
      console.log('\nCommands:');
      console.log('  show, status     Show current environment configuration');
      console.log('  localhost, local Switch to localhost:3000 configuration');
      console.log('  localip, safari  Switch to 192.168.1.4:3000 (Safari compatible)');
      console.log('  development, dev Switch to development.vetify.pro configuration');
      console.log('  help             Show this help message');
      console.log('\nExamples:');
      console.log('  pnpm env:show        # Show current configuration');
      console.log('  pnpm env:localhost   # Switch to localhost:3000');
      console.log('  pnpm env:localip     # Switch to 192.168.1.4:3000 (Safari fix)');
      console.log('  pnpm env:development # Switch to development.vetify.pro');
      break;
      
    default:
      console.log('\n❓ Unknown command. Use "help" to see available commands.');
      showCurrentConfig();
      break;
  }
}

// Run the script
main(); 