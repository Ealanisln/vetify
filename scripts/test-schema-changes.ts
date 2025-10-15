#!/usr/bin/env tsx
/**
 * Comprehensive Schema Changes Test Suite
 * Tests all critical fixes applied to the Prisma schema
 *
 * Run with: npx tsx scripts/test-schema-changes.ts
 */

import { prisma } from '../src/lib/prisma';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2));
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...\n');

  try {
    // Delete in correct order to avoid foreign key issues
    await prisma.appointment.deleteMany({
      where: { customer: { name: { startsWith: 'TEST_' } } }
    });

    await prisma.reminder.deleteMany({
      where: { customer: { name: { startsWith: 'TEST_' } } }
    });

    await prisma.saleItem.deleteMany({
      where: { sale: { customer: { name: { startsWith: 'TEST_' } } } }
    });

    await prisma.sale.deleteMany({
      where: { customer: { name: { startsWith: 'TEST_' } } }
    });

    await prisma.pet.deleteMany({
      where: { customer: { name: { startsWith: 'TEST_' } } }
    });

    await prisma.customer.deleteMany({
      where: { name: { startsWith: 'TEST_' } }
    });

    await prisma.saleItem.deleteMany({
      where: { inventoryItem: { name: { startsWith: 'TEST_' } } }
    });

    await prisma.inventoryItem.deleteMany({
      where: { name: { startsWith: 'TEST_' } }
    });

    await prisma.cashDrawer.deleteMany({
      where: { openedBy: { email: { startsWith: 'test_' } } }
    });

    await prisma.user.deleteMany({
      where: { email: { startsWith: 'test_' } }
    });

    console.log('✅ Cleanup completed\n');
  } catch (error) {
    console.error('⚠️  Cleanup error (non-fatal):', error);
  }
}

