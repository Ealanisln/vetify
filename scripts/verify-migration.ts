#!/usr/bin/env tsx
/**
 * Migration Verification Script
 *
 * Verifies that the Supabase migration was successful by checking:
 * - All tables exist
 * - RLS is enabled
 * - Indexes are created
 * - Foreign keys are valid
 * - Data integrity
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

interface TestResults {
  totalTests: number;
  passed: number;
  failed: number;
  tests: Array<{
    name: string;
    result: VerificationResult;
  }>;
}

interface TableNameRow {
  table_name: string;
}

interface TableSecurityRow {
  tablename: string;
  rowsecurity: boolean;
}

interface ForeignKeyRow {
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

interface IndexRow {
  tablename: string;
  indexname: string;
  indexdef: string;
}

interface EnumTypeRow {
  typname: string;
}

interface FunctionRow {
  proname: string;
}

interface TriggerRow {
  trigger_name: string;
}

interface ConstraintRow {
  table_name: string;
  column_name: string;
}

interface CountRow {
  count: string;
}

const results: TestResults = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  tests: [],
};

async function runTest(name: string, testFn: () => Promise<VerificationResult>): Promise<void> {
  results.totalTests++;
  console.log(`\n🧪 ${name}...`);

  try {
    const result = await testFn();
    results.tests.push({ name, result });

    if (result.passed) {
      results.passed++;
      console.log(`  ✅ PASS: ${result.message}`);
      if (result.details) {
        console.log(`     Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    } else {
      results.failed++;
      console.log(`  ❌ FAIL: ${result.message}`);
      if (result.details) {
        console.log(`     Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    }
  } catch (error) {
    results.failed++;
    results.tests.push({
      name,
      result: {
        passed: false,
        message: `Test threw an error: ${error instanceof Error ? error.message : String(error)}`,
      },
    });
    console.log(`  ❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function verify() {
  console.log('🔍 Starting Migration Verification...\n');
  console.log('='.repeat(60));

  // Test 1: Check all expected tables exist
  await runTest('All expected tables exist', async () => {
    const expectedTables = [
      'Tenant',
      'Plan',
      'User',
      'Role',
      'UserRole',
      'Customer',
      'Staff',
      'Pet',
      'Service',
      'InventoryItem',
      'Appointment',
      'AppointmentRequest',
      'Reminder',
      'MedicalHistory',
      'TreatmentRecord',
      'TreatmentSchedule',
      'InventoryMovement',
      'Sale',
      'SaleItem',
      'CashDrawer',
      'CashTransaction',
      'SalePayment',
      'MedicalOrder',
      'Prescription',
      'TenantSettings',
      'BusinessHours',
      'TenantSubscription',
      'TenantInvitation',
      'TenantApiKey',
      'TenantUsageStats',
      'AutomationLog',
      'AdminAuditLog',
      'SetupToken',
      'TrialAccessLog',
    ];

    const result = await prisma.$queryRaw<TableNameRow[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name != '_prisma_migrations'
      ORDER BY table_name;
    `;

    const actualTables = result.map((r) => r.table_name);
    const missingTables = expectedTables.filter((t) => !actualTables.includes(t));

    return {
      passed: missingTables.length === 0,
      message:
        missingTables.length === 0
          ? `All ${expectedTables.length} tables found`
          : `Missing tables: ${missingTables.join(', ')}`,
      details: { found: actualTables.length, expected: expectedTables.length, missing: missingTables },
    };
  });

  // Test 2: Check RLS is enabled on all tables
  await runTest('Row Level Security enabled on all tables', async () => {
    const result = await prisma.$queryRaw<TableSecurityRow[]>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename != '_prisma_migrations'
      ORDER BY tablename;
    `;

    const tablesWithoutRLS = result.filter((r) => !r.rowsecurity).map((r) => r.tablename);

    return {
      passed: tablesWithoutRLS.length === 0,
      message:
        tablesWithoutRLS.length === 0
          ? `RLS enabled on all ${result.length} tables`
          : `RLS not enabled on: ${tablesWithoutRLS.join(', ')}`,
      details: { tablesWithRLS: result.length - tablesWithoutRLS.length, tablesWithoutRLS },
    };
  });

  // Test 3: Check foreign key constraints
  await runTest('Foreign key constraints are valid', async () => {
    const result = await prisma.$queryRaw<ForeignKeyRow[]>`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name;
    `;

    return {
      passed: result.length > 0,
      message: `Found ${result.length} foreign key constraints`,
      details: { totalConstraints: result.length },
    };
  });

  // Test 4: Check indexes are created
  await runTest('Required indexes are created', async () => {
    const result = await prisma.$queryRaw<IndexRow[]>`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename != '_prisma_migrations'
      ORDER BY tablename, indexname;
    `;

    const indexCount = result.length;
    const expectedMinIndexes = 50; // Adjust based on your schema

    return {
      passed: indexCount >= expectedMinIndexes,
      message: `Found ${indexCount} indexes (expected at least ${expectedMinIndexes})`,
      details: { totalIndexes: indexCount, expected: expectedMinIndexes },
    };
  });

  // Test 5: Check enum types exist
  await runTest('All enum types are created', async () => {
    const expectedEnums = [
      'PlanType',
      'TenantStatus',
      'SubscriptionStatus',
      'InviteStatus',
      'TreatmentType',
      'TreatmentStatus',
      'VaccinationStage',
      'DewormingType',
      'AppointmentStatus',
      'AppointmentRequestStatus',
      'ReminderType',
      'ReminderStatus',
      'InventoryCategory',
      'InventoryStatus',
      'MovementType',
      'MedicalOrderStatus',
      'DrawerStatus',
      'TransactionType',
      'PaymentMethod',
      'SaleStatus',
      'ServiceCategory',
      'AdminAction',
    ];

    const result = await prisma.$queryRaw<EnumTypeRow[]>`
      SELECT typname
      FROM pg_type
      WHERE typtype = 'e'
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ORDER BY typname;
    `;

    const actualEnums = result.map((r) => r.typname);
    const missingEnums = expectedEnums.filter((e) => !actualEnums.includes(e));

    return {
      passed: missingEnums.length === 0,
      message:
        missingEnums.length === 0
          ? `All ${expectedEnums.length} enum types found`
          : `Missing enums: ${missingEnums.join(', ')}`,
      details: { found: actualEnums.length, expected: expectedEnums.length, missing: missingEnums },
    };
  });

  // Test 6: Test RLS policy function exists
  await runTest('RLS helper function exists', async () => {
    const result = await prisma.$queryRaw<FunctionRow[]>`
      SELECT proname
      FROM pg_proc
      WHERE proname = 'user_tenant_id'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth');
    `;

    return {
      passed: result.length > 0,
      message: result.length > 0 ? 'auth.user_tenant_id() function exists' : 'Function not found',
    };
  });

  // Test 7: Check triggers are created
  await runTest('Update triggers are created', async () => {
    const result = await prisma.$queryRaw<TriggerRow[]>`
      SELECT DISTINCT trigger_name
      FROM information_schema.triggers
      WHERE event_object_schema = 'public'
        AND trigger_name LIKE '%updated_at%'
      ORDER BY trigger_name;
    `;

    const expectedMinTriggers = 15; // Adjust based on tables with updatedAt

    return {
      passed: result.length >= expectedMinTriggers,
      message: `Found ${result.length} update triggers (expected at least ${expectedMinTriggers})`,
      details: { totalTriggers: result.length },
    };
  });

  // Test 8: Test database connectivity and basic query
  await runTest('Database connectivity and query test', async () => {
    const tenantCount = await prisma.tenant.count();

    return {
      passed: true,
      message: `Successfully connected and queried database`,
      details: { tenantCount },
    };
  });

  // Test 9: Check unique constraints
  await runTest('Unique constraints are created', async () => {
    const result = await prisma.$queryRaw<ConstraintRow[]>`
      SELECT
        tc.table_name,
        kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `;

    return {
      passed: result.length > 0,
      message: `Found ${result.length} unique constraints`,
      details: { totalUniqueConstraints: result.length },
    };
  });

  // Test 10: Verify no orphaned records (example for Pet -> Customer)
  await runTest('No orphaned Pet records (referential integrity)', async () => {
    const result = await prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) as count
      FROM "Pet" p
      LEFT JOIN "Customer" c ON p."customerId" = c.id
      WHERE c.id IS NULL;
    `;

    const orphanedCount = parseInt(result[0].count);

    return {
      passed: orphanedCount === 0,
      message: orphanedCount === 0 ? 'No orphaned Pet records' : `Found ${orphanedCount} orphaned Pet records`,
      details: { orphanedRecords: orphanedCount },
    };
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Verification Summary:\n');
  console.log(`  Total Tests: ${results.totalTests}`);
  console.log(`  ✅ Passed: ${results.passed}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  console.log(`  Success Rate: ${((results.passed / results.totalTests) * 100).toFixed(1)}%`);

  console.log('\n' + '='.repeat(60));

  if (results.failed === 0) {
    console.log('\n🎉 All verification tests passed! Migration looks good.\n');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Please review the results above.\n');
    return false;
  }
}

// Run verification
verify()
  .then((success) => {
    prisma.$disconnect();
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Verification failed with error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
