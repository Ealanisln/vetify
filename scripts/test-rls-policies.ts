/**
 * RLS Policy Testing Script
 *
 * This script tests the Row Level Security (RLS) policies in the Supabase production database.
 * It verifies multi-tenant isolation and ensures users can only access their own tenant's data.
 *
 * Usage:
 *   pnpm tsx scripts/test-rls-policies.ts
 *
 * Prerequisites:
 *   - DATABASE_URL must point to Supabase production database
 *   - At least 2 tenants with data in the database
 */

import { PrismaClient } from '@prisma/client';
import { setRLSTenantId, clearRLSTenantId } from '../src/lib/prisma';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: string;
}

const results: TestResult[] = [];

/**
 * Run a test and record the result
 */
async function runTest(
  name: string,
  testFn: () => Promise<{ success: boolean; message: string; details?: string }>
) {
  console.log(`\n🧪 Testing: ${name}`);
  try {
    const result = await testFn();
    results.push({
      name,
      status: result.success ? 'PASS' : 'FAIL',
      message: result.message,
      details: result.details,
    });
    console.log(`   ${result.success ? '✅' : '❌'} ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${result.details}`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.push({
      name,
      status: 'FAIL',
      message: 'Test threw an error',
      details: errorMsg,
    });
    console.log(`   ❌ Test threw an error: ${errorMsg}`);
  }
}

/**
 * Test 1: Verify RLS is enabled on tenant-scoped tables
 */
async function testRLSEnabled() {
  return runTest('RLS is enabled on tenant-scoped tables', async () => {
    const result = await prisma.$queryRaw<{ tablename: string; rowsecurity: boolean }[]>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('Pet', 'Customer', 'Appointment', 'MedicalRecord', 'Invoice')
    `;

    const tablesWithoutRLS = result.filter(t => !t.rowsecurity);

    if (tablesWithoutRLS.length > 0) {
      return {
        success: false,
        message: 'Some tables do not have RLS enabled',
        details: `Tables without RLS: ${tablesWithoutRLS.map(t => t.tablename).join(', ')}`,
      };
    }

    return {
      success: true,
      message: `All ${result.length} checked tables have RLS enabled`,
    };
  });
}

/**
 * Test 2: Verify user_tenant_id() function exists and works
 */
async function testUserTenantIdFunction() {
  return runTest('user_tenant_id() function exists and works', async () => {
    try {
      // Set a test tenant ID
      await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', 'test-tenant-123', true)`;

      // Call the function
      const result = await prisma.$queryRaw<{ user_tenant_id: string }[]>`
        SELECT public.user_tenant_id() as user_tenant_id
      `;

      // Clear the config
      await clearRLSTenantId();

      if (result[0]?.user_tenant_id === 'test-tenant-123') {
        return {
          success: true,
          message: 'user_tenant_id() function works correctly',
        };
      }

      return {
        success: false,
        message: 'user_tenant_id() function returned unexpected value',
        details: `Expected: test-tenant-123, Got: ${result[0]?.user_tenant_id}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'user_tenant_id() function does not exist or threw an error',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  });
}

/**
 * Test 3: Verify multi-tenant isolation - users can only see their tenant's data
 */
async function testMultiTenantIsolation() {
  return runTest('Multi-tenant isolation works correctly', async () => {
    // Get two different tenants
    const tenants = await prisma.tenant.findMany({ take: 2 });

    if (tenants.length < 2) {
      return {
        success: false,
        message: 'Need at least 2 tenants to test isolation',
        details: `Found only ${tenants.length} tenant(s)`,
      };
    }

    const [tenant1, tenant2] = tenants;

    // Test with tenant 1
    await setRLSTenantId(tenant1.id);
    const pets1 = await prisma.pet.findMany();

    // Test with tenant 2
    await setRLSTenantId(tenant2.id);
    const pets2 = await prisma.pet.findMany();

    // Clear RLS context
    await clearRLSTenantId();

    // Verify that we get different results for each tenant
    const pets1Ids = new Set(pets1.map(p => p.id));
    const pets2Ids = new Set(pets2.map(p => p.id));
    const overlap = pets1.filter(p => pets2Ids.has(p.id));

    if (overlap.length > 0) {
      return {
        success: false,
        message: 'Multi-tenant isolation failed - data overlap detected',
        details: `Found ${overlap.length} pets visible to both tenants`,
      };
    }

    return {
      success: true,
      message: 'Multi-tenant isolation working correctly',
      details: `Tenant 1: ${pets1.length} pets, Tenant 2: ${pets2.length} pets, No overlap`,
    };
  });
}

/**
 * Test 4: Verify RLS policies exist for key tables
 */
async function testRLSPoliciesExist() {
  return runTest('RLS policies exist for key tables', async () => {
    const result = await prisma.$queryRaw<{ tablename: string; policyname: string }[]>`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ('Pet', 'Customer', 'Appointment', 'MedicalRecord', 'Invoice')
    `;

    const tablesWithPolicies = new Set(result.map(p => p.tablename));
    const requiredTables = ['Pet', 'Customer', 'Appointment', 'MedicalRecord', 'Invoice'];
    const missingPolicies = requiredTables.filter(t => !tablesWithPolicies.has(t));

    if (missingPolicies.length > 0) {
      return {
        success: false,
        message: 'Some tables are missing RLS policies',
        details: `Tables without policies: ${missingPolicies.join(', ')}`,
      };
    }

    return {
      success: true,
      message: `All ${requiredTables.length} key tables have RLS policies`,
      details: `Total policies: ${result.length}`,
    };
  });
}

/**
 * Test 5: Verify setRLSTenantId() works correctly
 */
async function testSetRLSTenantId() {
  return runTest('setRLSTenantId() function works correctly', async () => {
    const tenant = await prisma.tenant.findFirst();

    if (!tenant) {
      return {
        success: false,
        message: 'No tenant found to test with',
      };
    }

    // Set tenant ID
    await setRLSTenantId(tenant.id);

    // Verify it was set
    const result = await prisma.$queryRaw<{ current_setting: string }[]>`
      SELECT current_setting('app.current_tenant_id', true) as current_setting
    `;

    // Clear it
    await clearRLSTenantId();

    if (result[0]?.current_setting === tenant.id) {
      return {
        success: true,
        message: 'setRLSTenantId() works correctly',
      };
    }

    return {
      success: false,
      message: 'setRLSTenantId() did not set the correct value',
      details: `Expected: ${tenant.id}, Got: ${result[0]?.current_setting}`,
    };
  });
}

/**
 * Test 6: Verify customers are isolated by tenant
 */
async function testCustomerIsolation() {
  return runTest('Customer data isolation', async () => {
    const tenants = await prisma.tenant.findMany({ take: 2 });

    if (tenants.length < 2) {
      return {
        success: false,
        message: 'Need at least 2 tenants to test isolation',
      };
    }

    const [tenant1, tenant2] = tenants;

    // Get customers for tenant 1
    await setRLSTenantId(tenant1.id);
    const customers1 = await prisma.customer.findMany();

    // Get customers for tenant 2
    await setRLSTenantId(tenant2.id);
    const customers2 = await prisma.customer.findMany();

    await clearRLSTenantId();

    const customers1Ids = new Set(customers1.map(c => c.id));
    const overlap = customers2.filter(c => customers1Ids.has(c.id));

    if (overlap.length > 0) {
      return {
        success: false,
        message: 'Customer isolation failed',
        details: `Found ${overlap.length} customers visible to both tenants`,
      };
    }

    return {
      success: true,
      message: 'Customer data properly isolated',
      details: `Tenant 1: ${customers1.length}, Tenant 2: ${customers2.length}, No overlap`,
    };
  });
}

/**
 * Test 7: Verify appointments are isolated by tenant
 */
async function testAppointmentIsolation() {
  return runTest('Appointment data isolation', async () => {
    const tenants = await prisma.tenant.findMany({ take: 2 });

    if (tenants.length < 2) {
      return {
        success: false,
        message: 'Need at least 2 tenants to test isolation',
      };
    }

    const [tenant1, tenant2] = tenants;

    await setRLSTenantId(tenant1.id);
    const appointments1 = await prisma.appointment.findMany();

    await setRLSTenantId(tenant2.id);
    const appointments2 = await prisma.appointment.findMany();

    await clearRLSTenantId();

    const appts1Ids = new Set(appointments1.map(a => a.id));
    const overlap = appointments2.filter(a => appts1Ids.has(a.id));

    if (overlap.length > 0) {
      return {
        success: false,
        message: 'Appointment isolation failed',
        details: `Found ${overlap.length} appointments visible to both tenants`,
      };
    }

    return {
      success: true,
      message: 'Appointment data properly isolated',
      details: `Tenant 1: ${appointments1.length}, Tenant 2: ${appointments2.length}`,
    };
  });
}

/**
 * Test 8: Verify medical records are isolated by tenant
 */
async function testMedicalRecordIsolation() {
  return runTest('Medical record data isolation', async () => {
    const tenants = await prisma.tenant.findMany({ take: 2 });

    if (tenants.length < 2) {
      return {
        success: false,
        message: 'Need at least 2 tenants to test isolation',
      };
    }

    const [tenant1, tenant2] = tenants;

    await setRLSTenantId(tenant1.id);
    const records1 = await prisma.medicalRecord.findMany();

    await setRLSTenantId(tenant2.id);
    const records2 = await prisma.medicalRecord.findMany();

    await clearRLSTenantId();

    const records1Ids = new Set(records1.map(r => r.id));
    const overlap = records2.filter(r => records1Ids.has(r.id));

    if (overlap.length > 0) {
      return {
        success: false,
        message: 'Medical record isolation failed',
        details: `Found ${overlap.length} records visible to both tenants`,
      };
    }

    return {
      success: true,
      message: 'Medical record data properly isolated',
      details: `Tenant 1: ${records1.length}, Tenant 2: ${records2.length}`,
    };
  });
}

/**
 * Test 9: Verify clearRLSTenantId() works
 */
async function testClearRLSTenantId() {
  return runTest('clearRLSTenantId() function works', async () => {
    // Set a tenant ID
    await setRLSTenantId('test-tenant-clear');

    // Clear it
    await clearRLSTenantId();

    // Verify it was cleared
    const result = await prisma.$queryRaw<{ current_setting: string }[]>`
      SELECT current_setting('app.current_tenant_id', true) as current_setting
    `;

    if (!result[0]?.current_setting || result[0].current_setting === '') {
      return {
        success: true,
        message: 'clearRLSTenantId() works correctly',
      };
    }

    return {
      success: false,
      message: 'clearRLSTenantId() did not clear the value',
      details: `Expected empty, Got: ${result[0]?.current_setting}`,
    };
  });
}

/**
 * Test 10: Verify AppointmentRequest allows public INSERT (for booking page)
 */
async function testAppointmentRequestPublicInsert() {
  return runTest('AppointmentRequest allows public INSERT', async () => {
    try {
      // Try to query policies for AppointmentRequest
      const policies = await prisma.$queryRaw<{ policyname: string; cmd: string }[]>`
        SELECT policyname, cmd
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'AppointmentRequest'
          AND cmd = 'INSERT'
      `;

      if (policies.length === 0) {
        return {
          success: false,
          message: 'No INSERT policy found for AppointmentRequest',
          details: 'Public booking page requires INSERT policy',
        };
      }

      return {
        success: true,
        message: 'AppointmentRequest has INSERT policy for public booking',
        details: `Found ${policies.length} INSERT policy/policies`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to check AppointmentRequest policies',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  });
}

/**
 * Main test runner
 */
async function main() {
  console.log('🔒 RLS Policy Testing Script');
  console.log('═'.repeat(60));
  console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Not configured'}`);
  console.log('═'.repeat(60));

  // Run all tests
  await testRLSEnabled();
  await testUserTenantIdFunction();
  await testRLSPoliciesExist();
  await testSetRLSTenantId();
  await testClearRLSTenantId();
  await testMultiTenantIsolation();
  await testCustomerIsolation();
  await testAppointmentIsolation();
  await testMedicalRecordIsolation();
  await testAppointmentRequestPublicInsert();

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('═'.repeat(60));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');

  if (failed > 0) {
    console.log('Failed Tests:');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`  ❌ ${r.name}`);
        console.log(`     ${r.message}`);
        if (r.details) {
          console.log(`     Details: ${r.details}`);
        }
      });
  }

  console.log('═'.repeat(60));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