async function testCompositeIndexes() {
  console.log('\n📊 Testing Composite Indexes...\n');

  const expectedIndexes = [
    'Appointment_tenantId_status_dateTime_idx',
    'Sale_tenantId_status_createdAt_idx',
    'InventoryItem_tenantId_status_quantity_idx',
    'Reminder_tenantId_status_dueDate_idx',
    'TreatmentSchedule_tenantId_status_scheduledDate_idx',
    'Staff_tenantId_isActive_idx',
    'Service_tenantId_isActive_category_idx',
    'MedicalHistory_tenantId_visitDate_idx',
    'CashDrawer_tenantId_status_openedAt_idx'
  ];

  try {
    const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname LIKE '%tenantId%'
      ORDER BY indexname;
    `;

    const indexNames = indexes.map(i => i.indexname);

    for (const expectedIndex of expectedIndexes) {
      const exists = indexNames.includes(expectedIndex);
      logTest(
        `Index: ${expectedIndex}`,
        exists,
        exists ? 'Index exists' : 'Index missing'
      );
    }
  } catch (error: any) {
    logTest('Composite Indexes Check', false, 'Failed to query indexes', error.message);
  }
}

async function testCustomerDeletion() {
  console.log('\n🧪 Test 1: Customer Deletion with Cascade/SetNull...\n');

  try {
    // Get or create a test tenant
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'TEST_Tenant',
          slug: 'test-tenant-' + Date.now(),
          planType: 'PROFESIONAL'
        }
      });
    }

    // Create test customer with pets first
    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: 'TEST_Customer_Delete',
        email: 'test_delete@example.com',
        pets: {
          create: [
            {
              tenantId: tenant.id,
              name: 'TEST_Pet_1',
              species: 'Dog',
              breed: 'Labrador',
              dateOfBirth: new Date('2020-01-01'),
              gender: 'Male'
            }
          ]
        }
      },
      include: {
        pets: true
      }
    });

    // Create related records with proper pet reference
    const pet = customer.pets[0];

    await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        petId: pet.id,
        customerId: customer.id,
        dateTime: new Date(),
        duration: 30,
        reason: 'TEST_Checkup',
        status: 'SCHEDULED'
      }
    });

    await prisma.sale.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        petId: pet.id,
        saleNumber: 'TEST_SALE_' + Date.now(),
        subtotal: 100.00,
        tax: 10.00,
        total: 110.00,
        status: 'COMPLETED'
      }
    });

    await prisma.reminder.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        petId: pet.id,
        type: 'APPOINTMENT',
        title: 'TEST_Reminder',
        message: 'Test reminder',
        dueDate: new Date(),
        status: 'PENDING'
      }
    });

    // Fetch customer with all relations for verification
    const customerWithRelations = await prisma.customer.findUnique({
      where: { id: customer.id },
      include: {
        pets: true,
        appointments: true,
        sales: true,
        reminders: true
      }
    });

    if (!customerWithRelations) {
      throw new Error('Customer not found after creation');
    }

    logTest(
      'Customer Creation',
      true,
      `Created customer with ${customerWithRelations.pets.length} pet(s), ${customerWithRelations.appointments.length} appointment(s), ${customerWithRelations.sales.length} sale(s), ${customerWithRelations.reminders.length} reminder(s)`
    );

    // Now delete the customer
    await prisma.customer.delete({
      where: { id: customerWithRelations.id }
    });

    logTest('Customer Deletion', true, 'Customer deleted successfully (no foreign key errors)');

    // Verify pets were cascaded (should be deleted)
    const remainingPets = await prisma.pet.findMany({
      where: { customerId: customerWithRelations.id }
    });

    logTest(
      'Pet Cascade Delete',
      remainingPets.length === 0,
      remainingPets.length === 0
        ? 'Pets were deleted (CASCADE working)'
        : `${remainingPets.length} pet(s) still exist (CASCADE failed)`
    );

    // Verify appointments were set to null (should exist with null customerId)
    const remainingAppointments = await prisma.appointment.findMany({
      where: { id: { in: customerWithRelations.appointments.map(a => a.id) } }
    });

    const nullCustomerIds = remainingAppointments.filter(a => a.customerId === null);
    logTest(
      'Appointment SetNull',
      nullCustomerIds.length === remainingAppointments.length,
      remainingAppointments.length > 0
        ? `${nullCustomerIds.length}/${remainingAppointments.length} appointments have null customerId (SET NULL working)`
        : 'No appointments to check'
    );

    // Verify sales were set to null
    const remainingSales = await prisma.sale.findMany({
      where: { id: { in: customerWithRelations.sales.map(s => s.id) } }
    });

    const nullSaleCustomerIds = remainingSales.filter(s => s.customerId === null);
    logTest(
      'Sale SetNull',
      nullSaleCustomerIds.length === remainingSales.length,
      remainingSales.length > 0
        ? `${nullSaleCustomerIds.length}/${remainingSales.length} sales have null customerId (SET NULL working)`
        : 'No sales to check'
    );

    // Verify reminders were set to null
    const remainingReminders = await prisma.reminder.findMany({
      where: { id: { in: customerWithRelations.reminders.map(r => r.id) } }
    });

    const nullReminderCustomerIds = remainingReminders.filter(r => r.customerId === null);
    logTest(
      'Reminder SetNull',
      nullReminderCustomerIds.length === remainingReminders.length,
      remainingReminders.length > 0
        ? `${nullReminderCustomerIds.length}/${remainingReminders.length} reminders have null customerId (SET NULL working)`
        : 'No reminders to check'
    );

  } catch (error: any) {
    logTest('Customer Deletion Test', false, `Error: ${error.message}`, error);
  }
}

async function testProductDeletion() {
  console.log('\n🧪 Test 2: Product Deletion Preserving Sale History...\n');

  try {
    // Get or create a test tenant
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'TEST_Tenant',
          slug: 'test-tenant-' + Date.now(),
          planType: 'PROFESIONAL'
        }
      });
    }

    // Create test inventory item
    const item = await prisma.inventoryItem.create({
      data: {
        tenantId: tenant.id,
        name: 'TEST_Product_Delete',
        category: 'MEDICINE',
        quantity: 10,
        price: 50.00,
        status: 'ACTIVE'
      }
    });

    logTest('Product Creation', true, `Created inventory item: ${item.name}`);

    // Create a sale with this item
    const sale = await prisma.sale.create({
      data: {
        tenantId: tenant.id,
        saleNumber: 'TEST_SALE_ITEM_' + Date.now(),
        subtotal: 50.00,
        tax: 5.00,
        total: 55.00,
        status: 'COMPLETED',
        items: {
          create: [
            {
              itemId: item.id,
              description: item.name,
              quantity: 1,
              unitPrice: 50.00,
              total: 50.00
            }
          ]
        }
      },
      include: { items: true }
    });

    logTest('Sale with Item', true, `Created sale with ${sale.items.length} item(s)`);

    // Delete the inventory item
    await prisma.inventoryItem.delete({
      where: { id: item.id }
    });

    logTest('Product Deletion', true, 'Inventory item deleted successfully');

    // Verify sale item still exists with null itemId
    const saleItem = await prisma.saleItem.findFirst({
      where: { saleId: sale.id }
    });

    if (saleItem) {
      logTest(
        'Sale History Preserved',
        saleItem.itemId === null && saleItem.description === item.name,
        saleItem.itemId === null
          ? `Sale item preserved with description: "${saleItem.description}" (SET NULL working)`
          : 'Sale item still has itemId (SET NULL failed)'
      );
    } else {
      logTest('Sale History Preserved', false, 'Sale item was deleted (should be preserved)');
    }

  } catch (error: any) {
    logTest('Product Deletion Test', false, `Error: ${error.message}`, error);
  }
}

async function testUserDeletion() {
  console.log('\n🧪 Test 3: User Deletion with Cash Drawers...\n');

  try {
    // Get or create a test tenant
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'TEST_Tenant',
          slug: 'test-tenant-' + Date.now(),
          planType: 'PROFESIONAL'
        }
      });
    }

    // Create test user
    const user = await prisma.user.create({
      data: {
        id: 'test_user_' + Date.now(),
        email: 'test_user_delete@example.com',
        tenantId: tenant.id
      }
    });

    logTest('User Creation', true, `Created user: ${user.email}`);

    // Create cash drawer opened and closed by this user
    const drawer = await prisma.cashDrawer.create({
      data: {
        tenantId: tenant.id,
        openedById: user.id,
        closedById: user.id,
        initialAmount: 100.00,
        finalAmount: 150.00,
        status: 'CLOSED'
      }
    });

    logTest('Cash Drawer Creation', true, `Created cash drawer opened and closed by user`);

    // Delete the user
    await prisma.user.delete({
      where: { id: user.id }
    });

    logTest('User Deletion', true, 'User deleted successfully (no blocking)');

    // Verify cash drawer still exists with null closedById
    const remainingDrawer = await prisma.cashDrawer.findUnique({
      where: { id: drawer.id }
    });

    if (remainingDrawer) {
      logTest(
        'Cash Drawer Preserved',
        remainingDrawer.closedById === null,
        remainingDrawer.closedById === null
          ? 'Cash drawer preserved with null closedById (SET NULL working)'
          : 'Cash drawer still has closedById (SET NULL failed)'
      );
    } else {
      logTest('Cash Drawer Preserved', false, 'Cash drawer was deleted (should be preserved)');
    }

  } catch (error: any) {
    logTest('User Deletion Test', false, `Error: ${error.message}`, error);
  }
}

async function testDataIntegrity() {
  console.log('\n🧪 Test 4: Data Integrity Checks...\n');

  try {
    // Check for orphaned pets (pets without customers)
    const orphanedPets = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "Pet" p
      LEFT JOIN "Customer" c ON p."customerId" = c.id
      WHERE c.id IS NULL;
    `;

    const petCount = Number(orphanedPets[0]?.count || 0);
    logTest(
      'No Orphaned Pets',
      petCount === 0,
      petCount === 0 ? 'No orphaned pets found' : `Found ${petCount} orphaned pet(s)`
    );

    // Check for invalid appointments (appointments with non-null customerId but customer doesn't exist)
    const invalidAppointments = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "Appointment" a
      WHERE a."customerId" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "Customer" c WHERE c.id = a."customerId");
    `;

    const apptCount = Number(invalidAppointments[0]?.count || 0);
    logTest(
      'No Invalid Appointments',
      apptCount === 0,
      apptCount === 0 ? 'All appointments have valid customer references' : `Found ${apptCount} invalid appointment(s)`
    );

    // Check for invalid sales
    const invalidSales = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "Sale" s
      WHERE s."customerId" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "Customer" c WHERE c.id = s."customerId");
    `;

    const saleCount = Number(invalidSales[0]?.count || 0);
    logTest(
      'No Invalid Sales',
      saleCount === 0,
      saleCount === 0 ? 'All sales have valid customer references' : `Found ${saleCount} invalid sale(s)`
    );

  } catch (error: any) {
    logTest('Data Integrity Check', false, `Error: ${error.message}`, error);
  }
}

