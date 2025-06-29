#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

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

// Check environment variables
function checkEnvironmentVariables() {
  logHeader('Environment Variables Check');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'KINDE_CLIENT_ID',
    'KINDE_CLIENT_SECRET',
    'KINDE_ISSUER_URL',
    'KINDE_SITE_URL',
    'KINDE_POST_LOGOUT_REDIRECT_URL',
    'KINDE_POST_LOGIN_REDIRECT_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_APP_URL',
  ];

  const optionalEnvVars = [
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_ACCESS_TOKEN',
    'FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET',
    'N8N_WEBHOOK_URL',
    'N8N_API_KEY',
  ];

  let missingRequired = 0;
  let missingOptional = 0;

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      logSuccess(`${envVar} is set`);
    } else {
      logError(`${envVar} is missing (REQUIRED)`);
      missingRequired++;
    }
  }

  // Check optional variables
  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      logSuccess(`${envVar} is set`);
    } else {
      logWarning(`${envVar} is missing (OPTIONAL - some features may not work)`);
      missingOptional++;
    }
  }

  if (missingRequired > 0) {
    logError(`❌ ${missingRequired} required environment variables are missing!`);
    return false;
  } else {
    logSuccess(`✅ All required environment variables are set!`);
  }

  if (missingOptional > 0) {
    logWarning(`⚠️  ${missingOptional} optional environment variables are missing.`);
  }

  return true;
}

// Check database connection and schema
async function checkDatabase() {
  logHeader('Database Check');
  
  try {
    // Test database connection
    await prisma.$connect();
    logSuccess('Database connection successful');

    // Check if key tables exist and have data
    const checks = [
      { name: 'tenants', model: prisma.tenant },
      { name: 'users', model: prisma.user },
      { name: 'customers', model: prisma.customer },
      { name: 'pets', model: prisma.pet },
      { name: 'services', model: prisma.service },
      { name: 'staff', model: prisma.staff },
      { name: 'appointments', model: prisma.appointment },
      { name: 'inventoryItems', model: prisma.inventoryItem },
      { name: 'sales', model: prisma.sale },
    ];

    for (const check of checks) {
      try {
        const count = await check.model.count();
        logSuccess(`${check.name} table exists (${count} records)`);
      } catch (error) {
        logError(`${check.name} table check failed: ${error.message}`);
      }
    }

    // Check for system roles
    const roleCount = await prisma.role.count();
    if (roleCount > 0) {
      logSuccess(`System roles configured (${roleCount} roles)`);
    } else {
      logWarning('No system roles found - consider running role initialization');
    }

    return true;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return false;
  }
}

// Check file structure
function checkFileStructure() {
  logHeader('File Structure Check');
  
  const criticalPaths = [
    'src/app/dashboard',
    'src/app/api',
    'src/components',
    'src/lib',
    'prisma/schema.prisma',
    'package.json',
    'next.config.js',
    'tailwind.config.ts',
    'tsconfig.json',
  ];

  let allPathsExist = true;

  for (const filePath of criticalPaths) {
    if (fs.existsSync(filePath)) {
      logSuccess(`${filePath} exists`);
    } else {
      logError(`${filePath} is missing`);
      allPathsExist = false;
    }
  }

  // Check for new Phase 3 features
  const phase3Features = [
    'src/lib/treatment-reminders.ts',
    'src/lib/enhanced-settings.ts',
    'src/app/api/treatment-reminders',
    'src/app/api/settings/clinic',
    'src/app/api/settings/notifications',
    'src/app/api/settings/roles',
  ];

  logInfo('Phase 3 Features:');
  for (const feature of phase3Features) {
    if (fs.existsSync(feature)) {
      logSuccess(`${feature} implemented`);
    } else {
      logWarning(`${feature} not found`);
    }
  }

  return allPathsExist;
}

