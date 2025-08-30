#!/usr/bin/env node

/**
 * 🚀 Custom Vercel Environment Variables Generator
 * 
 * This script generates custom environment variable files for Vercel deployment
 * with placeholder values for security
 */

import fs from 'fs';
import path from 'path';

// Configuration object with placeholder values
const SUPABASE_CONFIG = {
  projectRef: 'rqxhmhplxeiprzprobdb',
  region: 'us-east-1',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxeGhtaHBseGVpcHJ6cHJvYmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4OTExOTksImV4cCI6MjA1OTQ2NzE5OX0.MlOAoNMyU7E_OSCTBZRFJTNzdZv4IZsY6_0xVT-v9KI'
};

const KINDE_CONFIG = {
  clientId: '0db7d44f29414510b2539193d16311f9',
  clientSecret: 'dteQVIKpTe0VAuJK1kYRe9GSy4Flem9anclcNG1RFUPItAkwpaK',
  issuerUrl: 'https://alanisdev.kinde.com',
  siteUrl: 'https://vetify.pro'
};

const WHATSAPP_CONFIG = {
  phoneNumberId: '700928786427921',
  accessToken: 'YOUR_WHATSAPP_ACCESS_TOKEN_HERE',
  webhookVerifyToken: 'YOUR_WHATSAPP_WEBHOOK_VERIFY_TOKEN_HERE'
};

const FACEBOOK_CONFIG = {
  appId: '1130642095757374',
  appSecret: 'YOUR_FACEBOOK_APP_SECRET_HERE'
};

const N8N_CONFIG = {
  webhookUrl: 'https://n8n.alanis.dev',
  apiKey: 'YOUR_N8N_API_KEY_HERE'
};

/**
 * Generate the custom Vercel environment variables file
 */
function generateCustomVercelEnvFile() {
  const content = `# 🚀 COPY-PASTE FOR VERCEL DASHBOARD (NEW VARIABLES ONLY)
# Copy each line below to Vercel Dashboard → Settings → Environment Variables
# You already have: Sentry, Upstash, etc. - DON'T DELETE THOSE

# =============================================================================
# 🗄️ DATABASE (SUPABASE) - CRITICAL - ADD THESE
# =============================================================================

# OPTION 1: SERVICE ROLE KEY (RECOMMENDED for Vercel)
# Get from: Supabase Dashboard → Settings → API → service_role key
# This is NOT your database password - it's a special API key
DATABASE_URL=postgresql://postgres.${SUPABASE_CONFIG.projectRef}:YOUR_SERVICE_ROLE_KEY_HERE@aws-0-${SUPABASE_CONFIG.region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=0

DIRECT_URL=postgresql://postgres.${SUPABASE_CONFIG.projectRef}:YOUR_SERVICE_ROLE_KEY_HERE@aws-0-${SUPABASE_CONFIG.region}.pooler.supabase.com:5432/postgres?connection_limit=1&pool_timeout=0

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://${SUPABASE_CONFIG.projectRef}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_CONFIG.anonKey}

# =============================================================================
# 🔐 AUTHENTICATION (KINDE) - CRITICAL - ADD THESE
# =============================================================================

# Kinde
KINDE_CLIENT_ID=${KINDE_CONFIG.clientId}
KINDE_CLIENT_SECRET=${KINDE_CONFIG.clientSecret}
KINDE_ISSUER_URL=${KINDE_CONFIG.issuerUrl}
KINDE_SITE_URL=${KINDE_CONFIG.siteUrl}
KINDE_POST_LOGOUT_REDIRECT_URL=${KINDE_CONFIG.siteUrl}
KINDE_POST_LOGIN_REDIRECT_URL=${KINDE_CONFIG.siteUrl}/dashboard

# =============================================================================
# 💳 PAYMENT (STRIPE) - CRITICAL - ADD THESE
# =============================================================================

# Stripe (REPLACE with your actual keys)
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET_HERE

# =============================================================================
# 📱 WHATSAPP - IMPORTANT - ADD THESE
# =============================================================================

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=${WHATSAPP_CONFIG.phoneNumberId}
WHATSAPP_ACCESS_TOKEN=${WHATSAPP_CONFIG.accessToken}
WHATSAPP_WEBHOOK_VERIFY_TOKEN=${WHATSAPP_CONFIG.webhookVerifyToken}
WHATSAPP_DEBUG_MODE=false

# =============================================================================
# 📘 FACEBOOK - IMPORTANT - ADD THESE
# =============================================================================

# Facebook
FACEBOOK_APP_ID=${FACEBOOK_CONFIG.appId}
FACEBOOK_APP_SECRET=${FACEBOOK_CONFIG.appSecret}

# =============================================================================
# 🔄 N8N - IMPORTANT - ADD THESE
# =============================================================================

# N8N
N8N_WEBHOOK_URL=${N8N_CONFIG.webhookUrl}
N8N_API_KEY=${N8N_CONFIG.apiKey}
NEXT_PUBLIC_N8N_WEBHOOK_URL=${N8N_CONFIG.webhookUrl}/webhook-test/pet-welcome

# =============================================================================
# 🌐 APP URLs - CRITICAL - ADD THESE
# =============================================================================

# App URLs
VETIFY_API_URL=${KINDE_CONFIG.siteUrl}
NEXT_PUBLIC_APP_URL=${KINDE_CONFIG.siteUrl}
NEXT_PUBLIC_BASE_URL=${KINDE_CONFIG.siteUrl}

# =============================================================================
# 🚨 REMINDER
# =============================================================================
# ✅ KEEP your existing variables: Sentry, Upstash, etc.
# ✅ ADD these new variables for Vetify
# ✅ Mark ALL for Production and Preview environments
# ⚠️ IMPORTANT: Replace all YOUR_*_HERE placeholders with actual values
`;

  const outputPath = path.join(process.cwd(), 'VERCEL_ENV_CUSTOM_COPY_PASTE.txt');
  fs.writeFileSync(outputPath, content);
  console.log('✅ Generated VERCEL_ENV_CUSTOM_COPY_PASTE.txt');
}

/**
 * Main execution
 */
function main() {
  try {
    console.log('🚀 Generating custom Vercel environment variables...');
    
    generateCustomVercelEnvFile();
    
    console.log('✅ All files generated successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Copy the generated files to your Vercel dashboard');
    console.log('2. Replace all YOUR_*_HERE placeholders with actual values');
    console.log('3. Mark variables for Production and Preview environments');
    
  } catch (error) {
    console.error('❌ Error generating files:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
