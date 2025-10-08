#!/usr/bin/env node

/**
 * 🔗 SUPABASE CONNECTION STRINGS GENERATOR
 * 
 * This script generates the correct database connection strings for:
 * - Local development (VPS)
 * - Vercel production (Supabase)
 * 
 * Supabase has special connection rules for Vercel deployments.
 */

import fs from 'fs';
import path from 'path';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logHeader(message) {
  log(`\n${colors.bold}${colors.cyan}🔗 ${message}${colors.reset}\n`);
}

// Supabase project configuration
// IMPORTANT: Replace these placeholders with your actual Supabase credentials
const SUPABASE_CONFIG = {
  projectId: process.env.SUPABASE_PROJECT_ID || 'YOUR_SUPABASE_PROJECT_ID',
  projectRef: process.env.SUPABASE_PROJECT_REF || 'YOUR_SUPABASE_PROJECT_REF',
  region: process.env.SUPABASE_REGION || 'us-east-1',
  host: process.env.SUPABASE_HOST || 'db.YOUR_PROJECT_REF.supabase.co',
  port: 5432,
  database: 'postgres',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE'
};

// Connection string templates
const CONNECTION_TEMPLATES = {
  // For Vercel production - uses Supabase connection pooler
  vercel: {
    DATABASE_URL: `postgresql://postgres.${SUPABASE_CONFIG.projectRef}:${SUPABASE_CONFIG.serviceRoleKey}@aws-0-${SUPABASE_CONFIG.region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=0`,
    DIRECT_URL: `postgresql://postgres.${SUPABASE_CONFIG.projectRef}:${SUPABASE_CONFIG.serviceRoleKey}@aws-0-${SUPABASE_CONFIG.region}.pooler.supabase.com:5432/postgres?connection_limit=1&pool_timeout=0`
  },
  
  // For local development - direct connection to VPS
  // IMPORTANT: Replace with your actual database credentials
  local: {
    DATABASE_URL: process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres?sslmode=disable',
    DIRECT_URL: process.env.LOCAL_DIRECT_URL || 'postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres?sslmode=disable'
  }
};

