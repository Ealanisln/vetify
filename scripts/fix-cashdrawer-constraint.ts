#!/usr/bin/env tsx
/**
 * Fix CashDrawer openedById constraint
 * Applies SQL migration to allow user deletion
 */

import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🔧 Fixing CashDrawer openedById constraint...\n');

  try {
    // Step 1: Make openedById nullable
    console.log('Step 1: Making openedById nullable...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CashDrawer" ALTER COLUMN "openedById" DROP NOT NULL;
    `);
    console.log('✅ Column is now nullable\n');

    // Step 2: Drop existing foreign key
    console.log('Step 2: Dropping existing foreign key constraint...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CashDrawer" DROP CONSTRAINT IF EXISTS "CashDrawer_openedById_fkey";
    `);
    console.log('✅ Old constraint dropped\n');

    // Step 3: Recreate with ON DELETE SET NULL
    console.log('Step 3: Creating new constraint with ON DELETE SET NULL...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CashDrawer"
        ADD CONSTRAINT "CashDrawer_openedById_fkey"
        FOREIGN KEY ("openedById")
        REFERENCES "User"(id)
        ON DELETE SET NULL;
    `);
    console.log('✅ New constraint created\n');

    console.log('🎉 CashDrawer constraint fixed successfully!');
    console.log('Users can now be deleted without blocking on open cash drawers.\n');

  } catch (error: any) {
    console.error('❌ Error fixing constraint:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