async function testDecimalPrecision() {
  console.log('\n🧪 Test 5: Decimal Precision...\n');

  try {
    // Get or create a test tenant
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'TEST_Tenant',
          slug: 'test-tenant-' + Date.now(),
          planType: 'PROFESIONAL'
        }
      });
    }

    // Test sale with precise decimal values
    const sale = await prisma.sale.create({
      data: {
        tenantId: tenant.id,
        saleNumber: 'TEST_DECIMAL_' + Date.now(),
        subtotal: 1234.56,
        tax: 123.46,
        discount: 12.34,
        total: 1345.68,
        status: 'COMPLETED'
      }
    });

    const matches = (
      Number(sale.subtotal) === 1234.56 &&
      Number(sale.tax) === 123.46 &&
      Number(sale.discount) === 12.34 &&
      Number(sale.total) === 1345.68
    );

    logTest(
      'Decimal Precision (10,2)',
      matches,
      matches
        ? 'Money values stored correctly with 2 decimal places'
        : 'Decimal precision issue detected',
      {
        expected: { subtotal: 1234.56, tax: 123.46, discount: 12.34, total: 1345.68 },
        actual: {
          subtotal: Number(sale.subtotal),
          tax: Number(sale.tax),
          discount: Number(sale.discount),
          total: Number(sale.total)
        }
      }
    );

    // Test inventory with quantity precision
    const item = await prisma.inventoryItem.create({
      data: {
        tenantId: tenant.id,
        name: 'TEST_Decimal_Item',
        category: 'MEDICINE',
        quantity: 123.45,
        price: 99.99,
        status: 'ACTIVE'
      }
    });

    const qtyMatches = Number(item.quantity) === 123.45 && Number(item.price) === 99.99;
    logTest(
      'Decimal Precision (8,2)',
      qtyMatches,
      qtyMatches
        ? 'Quantity values stored correctly with 2 decimal places'
        : 'Quantity precision issue detected',
      {
        expected: { quantity: 123.45, price: 99.99 },
        actual: { quantity: Number(item.quantity), price: Number(item.price) }
      }
    );

  } catch (error: any) {
    logTest('Decimal Precision Test', false, `Error: ${error.message}`, error);
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(80) + '\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.message}`);
    });
    console.log();
  }

  console.log('='.repeat(80) + '\n');

  if (failed === 0) {
    console.log('🎉 All tests passed! Your schema changes are working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Review the issues above.\n');
  }
}

async function main() {
  console.log('🔬 Vetify Schema Changes Test Suite');
  console.log('Testing all critical Prisma schema fixes\n');
  console.log('='.repeat(80) + '\n');

  try {
    await cleanup();
    await testCompositeIndexes();
    await testCustomerDeletion();
    await testProductDeletion();
    await testUserDeletion();
    await testDataIntegrity();
    await testDecimalPrecision();
    await cleanup();
    await printSummary();

    const failed = results.filter(r => !r.passed).length;
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
