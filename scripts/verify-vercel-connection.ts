#!/usr/bin/env tsx

/**
 * 🔍 Vercel Database Connection Verification Script
 *
 * This script helps verify that your database connection is properly configured
 * for Vercel deployments. It checks:
 * - Connection string format
 * - Database connectivity
 * - Supabase authentication
 * - Connection pooling settings
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green');
}

function logError(message: string) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'blue');
}

function logHeader(message: string) {
  log(`\n${colors.bold}${colors.cyan}🔍 ${message}${colors.reset}\n`);
}

interface ConnectionCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

async function verifyConnection(): Promise<void> {
  logHeader('VERCEL DATABASE CONNECTION VERIFICATION');

  const checks: ConnectionCheck[] = [];

  // Check 1: DATABASE_URL exists
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    checks.push({
      name: 'DATABASE_URL',
      status: 'fail',
      message: 'DATABASE_URL environment variable is not set'
    });
  } else {
    checks.push({
      name: 'DATABASE_URL',
      status: 'pass',
      message: 'DATABASE_URL is set'
    });
  }

  // Check 2: Connection string format
  if (databaseUrl) {
    if (databaseUrl.includes('YOUR_SERVICE_ROLE_KEY_HERE') ||
        databaseUrl.includes('YOUR_') ||
        databaseUrl.includes('PLACEHOLDER')) {
      checks.push({
        name: 'Placeholder Detection',
        status: 'fail',
        message: 'Connection string contains placeholder values (YOUR_*_HERE)'
      });
    } else {
      checks.push({
        name: 'Placeholder Detection',
        status: 'pass',
        message: 'No placeholder values detected'
      });
    }

    // Check for Supabase connection pooling
    if (databaseUrl.includes('pgbouncer=true')) {
      checks.push({
        name: 'Connection Pooling',
        status: 'pass',
        message: 'PgBouncer connection pooling is enabled'
      });
    } else {
      checks.push({
        name: 'Connection Pooling',
        status: 'warning',
        message: 'Connection pooling not detected (recommended for Vercel)'
      });
    }

    // Check for connection limit
    if (databaseUrl.includes('connection_limit=')) {
      checks.push({
        name: 'Connection Limit',
        status: 'pass',
        message: 'Connection limit is configured'
      });
    } else {
      checks.push({
        name: 'Connection Limit',
        status: 'warning',
        message: 'No connection limit set (may cause connection exhaustion)'
      });
    }
  }

  // Check 3: DIRECT_URL exists
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    checks.push({
      name: 'DIRECT_URL',
      status: 'warning',
      message: 'DIRECT_URL not set (needed for migrations)'
    });
  } else {
    checks.push({
      name: 'DIRECT_URL',
      status: 'pass',
      message: 'DIRECT_URL is set'
    });
  }

  // Check 4: Test database connection
  if (databaseUrl && !databaseUrl.includes('YOUR_')) {
    try {
      logInfo('Testing database connection...');
      const prisma = new PrismaClient();

      // Try a simple query
      await prisma.$queryRaw`SELECT 1 as test`;

      checks.push({
        name: 'Database Connection',
        status: 'pass',
        message: 'Successfully connected to database'
      });

      // Check if we can query the User table
      const userCount = await prisma.user.count();
      checks.push({
        name: 'User Table Access',
        status: 'pass',
        message: `Successfully queried User table (${userCount} users found)`
      });

      await prisma.$disconnect();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('Tenant or user not found')) {
        checks.push({
          name: 'Database Connection',
          status: 'fail',
          message: 'FATAL: Invalid Supabase credentials (Tenant or user not found)'
        });
        checks.push({
          name: 'Fix Required',
          status: 'fail',
          message: 'Update Vercel environment variables with actual service role key'
        });
      } else {
        checks.push({
          name: 'Database Connection',
          status: 'fail',
          message: `Connection failed: ${errorMessage}`
        });
      }
    }
  }

  // Display results
  logHeader('VERIFICATION RESULTS');

  let hasFailures = false;
  let hasWarnings = false;

  for (const check of checks) {
    if (check.status === 'pass') {
      logSuccess(`${check.name}: ${check.message}`);
    } else if (check.status === 'fail') {
      logError(`${check.name}: ${check.message}`);
      hasFailures = true;
    } else {
      logWarning(`${check.name}: ${check.message}`);
      hasWarnings = true;
    }
  }

  // Summary
  logHeader('SUMMARY');

  if (hasFailures) {
    logError('❌ FAILED - Critical issues found');
    log('\n📋 Action Required:', 'cyan');
    log('1. Check VERCEL_FIX_GUIDE.md for detailed instructions', 'yellow');
    log('2. Update Vercel environment variables with actual Supabase service role key', 'yellow');
    log('3. Get key from: https://supabase.com/dashboard/project/rqxhmhplxeiprzprobdb/settings/api', 'yellow');
    log('4. Redeploy after updating environment variables\n', 'yellow');
    process.exit(1);
  } else if (hasWarnings) {
    logWarning('⚠️  PASSED WITH WARNINGS - Some optimizations recommended');
    log('\n📋 Recommendations:', 'cyan');
    log('- Consider enabling connection pooling for better Vercel performance', 'yellow');
    log('- Set DIRECT_URL for smoother migrations\n', 'yellow');
    process.exit(0);
  } else {
    logSuccess('✅ ALL CHECKS PASSED - Database connection is properly configured');
    log('\n🎉 Your database connection is ready for Vercel deployment!\n', 'green');
    process.exit(0);
  }
}

// Run verification
verifyConnection().catch(error => {
  logError(`Verification script failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