async function generateConnectionStrings() {
  logHeader('SUPABASE CONNECTION STRINGS GENERATOR');
  
  try {
    // Check if we have the service role key
    if (SUPABASE_CONFIG.serviceRoleKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
      logWarning('⚠️  SERVICE ROLE KEY REQUIRED');
      logInfo('To get your service role key:');
      logInfo('1. Go to Supabase Dashboard');
      logInfo('2. Project Settings → API');
      logInfo('3. Copy the "service_role" key (NOT anon key)');
      logInfo('4. Update this script with the key');
      logInfo('');
      logInfo('For now, using placeholder values...');
    }
    
    // Generate .env files
    await generateEnvFiles();
    
    // Generate Vercel configuration
    await generateVercelConfig();
    
    // Generate connection summary
    await generateConnectionSummary();
    
    logHeader('CONNECTION STRINGS GENERATED SUCCESSFULLY');
    logSuccess('✅ .env.production created for Vercel');
    logSuccess('✅ .env.local created for development');
    logSuccess('✅ vercel.supabase.json created for Vercel config');
    logSuccess('✅ CONNECTION_SUMMARY.md created with all details');
    
  } catch (error) {
    logError('Failed to generate connection strings: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

async function generateEnvFiles() {
  // Generate .env.production for Vercel
  const productionEnv = `# Production Environment Variables for Vercel
# Generated automatically - DO NOT EDIT MANUALLY

# Database URLs for Supabase (Vercel Production)
DATABASE_URL=${CONNECTION_TEMPLATES.vercel.DATABASE_URL}
DIRECT_URL=${CONNECTION_TEMPLATES.vercel.DIRECT_URL}

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://${SUPABASE_CONFIG.projectRef}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_CONFIG.anonKey}

# Keep your existing environment variables below
# (Kinde, Stripe, WhatsApp, etc.)
`;

  // Generate .env.local for development
  const localEnv = `# Local Development Environment Variables
# Generated automatically - DO NOT EDIT MANUALLY

# Database URLs for VPS (Local Development)
DATABASE_URL=${CONNECTION_TEMPLATES.local.DATABASE_URL}
DIRECT_URL=${CONNECTION_TEMPLATES.local.DIRECT_URL}

# Supabase Configuration (for client-side)
NEXT_PUBLIC_SUPABASE_URL=https://${SUPABASE_CONFIG.projectRef}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_CONFIG.anonKey}

# Keep your existing environment variables below
# (Kinde, Stripe, WhatsApp, etc.)
`;

  // Write files
  fs.writeFileSync('.env.production', productionEnv);
  fs.writeFileSync('.env.local', localEnv);
  
  logSuccess('Environment files generated');
}

async function generateVercelConfig() {
  const vercelSupabaseConfig = {
    supabase: {
      projectId: SUPABASE_CONFIG.projectId,
      projectRef: SUPABASE_CONFIG.projectRef,
      region: SUPABASE_CONFIG.region,
      host: SUPABASE_CONFIG.host,
      database: SUPABASE_CONFIG.database,
      connectionStrings: {
        production: CONNECTION_TEMPLATES.vercel,
        development: CONNECTION_TEMPLATES.local
      },
      notes: {
        vercel: "Uses connection pooler for better performance and connection management",
        local: "Direct connection for development and debugging",
        important: "Never use DIRECT_URL in Vercel - it can cause connection issues"
      }
    }
  };
  
  fs.writeFileSync('vercel.supabase.json', JSON.stringify(vercelSupabaseConfig, null, 2));
  logSuccess('Vercel Supabase config generated');
}

async function generateConnectionSummary() {
  const summary = `# 🔗 SUPABASE CONNECTION STRINGS SUMMARY

## 📍 Project Information
- **Project ID**: ${SUPABASE_CONFIG.projectId}
- **Project Ref**: ${SUPABASE_CONFIG.projectRef}
- **Region**: ${SUPABASE_CONFIG.region}
- **Host**: ${SUPABASE_CONFIG.host}

## 🚀 Vercel Production (Supabase)
### DATABASE_URL
\`\`\`
${CONNECTION_TEMPLATES.vercel.DATABASE_URL}
\`\`\`

### DIRECT_URL
\`\`\`
${CONNECTION_TEMPLATES.vercel.DIRECT_URL}
\`\`\`

### Environment Variables for Vercel
\`\`\`bash
DATABASE_URL=${CONNECTION_TEMPLATES.vercel.DATABASE_URL}
DIRECT_URL=${CONNECTION_TEMPLATES.vercel.DIRECT_URL}
NEXT_PUBLIC_SUPABASE_URL=https://${SUPABASE_CONFIG.projectRef}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_CONFIG.anonKey}
\`\`\`

## 💻 Local Development (VPS)
### DATABASE_URL
\`\`\`
${CONNECTION_TEMPLATES.local.DATABASE_URL}
\`\`\`

### DIRECT_URL
\`\`\`
${CONNECTION_TEMPLATES.local.DIRECT_URL}
\`\`\`

## ⚠️ IMPORTANT NOTES

### For Vercel:
1. **Use DATABASE_URL** for Prisma operations
2. **Use DIRECT_URL** for migrations and direct connections
3. **Connection pooler** is automatically used
4. **SSL is enabled by default**

### For Local Development:
1. **Use VPS connection** for direct database access
2. **SSL is disabled** for local development
3. **Direct connection** for debugging and development

## 🔧 Configuration Steps

### 1. Update Vercel Environment Variables:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add the production DATABASE_URL and DIRECT_URL
3. Mark them for Production and Preview environments

### 2. Update Local Development:
1. Copy the local connection strings to your .env.local
2. Keep using your VPS for local development

### 3. Test Connections:
\`\`\`bash
# Test production connection
pnpm test:connection:production

# Test local connection  
pnpm test:connection:local
\`\`\`

## 🚨 Security Notes
- **Service Role Key**: Keep this secret and never expose in client-side code
- **Connection Pooling**: Vercel automatically uses Supabase's connection pooler
- **SSL**: Always enabled in production, can be disabled locally for development
`;

  fs.writeFileSync('CONNECTION_SUMMARY.md', summary);
  logSuccess('Connection summary generated');
}

// Run the script
generateConnectionStrings().catch(error => {
  logError('Script failed: ' + error.message);
  console.error(error);
  process.exit(1);
});
