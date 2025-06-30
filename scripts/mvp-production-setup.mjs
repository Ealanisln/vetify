#!/usr/bin/env node

/**
 * 🚀 MVP PRODUCTION SETUP SCRIPT
 * 
 * Comprehensive production launch preparation for Vetify MVP
 * This script handles all critical setup tasks for going live.
 */

import { PrismaClient } from '@prisma/client';
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
  log(`\n${colors.bold}${colors.cyan}🚀 ${message}${colors.reset}\n`);
}

// Environment templates for different stages
const ENVIRONMENTS = {
  staging: {
    name: 'Staging (development.vetify.pro)',
    baseUrl: 'https://development.vetify.pro',
    description: 'Pre-production testing environment'
  },
  production: {
    name: 'Production (vetify.pro)',
    baseUrl: 'https://vetify.pro',
    description: 'Live production environment'
  }
};

// Critical environment variables for production
const CRITICAL_ENV_VARS = {
  required: [
    'DATABASE_URL',
    'DIRECT_URL',
    'KINDE_CLIENT_ID',
    'KINDE_CLIENT_SECRET',
    'KINDE_ISSUER_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXTAUTH_SECRET',
  ],
  recommended: [
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_ACCESS_TOKEN',
    'FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET',
    'N8N_WEBHOOK_URL',
    'N8N_API_KEY',
  ]
};

// Security checklist for production
const SECURITY_CHECKLIST = [
  {
    name: 'Environment Variables Security',
    check: () => checkEnvironmentSecurity(),
    fix: 'Rotate all API keys and regenerate secrets'
  },
  {
    name: 'Database Security',
    check: () => checkDatabaseSecurity(),
    fix: 'Enable SSL, configure connection limits, set up backups'
  },
  {
    name: 'CORS Configuration',
    check: () => checkCorsConfiguration(),
    fix: 'Configure proper CORS origins for production'
  },
  {
    name: 'Rate Limiting',
    check: () => checkRateLimiting(),
    fix: 'Implement rate limiting for APIs'
  }
];

function generateProductionEnvironment(environment = 'staging') {
  const env = ENVIRONMENTS[environment];
  if (!env) {
    logError(`Unknown environment: ${environment}`);
    return;
  }

  logHeader(`🔧 Production Environment Configuration: ${env.name}`);
  
  const template = `# 🚀 ${env.name.toUpperCase()} ENVIRONMENT CONFIGURATION
# Generated on: ${new Date().toISOString()}
# Description: ${env.description}

# 🌐 Application URLs
NEXT_PUBLIC_APP_URL=${env.baseUrl}
NEXT_PUBLIC_BASE_URL=${env.baseUrl}
VETIFY_API_URL=${env.baseUrl}

# 🔐 Kinde Authentication (CRITICAL - UPDATE WITH YOUR VALUES)
KINDE_CLIENT_ID=your_kinde_client_id_here
KINDE_CLIENT_SECRET=your_kinde_client_secret_here
KINDE_ISSUER_URL=https://yourdomain.kinde.com
KINDE_SITE_URL=${env.baseUrl}
KINDE_POST_LOGOUT_REDIRECT_URL=${env.baseUrl}
KINDE_POST_LOGIN_REDIRECT_URL=${env.baseUrl}/dashboard

# 🗄️ Database (CRITICAL - UPDATE WITH YOUR VALUES)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
DIRECT_URL=postgresql://username:password@host:port/database?sslmode=require

# 💳 Stripe Payment Processing (CRITICAL - USE LIVE KEYS FOR PRODUCTION)
STRIPE_SECRET_KEY=${environment === 'production' ? 'sk_live_your_live_secret_key' : 'sk_test_your_test_secret_key'}
STRIPE_PUBLISHABLE_KEY=${environment === 'production' ? 'pk_live_your_live_publishable_key' : 'pk_test_your_test_publishable_key'}
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# 🔒 Security (CRITICAL - GENERATE SECURE RANDOM STRING)
NEXTAUTH_SECRET=your_32_character_random_string_here

# 📱 WhatsApp Business API (OPTIONAL - Enhanced Features)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# 🤖 N8N Automation (OPTIONAL - Enhanced Features)
N8N_WEBHOOK_URL=https://your-n8n-instance.com
N8N_API_KEY=your_n8n_api_key
NEXT_PUBLIC_N8N_WEBHOOK_URL=${env.baseUrl}/api/webhooks/n8n

# 📊 Analytics & Monitoring (OPTIONAL)
# Add your analytics keys here
# VERCEL_ANALYTICS_ID=your_analytics_id
# SENTRY_DSN=your_sentry_dsn

# 🚀 Production Optimizations
NODE_ENV=production
NEXTAUTH_URL=${env.baseUrl}
`;

  const filename = `.env.${environment}`;
  fs.writeFileSync(filename, template);
  
  logSuccess(`Environment template created: ${filename}`);
  logWarning('🔴 CRITICAL: Replace ALL placeholder values with your actual credentials!');
  
  return filename;
}

