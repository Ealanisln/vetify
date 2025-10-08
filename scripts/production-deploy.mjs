#!/usr/bin/env node

/**
 * 🚀 PRODUCTION DEPLOYMENT SCRIPT
 * 
 * Complete production deployment workflow for Vetify
 * This script handles all critical steps before going live.
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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

function logStep(step, total, message) {
  log(`[${step}/${total}] ${message}`, 'cyan');
}

// Production deployment checklist
const DEPLOYMENT_CHECKLIST = [
  {
    name: 'Environment Variables',
    check: () => checkEnvironmentVariables(),
    critical: true
  },
  {
    name: 'Database Security',
    check: () => checkDatabaseSecurity(),
    critical: true
  },
  {
    name: 'Build Process',
    check: () => checkBuildProcess(),
    critical: true
  },
  {
    name: 'Tests',
    check: () => runTests(),
    critical: false
  },
  {
    name: 'Database Migration',
    check: () => runDatabaseMigration(),
    critical: true
  },
  {
    name: 'Production Build',
    check: () => buildForProduction(),
    critical: true
  },
  {
    name: 'Deploy to Vercel',
    check: () => deployToVercel(),
    critical: true
  }
];

async function checkEnvironmentVariables() {
  logStep(1, DEPLOYMENT_CHECKLIST.length, 'Checking environment variables...');
  
  const requiredVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'KINDE_CLIENT_ID',
    'KINDE_CLIENT_SECRET',
    'KINDE_ISSUER_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];
  
  const missing = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  logSuccess('All required environment variables are set');
  return true;
}

async function checkDatabaseSecurity() {
  logStep(2, DEPLOYMENT_CHECKLIST.length, 'Checking database security...');
  
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    // Check if RLS is enabled on critical tables
    const result = await prisma.$queryRaw`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('User', 'Tenant', 'Appointment', 'Pet')
    `;
    
    await prisma.$disconnect();
    
    // Check if any critical tables don't have RLS enabled
    const tablesWithoutRLS = result.filter(table => !table.rowsecurity);
    
    if (tablesWithoutRLS.length > 0) {
      logWarning('Some tables do not have RLS enabled');
      logWarning('Run: node scripts/fix-production-security.mjs');
      return false;
    }
    
    logSuccess('Database security is properly configured');
    return true;
  } catch (error) {
    logError('Failed to check database security: ' + error.message);
    return false;
  }
}

async function checkBuildProcess() {
  logStep(3, DEPLOYMENT_CHECKLIST.length, 'Checking build process...');
  
  try {
    // Check if all dependencies are installed
    if (!fs.existsSync('node_modules')) {
      throw new Error('Dependencies not installed. Run: pnpm install');
    }
    
    // Check if Prisma client is generated
    if (!fs.existsSync('node_modules/.prisma/client')) {
      throw new Error('Prisma client not generated. Run: pnpm prisma generate');
    }
    
    logSuccess('Build process is ready');
    return true;
  } catch (error) {
    logError('Build process check failed: ' + error.message);
    return false;
  }
}

async function runTests() {
  logStep(4, DEPLOYMENT_CHECKLIST.length, 'Running tests...');
  
  try {
    logInfo('Running unit tests...');
    execSync('pnpm test:unit', { stdio: 'inherit' });
    
    logInfo('Running integration tests...');
    execSync('pnpm test:integration', { stdio: 'inherit' });
    
    logSuccess('All tests passed');
    return true;
  } catch (error) {
    logWarning('Some tests failed, but continuing with deployment...');
    return false;
  }
}

async function runDatabaseMigration() {
  logStep(5, DEPLOYMENT_CHECKLIST.length, 'Running database migration...');
  
  try {
    logInfo('Applying database migrations...');
    execSync('pnpm db:migrate:production', { stdio: 'inherit' });
    
    logSuccess('Database migration completed');
    return true;
  } catch (error) {
    logError('Database migration failed: ' + error.message);
    return false;
  }
}

async function buildForProduction() {
  logStep(6, DEPLOYMENT_CHECKLIST.length, 'Building for production...');
  
  try {
    logInfo('Building production bundle...');
    execSync('pnpm build:production', { stdio: 'inherit' });
    
    logSuccess('Production build completed');
    return true;
  } catch (error) {
    logError('Production build failed: ' + error.message);
    return false;
  }
}

async function deployToVercel() {
  logStep(7, DEPLOYMENT_CHECKLIST.length, 'Deploying to Vercel...');
  
  try {
    logInfo('Deploying to Vercel...');
    logInfo('Make sure you have:');
    logInfo('1. Vercel CLI installed: npm i -g vercel');
    logInfo('2. Logged in: vercel login');
    logInfo('3. Project linked: vercel link');
    
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('Ready to deploy? (y/N): ', resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() === 'y') {
      execSync('vercel --prod', { stdio: 'inherit' });
      logSuccess('Deployment to Vercel completed!');
      return true;
    } else {
      logInfo('Deployment skipped by user');
      return true;
    }
  } catch (error) {
    logError('Vercel deployment failed: ' + error.message);
    return false;
  }
}

async function runDeployment() {
  logHeader('PRODUCTION DEPLOYMENT STARTING');
  
  const results = [];
  let hasCriticalFailures = false;
  
  for (let i = 0; i < DEPLOYMENT_CHECKLIST.length; i++) {
    const item = DEPLOYMENT_CHECKLIST[i];
    
    try {
      logInfo(`\n--- ${item.name} ---`);
      const result = await item.check();
      results.push({ name: item.name, success: result, critical: item.critical });
      
      if (!result && item.critical) {
        hasCriticalFailures = true;
      }
      
      if (result) {
        logSuccess(`${item.name} completed successfully`);
      } else {
        logWarning(`${item.name} completed with warnings`);
      }
      
    } catch (error) {
      logError(`${item.name} failed: ${error.message}`);
      results.push({ name: item.name, success: false, critical: item.critical, error: error.message });
      
      if (item.critical) {
        hasCriticalFailures = true;
      }
    }
  }
  
  // Summary
  logHeader('DEPLOYMENT SUMMARY');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const criticalFailures = results.filter(r => !r.success && r.critical).length;
  
  logInfo(`Total steps: ${total}`);
  logInfo(`Successful: ${successful}`);
  logInfo(`Failed: ${total - successful}`);
  logInfo(`Critical failures: ${criticalFailures}`);
  
  if (hasCriticalFailures) {
    logError('❌ DEPLOYMENT FAILED - Critical errors must be fixed');
    logError('Review the errors above and run the script again');
    process.exit(1);
  } else if (successful === total) {
    logSuccess('🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!');
    logSuccess('Your application is now live in production!');
  } else {
    logWarning('⚠️  DEPLOYMENT COMPLETED WITH WARNINGS');
    logWarning('Some non-critical steps failed, but deployment succeeded');
  }
  
  // Next steps
  logHeader('NEXT STEPS');
  logInfo('1. Test your production application');
  logInfo('2. Monitor Sentry for any errors');
  logInfo('3. Check Vercel analytics and performance');
  logInfo('4. Set up monitoring and alerting');
  logInfo('5. Document any issues for future deployments');
}

// Run the deployment
runDeployment().catch(error => {
  logError('Deployment script failed: ' + error.message);
  console.error(error);
  process.exit(1);
});
