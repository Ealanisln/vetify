#!/usr/bin/env node

/**
 * 🔒 PRODUCTION SECURITY FIX SCRIPT
 * 
 * This script fixes critical security issues identified by Supabase advisors
 * by enabling Row Level Security (RLS) on all tables before production deployment.
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
  log(`\n${colors.bold}${colors.cyan}🔒 ${message}${colors.reset}\n`);
}

// Tables that need RLS enabled
const TABLES_NEEDING_RLS = [
  'InventoryMovement',
  'Pet',
  'InventoryItem',
  'MedicalOrder',
  'Plan',
  'CashDrawer',
  'Staff',
  'SaleItem',
  'TreatmentRecord',
  'TenantInvitation',
  'Service',
  'TenantApiKey',
  'TenantSettings',
  'TenantUsageStats',
  'Sale',
  'Appointment',
  'Prescription',
  'CashTransaction',
  'Reminder',
  'MedicalHistory',
  'Tenant',
  'Role',
  'SalePayment',
  'TreatmentSchedule',
  'TenantSubscription',
  'User',
  'UserRole'
];

// SQL to enable RLS on all tables
const ENABLE_RLS_SQL = `
-- Enable RLS on all tables
ALTER TABLE "InventoryMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MedicalOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CashDrawer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SaleItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TreatmentRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantApiKey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantUsageStats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Prescription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CashTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reminder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MedicalHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SalePayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TreatmentSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserRole" ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for tenant isolation
-- These are basic policies - you may need to customize them based on your business logic

-- Tenant table - users can only see their own tenant
CREATE POLICY "Users can view own tenant" ON "Tenant"
    FOR SELECT USING (auth.uid() IN (
        SELECT "userId" FROM "UserRole" WHERE "tenantId" = "Tenant".id
    ));

-- User table - users can only see users in their own tenant
CREATE POLICY "Users can view users in own tenant" ON "User"
    FOR SELECT USING (id IN (
        SELECT "userId" FROM "UserRole" WHERE "tenantId" IN (
            SELECT "tenantId" FROM "UserRole" WHERE "userId" = auth.uid()
        )
    ));

-- UserRole table - users can only see roles in their own tenant
CREATE POLICY "Users can view roles in own tenant" ON "UserRole"
    FOR SELECT USING ("tenantId" IN (
        SELECT "tenantId" FROM "UserRole" WHERE "userId" = auth.uid()
    ));

-- Basic tenant isolation for other tables
-- You'll need to customize these based on your specific business requirements
`;

async function fixProductionSecurity() {
  logHeader('PRODUCTION SECURITY FIX STARTING');
  
  try {
    // Check if we're in production environment
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (nodeEnv !== 'production') {
      logWarning('⚠️  This script is designed for production environments');
      logWarning('   Current NODE_ENV: ' + nodeEnv);
      
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        rl.question('Do you want to continue anyway? (y/N): ', resolve);
      });
      rl.close();
      
      if (answer.toLowerCase() !== 'y') {
        logInfo('Script cancelled by user');
        process.exit(0);
      }
    }
    
    logInfo('🔍 Checking database connection...');
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    logSuccess('Database connection successful');
    
    // Create migration file
    const migrationName = `fix_production_security_${Date.now()}`;
    const migrationDir = path.join(process.cwd(), 'prisma', 'migrations', migrationName);
    const migrationFile = path.join(migrationDir, 'migration.sql');
    
    // Create migration directory
    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true });
    }
    
    // Write migration file
    fs.writeFileSync(migrationFile, ENABLE_RLS_SQL);
    logSuccess(`Migration file created: ${migrationFile}`);
    
    // Create migration.toml
    const migrationToml = path.join(migrationDir, 'migration.toml');
    const tomlContent = `# This is an automatically generated migration file.
# Please review the SQL before applying to production.

migration_lock = "supabase"
`;
    fs.writeFileSync(migrationToml, tomlContent);
    
    logHeader('SECURITY FIX COMPLETED');
    logSuccess('✅ Migration file created successfully');
    logInfo('📁 Location: ' + migrationDir);
    logWarning('⚠️  IMPORTANT: Review the migration before applying to production');
    logInfo('🔧 To apply: pnpm db:migrate:production');
    
    // Close database connection
    await prisma.$disconnect();
    
  } catch (error) {
    logError('Failed to fix production security: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
fixProductionSecurity();