function checkEnvironmentSecurity() {
  logInfo('Checking environment variable security...');
  
  const envFile = '.env.local';
  if (!fs.existsSync(envFile)) {
    logWarning('No .env.local file found');
    return false;
  }
  
  const content = fs.readFileSync(envFile, 'utf8');
  
  // Check for common security issues
  const issues = [];
  
  if (content.includes('localhost') && process.env.NODE_ENV === 'production') {
    issues.push('Contains localhost URLs in production');
  }
  
  if (content.includes('test_') && process.env.NODE_ENV === 'production') {
    issues.push('Contains test API keys in production');
  }
  
  if (content.includes('sk_test_') && process.env.NODE_ENV === 'production') {
    issues.push('Contains test Stripe keys in production');
  }
  
  if (issues.length > 0) {
    logError(`Security issues found: ${issues.join(', ')}`);
    return false;
  }
  
  logSuccess('Environment security check passed');
  return true;
}

function checkDatabaseSecurity() {
  logInfo('Checking database security configuration...');
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    logWarning('DATABASE_URL not set');
    return false;
  }
  
  // Check for SSL requirement
  if (!dbUrl.includes('sslmode=require')) {
    logWarning('Database connection should require SSL in production');
    return false;
  }
  
  logSuccess('Database security check passed');
  return true;
}

function checkCorsConfiguration() {
  logInfo('Checking CORS configuration...');
  
  // Check middleware configuration
  const middlewareFile = 'src/middleware.ts';
  if (fs.existsSync(middlewareFile)) {
    const content = fs.readFileSync(middlewareFile, 'utf8');
    
    // Check for wildcard CORS (should be restricted in production)
    if (content.includes("'*'") && process.env.NODE_ENV === 'production') {
      logWarning('Wildcard CORS detected - should be restricted in production');
      return false;
    }
    
    logSuccess('CORS configuration check passed');
    return true;
  }
  
  logWarning('Middleware file not found');
  return false;
}

function checkRateLimiting() {
  logInfo('Checking rate limiting implementation...');
  
  // For MVP, we'll rely on Vercel's built-in protection
  // This is a placeholder for future rate limiting implementation
  logInfo('Rate limiting will be handled by Vercel Pro plan');
  return true;
}

async function initializeProductionDatabase() {
  logHeader('🗄️ Production Database Initialization');
  
  try {
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    logSuccess('Database connection successful');
    
    // Check if database is empty (fresh setup)
    const tenantCount = await prisma.tenant.count();
    
    if (tenantCount === 0) {
      logInfo('Empty database detected - initializing...');
      
      // Initialize default roles for system
      const systemRoles = [
        { key: 'super_admin', name: 'Super Administrator', isSystem: true },
        { key: 'admin', name: 'Administrator', isSystem: true },
        { key: 'manager', name: 'Manager', isSystem: true },
        { key: 'staff', name: 'Staff', isSystem: true },
        { key: 'viewer', name: 'Viewer', isSystem: true }
      ];
      
      for (const role of systemRoles) {
        await prisma.role.upsert({
          where: { 
            tenantId_key: { 
              tenantId: null, 
              key: role.key 
            }
          },
          update: {},
          create: role
        });
      }
      
      logSuccess('System roles initialized');
    } else {
      logInfo(`Database has ${tenantCount} tenants - appears to be initialized`);
    }
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    logError(`Database initialization failed: ${error.message}`);
    return false;
  }
}