// Feature completeness check
async function checkFeatureCompleteness() {
  logHeader('Feature Completeness Check');
  
  const features = [
    {
      name: 'Customer Management',
      check: () => fs.existsSync('src/app/dashboard/customers/page.tsx'),
    },
    {
      name: 'Pet Management',
      check: () => fs.existsSync('src/app/dashboard/pets/page.tsx'),
    },
    {
      name: 'Appointment Scheduling',
      check: () => fs.existsSync('src/app/dashboard/appointments/page.tsx'),
    },
    {
      name: 'Medical History',
      check: () => fs.existsSync('src/app/dashboard/medical-history/page.tsx'),
    },
    {
      name: 'Inventory Management',
      check: () => fs.existsSync('src/app/dashboard/inventory/page.tsx'),
    },
    {
      name: 'Sales/POS System',
      check: () => fs.existsSync('src/app/dashboard/sales/page.tsx'),
    },
    {
      name: 'Cash Management',
      check: () => fs.existsSync('src/app/dashboard/caja/page.tsx'),
    },
    {
      name: 'Reports & Analytics',
      check: () => fs.existsSync('src/app/dashboard/reports/page.tsx'),
    },
    {
      name: 'Staff Management',
      check: () => fs.existsSync('src/lib/staff.ts'),
    },
    {
      name: 'Settings & Configuration',
      check: () => fs.existsSync('src/app/dashboard/settings/page.tsx'),
    },
    {
      name: 'Treatment Reminders',
      check: () => fs.existsSync('src/lib/treatment-reminders.ts'),
    },
    {
      name: 'Enhanced Settings',
      check: () => fs.existsSync('src/lib/enhanced-settings.ts'),
    },
    {
      name: 'Multi-tenant Support',
      check: () => fs.existsSync('src/lib/tenant.ts'),
    },
    {
      name: 'Authentication',
      check: () => fs.existsSync('src/lib/auth.ts'),
    },
    {
      name: 'Payment Processing',
      check: () => fs.existsSync('src/lib/stripe.ts'),
    },
    {
      name: 'WhatsApp Integration',
      check: () => fs.existsSync('src/lib/whatsapp.ts'),
    },
    {
      name: 'N8N Automation',
      check: () => fs.existsSync('src/lib/n8n.ts'),
    },
  ];

  let implementedFeatures = 0;
  const totalFeatures = features.length;

  for (const feature of features) {
    if (feature.check()) {
      logSuccess(`${feature.name} implemented`);
      implementedFeatures++;
    } else {
      logWarning(`${feature.name} not implemented`);
    }
  }

  const completionPercentage = Math.round((implementedFeatures / totalFeatures) * 100);
  
  if (completionPercentage >= 90) {
    logSuccess(`Feature completeness: ${completionPercentage}% (${implementedFeatures}/${totalFeatures})`);
  } else if (completionPercentage >= 80) {
    logWarning(`Feature completeness: ${completionPercentage}% (${implementedFeatures}/${totalFeatures})`);
  } else {
    logError(`Feature completeness: ${completionPercentage}% (${implementedFeatures}/${totalFeatures})`);
  }

  return completionPercentage >= 80;
}

// Main checklist runner
async function runMVPLaunchChecklist() {
  log(`${colors.bold}${colors.magenta}
  ╔══════════════════════════════════════════════════════════════╗
  ║                     🚀 MVP LAUNCH CHECKLIST 🚀                ║
  ║                                                              ║
  ║  Comprehensive check of all Vetify MVP systems and features  ║
  ╚══════════════════════════════════════════════════════════════╝
  ${colors.reset}`);

  const checks = [
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Database', fn: checkDatabase },
    { name: 'File Structure', fn: checkFileStructure },
    { name: 'Feature Completeness', fn: checkFeatureCompleteness },
  ];

  const results = [];
  
  for (const check of checks) {
    try {
      const result = await check.fn();
      results.push({ name: check.name, passed: result });
    } catch (error) {
      logError(`${check.name} check failed: ${error.message}`);
      results.push({ name: check.name, passed: false });
    }
  }

  // Summary
  logHeader('MVP Launch Summary');
  
  const passedChecks = results.filter(r => r.passed).length;
  const totalChecks = results.length;
  const readinessPercentage = Math.round((passedChecks / totalChecks) * 100);

  for (const result of results) {
    if (result.passed) {
      logSuccess(`${result.name}: PASSED ✅`);
    } else {
      logError(`${result.name}: FAILED ❌`);
    }
  }

  log(`\n${colors.bold}${colors.cyan}=== FINAL ASSESSMENT ===${colors.reset}`);
  
  if (readinessPercentage >= 95) {
    logSuccess(`🎉 MVP IS READY FOR LAUNCH! (${readinessPercentage}%)`);
    logSuccess('🚀 All critical systems are operational');
    logSuccess('✨ You can proceed with production deployment');
  } else if (readinessPercentage >= 75) {
    logWarning(`⚠️  MVP IS MOSTLY READY (${readinessPercentage}%)`);
    logWarning('🔧 Address the failed checks before full launch');
    logWarning('🚀 Consider a soft launch with limited features');
  } else {
    logError(`❌ MVP IS NOT READY FOR LAUNCH (${readinessPercentage}%)`);
    logError('🛠️  Critical issues need to be resolved');
    logError('⏳ Continue development before attempting launch');
  }

  log(`\n${colors.bold}${colors.magenta}=== NEXT STEPS ===${colors.reset}`);
  log('1. Fix any failed checks above');
  log('2. Test the application manually in development');
  log('3. Deploy to staging environment');
  log('4. Run final production tests');
  log('5. Launch! 🚀');

  // Cleanup
  await prisma.$disconnect();
  
  process.exit(readinessPercentage >= 75 ? 0 : 1);
}

// Run the checklist
runMVPLaunchChecklist().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
}); 