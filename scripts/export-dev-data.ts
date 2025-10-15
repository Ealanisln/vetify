#!/usr/bin/env tsx
/**
 * Export Development Data Script
 *
 * Exports all data from the development database to a JSON file
 * This handles the current schema and prepares data for transformation
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

interface ExportData {
  exportDate: string;
  exportedBy: string;
  schemaVersion: string;
  tables: {
    [key: string]: unknown[];
  };
  metadata: {
    totalRecords: number;
    tablesCounts: Record<string, number>;
  };
}

async function exportData() {
  console.log('🚀 Starting development database export...\n');

  const startTime = Date.now();
  const exportData: ExportData = {
    exportDate: new Date().toISOString(),
    exportedBy: process.env.USER || 'unknown',
    schemaVersion: '1.0.0',
    tables: {},
    metadata: {
      totalRecords: 0,
      tablesCounts: {},
    },
  };

  try {
    // Export in dependency order
    console.log('📊 Exporting tables...');

    // Core tables (no dependencies)
    exportData.tables.tenants = await exportTable('Tenant', () => prisma.tenant.findMany());
    exportData.tables.plans = await exportTable('Plan', () => prisma.plan.findMany());
    exportData.tables.users = await exportTable('User', () => prisma.user.findMany());
    exportData.tables.roles = await exportTable('Role', () => prisma.role.findMany());
    exportData.tables.userRoles = await exportTable('UserRole', () => prisma.userRole.findMany());

    // Customer data (from Users who own pets)
    // Note: In new schema, we have a separate Customer table
    console.log('  📝 Customer (extracting from Users with pets)...');
    const usersWithPets = await prisma.user.findMany({
      where: {
        pets: {
          some: {},
        },
      },
      include: {
        pets: {
          select: { id: true },
        },
      },
    });
    exportData.tables.customersSource = usersWithPets;
    exportData.metadata.tablesCounts['Customer (from Users)'] = usersWithPets.length;

    // Staff and related
    exportData.tables.staff = await exportTable('Staff', () => prisma.staff.findMany());

    // Pets (will need customerId transformation)
    exportData.tables.pets = await exportTable('Pet', () => prisma.pet.findMany());

    // Services and Inventory
    exportData.tables.services = await exportTable('Service', () => prisma.service.findMany());
    exportData.tables.inventoryItems = await exportTable('InventoryItem', () => prisma.inventoryItem.findMany());

    // Operational tables
    exportData.tables.appointments = await exportTable('Appointment', () => prisma.appointment.findMany());
    exportData.tables.appointmentRequests = await exportTable('AppointmentRequest', () =>
      prisma.appointmentRequest.findMany()
    );
    exportData.tables.reminders = await exportTable('Reminder', () => prisma.reminder.findMany());
    exportData.tables.medicalHistories = await exportTable('MedicalHistory', () =>
      prisma.medicalHistory.findMany()
    );
    exportData.tables.treatmentRecords = await exportTable('TreatmentRecord', () =>
      prisma.treatmentRecord.findMany()
    );
    exportData.tables.treatmentSchedules = await exportTable('TreatmentSchedule', () =>
      prisma.treatmentSchedule.findMany()
    );
    exportData.tables.inventoryMovements = await exportTable('InventoryMovement', () =>
      prisma.inventoryMovement.findMany()
    );

    // Sales and financial
    exportData.tables.sales = await exportTable('Sale', () => prisma.sale.findMany());
    exportData.tables.saleItems = await exportTable('SaleItem', () => prisma.saleItem.findMany());
    exportData.tables.cashDrawers = await exportTable('CashDrawer', () => prisma.cashDrawer.findMany());
    exportData.tables.cashTransactions = await exportTable('CashTransaction', () =>
      prisma.cashTransaction.findMany()
    );
    exportData.tables.salePayments = await exportTable('SalePayment', () => prisma.salePayment.findMany());
    exportData.tables.medicalOrders = await exportTable('MedicalOrder', () => prisma.medicalOrder.findMany());
    exportData.tables.prescriptions = await exportTable('Prescription', () => prisma.prescription.findMany());

    // Tenant configuration
    exportData.tables.tenantSettings = await exportTable('TenantSettings', () =>
      prisma.tenantSettings.findMany()
    );
    exportData.tables.businessHours = await exportTable('BusinessHours', () => prisma.businessHours.findMany());
    exportData.tables.tenantSubscriptions = await exportTable('TenantSubscription', () =>
      prisma.tenantSubscription.findMany()
    );
    exportData.tables.tenantInvitations = await exportTable('TenantInvitation', () =>
      prisma.tenantInvitation.findMany()
    );
    exportData.tables.tenantApiKeys = await exportTable('TenantApiKey', () => prisma.tenantApiKey.findMany());
    exportData.tables.tenantUsageStats = await exportTable('TenantUsageStats', () =>
      prisma.tenantUsageStats.findMany()
    );

    // Admin tables
    exportData.tables.automationLogs = await exportTable('AutomationLog', () => prisma.automationLog.findMany());
    exportData.tables.adminAuditLogs = await exportTable('AdminAuditLog', () =>
      prisma.adminAuditLog.findMany()
    );
    exportData.tables.setupTokens = await exportTable('SetupToken', () => prisma.setupToken.findMany());
    exportData.tables.trialAccessLogs = await exportTable('TrialAccessLog', () =>
      prisma.trialAccessLog.findMany()
    );

    // Calculate metadata
    exportData.metadata.totalRecords = Object.values(exportData.metadata.tablesCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    // Save to file
    const outputPath = path.join(process.cwd(), 'dev_export_data.json');
    await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ Export complete!');
    console.log(`📁 Output file: ${outputPath}`);
    console.log(`📊 Total records: ${exportData.metadata.totalRecords}`);
    console.log(`⏱️  Time taken: ${elapsed}s\n`);

    // Print summary
    console.log('📋 Export Summary:');
    console.log('─'.repeat(50));
    Object.entries(exportData.metadata.tablesCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([table, count]) => {
        console.log(`  ${table.padEnd(30)} ${count.toString().padStart(6)} records`);
      });
    console.log('─'.repeat(50));

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function exportTable<T>(tableName: string, fetchFn: () => Promise<T[]>): Promise<T[]> {
  try {
    const data = await fetchFn();
    console.log(`  ✓ ${tableName.padEnd(30)} ${data.length.toString().padStart(6)} records`);
    exportData.metadata.tablesCounts[tableName] = data.length;
    return data;
  } catch (error) {
    console.error(`  ✗ ${tableName} - Error:`, error);
    exportData.metadata.tablesCounts[tableName] = 0;
    return [];
  }
}

// Make exportData accessible to exportTable
let exportData: ExportData;

// Run the export
exportData = {
  exportDate: '',
  exportedBy: '',
  schemaVersion: '',
  tables: {},
  metadata: {
    totalRecords: 0,
    tablesCounts: {},
  },
};

exportData()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