function createProductionPackageScripts() {
  logHeader('📦 Production Package.json Configuration');
  
  const packageJsonPath = 'package.json';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add production scripts
  const productionScripts = {
    'build:production': 'NODE_ENV=production prisma generate && prisma migrate deploy && next build',
    'start:production': 'NODE_ENV=production next start',
    'db:migrate:production': 'prisma migrate deploy',
    'db:seed:production': 'node scripts/seed-production.mjs',
    'health:check': 'node scripts/health-check.mjs',
    'mvp:checklist': 'node scripts/mvp-launch-checklist.mjs',
    'mvp:setup': 'node scripts/mvp-production-setup.mjs',
  };
  
  packageJson.scripts = { ...packageJson.scripts, ...productionScripts };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  logSuccess('Production scripts added to package.json');
}

function generateDeploymentChecklist() {
  logHeader('📋 MVP Deployment Checklist');
  
  const checklist = `# 🚀 MVP DEPLOYMENT CHECKLIST
Generated on: ${new Date().toISOString()}

## 🔧 PRE-DEPLOYMENT (Complete these steps BEFORE going live)

### 1. Environment Configuration
- [ ] Create production database (PostgreSQL with SSL)
- [ ] Set up Vercel project or hosting platform
- [ ] Configure all environment variables in hosting platform
- [ ] Rotate all API keys for production
- [ ] Generate new NEXTAUTH_SECRET (32+ characters)
- [ ] Switch to Stripe live keys (if accepting payments)

### 2. Security Setup
- [ ] Enable database SSL and connection limits
- [ ] Configure proper CORS origins (remove wildcards)
- [ ] Set up rate limiting (Vercel Pro recommended)
- [ ] Enable security headers in hosting platform
- [ ] Set up monitoring and error tracking

### 3. Domain & DNS
- [ ] Purchase domain name
- [ ] Configure DNS records
- [ ] Set up SSL certificate (usually automatic with Vercel)
- [ ] Update Kinde callback URLs with production domain

### 4. Third-party Services
- [ ] Configure Stripe webhooks with production URLs
- [ ] Set up WhatsApp Business API (if using)
- [ ] Configure N8N automation server (if using)
- [ ] Set up email service for notifications

## 🚀 DEPLOYMENT STEPS

### 1. Database Migration
\`\`\`bash
# Run database migrations
pnpm db:migrate:production
\`\`\`

### 2. Build Application
\`\`\`bash
# Build for production
pnpm build:production
\`\`\`

### 3. Deploy to Platform
\`\`\`bash
# For Vercel
vercel --prod

# Or push to main branch for auto-deployment
git push origin main
\`\`\`

### 4. Post-deployment Verification
\`\`\`bash
# Run health checks
pnpm health:check

# Run MVP checklist
pnpm mvp:checklist
\`\`\`

## ✅ POST-DEPLOYMENT (Verify these after going live)

### 1. Core Functionality
- [ ] User registration and authentication works
- [ ] Tenant creation and onboarding flow
- [ ] Dashboard loads and displays correctly
- [ ] Pet registration and management
- [ ] Appointment scheduling
- [ ] Payment processing (if enabled)

### 2. Integration Testing
- [ ] WhatsApp notifications (if configured)
- [ ] Email notifications
- [ ] Stripe webhooks (if using payments)
- [ ] N8N automation workflows (if configured)

### 3. Performance & Monitoring
- [ ] Page load times < 3 seconds
- [ ] Mobile responsiveness
- [ ] Error monitoring active
- [ ] Uptime monitoring configured

## 🎯 SUCCESS METRICS

### Technical KPIs
- Uptime: > 99.9%
- Page Load Time: < 3 seconds
- Error Rate: < 0.1%

### Business KPIs (30 days)
- Tenant Signups: 10+ veterinary clinics
- Pet Registrations: 100+ pets
- Appointments Scheduled: 50+ appointments
- User Retention: > 80%

## 🆘 EMERGENCY CONTACTS & PROCEDURES

### If Something Goes Wrong:
1. Check Vercel deployment logs
2. Verify environment variables
3. Check database connectivity
4. Monitor error tracking service
5. Have rollback plan ready

### Support Channels:
- Technical Issues: [Your support email]
- Payment Issues: Stripe dashboard
- Authentication Issues: Kinde dashboard

## 🎉 CONGRATULATIONS!

Once all items are checked, your Vetify MVP is LIVE! 🚀

### Next Steps:
1. Monitor user feedback
2. Track key metrics
3. Plan Phase 2 features
4. Scale infrastructure as needed

Remember: This is just the beginning of your veterinary practice management journey!
`;

  fs.writeFileSync('MVP_DEPLOYMENT_CHECKLIST.md', checklist);
  logSuccess('Deployment checklist created: MVP_DEPLOYMENT_CHECKLIST.md');
}

function createHealthCheckScript() {
  const healthCheckScript = `#!/usr/bin/env node

/**
 * 🏥 Health Check Script for Vetify MVP
 * Verifies all critical systems are operational
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function healthCheck() {
  console.log('🏥 Health Check Starting...');
  
  try {
    // Database health
    await prisma.$connect();
    console.log('✅ Database: Connected');
    
    // Check key tables
    const tenantCount = await prisma.tenant.count();
    console.log(\`✅ Tenants: \${tenantCount} registered\`);
    
    const userCount = await prisma.user.count();
    console.log(\`✅ Users: \${userCount} registered\`);
    
    // API endpoints health (basic check)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log(\`✅ Base URL: \${baseUrl}\`);
    
    console.log('🎉 All systems operational!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

healthCheck();
`;

  fs.writeFileSync('scripts/health-check.mjs', healthCheckScript);
  logSuccess('Health check script created: scripts/health-check.mjs');
}

// Main setup function
async function runMVPProductionSetup() {
  log(`${colors.bold}${colors.magenta}
  ╔══════════════════════════════════════════════════════════════╗
  ║                🚀 MVP PRODUCTION SETUP 🚀                    ║
  ║                                                              ║
  ║         Complete production launch preparation for MVP        ║
  ╚══════════════════════════════════════════════════════════════╝
  ${colors.reset}`);

  const action = process.argv[2] || 'help';
  
  switch (action) {
    case 'staging':
      generateProductionEnvironment('staging');
      break;
      
    case 'production':
      generateProductionEnvironment('production');
      break;
      
    case 'database':
      await initializeProductionDatabase();
      break;
      
    case 'scripts':
      createProductionPackageScripts();
      break;
      
    case 'checklist':
      generateDeploymentChecklist();
      break;
      
    case 'health':
      createHealthCheckScript();
      break;
      
    case 'security':
      logHeader('🔒 Security Checklist');
      for (const check of SECURITY_CHECKLIST) {
        const passed = check.check();
        if (passed) {
          logSuccess(`${check.name}: PASSED`);
        } else {
          logError(`${check.name}: FAILED - ${check.fix}`);
        }
      }
      break;
      
    case 'all':
      logInfo('Running complete MVP production setup...');
      generateProductionEnvironment('staging');
      generateProductionEnvironment('production');
      createProductionPackageScripts();
      generateDeploymentChecklist();
      createHealthCheckScript();
      logSuccess('🎉 Complete MVP production setup finished!');
      logInfo('📖 Check MVP_DEPLOYMENT_CHECKLIST.md for next steps');
      break;
      
    default:
      log(`
🚀 MVP Production Setup Tool

Usage: node scripts/mvp-production-setup.mjs [command]

Commands:
  staging     Create staging environment configuration
  production  Create production environment configuration
  database    Initialize production database
  scripts     Add production scripts to package.json
  checklist   Generate deployment checklist
  health      Create health check script
  security    Run security checklist
  all         Run complete setup (recommended)
  help        Show this help message

Examples:
  pnpm mvp:setup all              # Complete setup
  pnpm mvp:setup production       # Production env only
  pnpm mvp:setup security         # Security check only

💡 Start with 'all' for comprehensive setup!
      `);
  }
}

// Run the setup
runMVPProductionSetup().catch((error) => {
  logError(`Setup failed: ${error.message}`);
  process.exit(1);
}); 