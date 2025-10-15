-- Critical Production Fixes Migration
-- Generated: October 15, 2025
-- Purpose: Fix cascading rules, add missing indexes, and optimize performance

-- ============================================================================
-- 1. FIX CASCADING DELETE RULES
-- ============================================================================

-- Fix CashDrawer.closedBy relation (allow user deletion without blocking)
ALTER TABLE "CashDrawer" DROP CONSTRAINT IF EXISTS "CashDrawer_closedById_fkey";
ALTER TABLE "CashDrawer" ADD CONSTRAINT "CashDrawer_closedById_fkey" 
  FOREIGN KEY ("closedById") REFERENCES "User"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Fix SaleItem relations (preserve sale history when products/services are deleted)
ALTER TABLE "SaleItem" DROP CONSTRAINT IF EXISTS "SaleItem_itemId_fkey";
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_itemId_fkey" 
  FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SaleItem" DROP CONSTRAINT IF EXISTS "SaleItem_serviceId_fkey";
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_serviceId_fkey" 
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Fix Customer relations for proper data lifecycle
ALTER TABLE "Pet" DROP CONSTRAINT IF EXISTS "Pet_customerId_fkey";
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_customerId_fkey" 
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_customerId_fkey";
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" 
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Reminder" DROP CONSTRAINT IF EXISTS "Reminder_customerId_fkey";
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_customerId_fkey" 
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Sale" DROP CONSTRAINT IF EXISTS "Sale_customerId_fkey";
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" 
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- 2. ADD MISSING COMPOSITE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Appointment status and datetime queries (common in calendar views)
CREATE INDEX IF NOT EXISTS "Appointment_tenantId_status_dateTime_idx" 
  ON "Appointment"("tenantId", "status", "dateTime");

-- Inventory low stock alerts
CREATE INDEX IF NOT EXISTS "InventoryItem_tenantId_status_quantity_idx" 
  ON "InventoryItem"("tenantId", "status", "quantity");

-- Sales reporting queries
CREATE INDEX IF NOT EXISTS "Sale_tenantId_status_createdAt_idx" 
  ON "Sale"("tenantId", "status", "createdAt");

-- Reminder due date queries with status filtering
CREATE INDEX IF NOT EXISTS "Reminder_tenantId_status_dueDate_idx" 
  ON "Reminder"("tenantId", "status", "dueDate");

-- Treatment schedule overdue lookups
CREATE INDEX IF NOT EXISTS "TreatmentSchedule_tenantId_status_scheduledDate_idx"
  ON "TreatmentSchedule"("tenantId", "status", "scheduledDate");

-- Staff lookup with active status
CREATE INDEX IF NOT EXISTS "Staff_tenantId_isActive_idx" 
  ON "Staff"("tenantId", "isActive");

-- Service lookup with active status and category
CREATE INDEX IF NOT EXISTS "Service_tenantId_isActive_category_idx" 
  ON "Service"("tenantId", "isActive", "category");

-- Medical history lookup by date range
CREATE INDEX IF NOT EXISTS "MedicalHistory_tenantId_visitDate_idx"
  ON "MedicalHistory"("tenantId", "visitDate" DESC);

-- ============================================================================
-- 3. ADD MISSING TIMESTAMPS FOR AUDIT TRAIL
-- ============================================================================

-- Add updatedAt to Prescription
ALTER TABLE "Prescription" 
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add updatedAt to CashTransaction  
ALTER TABLE "CashTransaction" 
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add updatedAt to SaleItem
ALTER TABLE "SaleItem" 
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add updatedAt to SalePayment
ALTER TABLE "SalePayment" 
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add updatedAt to InventoryMovement
ALTER TABLE "InventoryMovement" 
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- 4. OPTIMIZE DECIMAL PRECISION (Save storage, improve performance)
-- ============================================================================

-- Sale monetary fields
ALTER TABLE "Sale" 
  ALTER COLUMN "subtotal" TYPE DECIMAL(10,2),
  ALTER COLUMN "tax" TYPE DECIMAL(10,2),
  ALTER COLUMN "discount" TYPE DECIMAL(10,2),
  ALTER COLUMN "total" TYPE DECIMAL(10,2);

-- SaleItem monetary fields
ALTER TABLE "SaleItem" 
  ALTER COLUMN "quantity" TYPE DECIMAL(8,2),
  ALTER COLUMN "unitPrice" TYPE DECIMAL(10,2),
  ALTER COLUMN "discount" TYPE DECIMAL(10,2),
  ALTER COLUMN "total" TYPE DECIMAL(10,2);

-- SalePayment
ALTER TABLE "SalePayment" 
  ALTER COLUMN "amount" TYPE DECIMAL(10,2);

-- InventoryItem
ALTER TABLE "InventoryItem" 
  ALTER COLUMN "quantity" TYPE DECIMAL(8,2),
  ALTER COLUMN "minStock" TYPE DECIMAL(8,2),
  ALTER COLUMN "cost" TYPE DECIMAL(10,2),
  ALTER COLUMN "price" TYPE DECIMAL(10,2);

-- InventoryMovement
ALTER TABLE "InventoryMovement" 
  ALTER COLUMN "quantity" TYPE DECIMAL(8,2);

-- CashDrawer
ALTER TABLE "CashDrawer" 
  ALTER COLUMN "initialAmount" TYPE DECIMAL(10,2),
  ALTER COLUMN "finalAmount" TYPE DECIMAL(10,2),
  ALTER COLUMN "expectedAmount" TYPE DECIMAL(10,2),
  ALTER COLUMN "difference" TYPE DECIMAL(10,2);

-- CashTransaction
ALTER TABLE "CashTransaction" 
  ALTER COLUMN "amount" TYPE DECIMAL(10,2);

-- Prescription
ALTER TABLE "Prescription" 
  ALTER COLUMN "quantity" TYPE DECIMAL(8,2),
  ALTER COLUMN "unitPrice" TYPE DECIMAL(10,2);

-- Pet weight
ALTER TABLE "Pet" 
  ALTER COLUMN "weight" TYPE DECIMAL(6,2);

-- Plan pricing
ALTER TABLE "Plan" 
  ALTER COLUMN "monthlyPrice" TYPE DECIMAL(10,2),
  ALTER COLUMN "annualPrice" TYPE DECIMAL(10,2);

-- Service pricing
ALTER TABLE "Service" 
  ALTER COLUMN "price" TYPE DECIMAL(10,2);

-- TenantSettings
ALTER TABLE "TenantSettings" 
  ALTER COLUMN "taxRate" TYPE DECIMAL(5,4);  -- For percentage like 0.1650 (16.5%)

-- ============================================================================
-- 5. ADD PARTIAL INDEXES FOR FILTERED QUERIES (PostgreSQL-specific optimization)
-- ============================================================================

-- Active trial tenants (already in migration but ensuring it exists)
CREATE INDEX IF NOT EXISTS "Tenant_active_trial_idx" 
  ON "Tenant"("trialEndsAt", "subscriptionStatus") 
  WHERE "isTrialPeriod" = true;

-- Low stock items only
CREATE INDEX IF NOT EXISTS "InventoryItem_low_stock_idx" 
  ON "InventoryItem"("tenantId", "name") 
  WHERE "status" IN ('LOW_STOCK', 'OUT_OF_STOCK');

-- Pending reminders only
CREATE INDEX IF NOT EXISTS "Reminder_pending_idx" 
  ON "Reminder"("tenantId", "dueDate") 
  WHERE "status" = 'PENDING';

-- Scheduled/overdue treatments only
CREATE INDEX IF NOT EXISTS "TreatmentSchedule_due_idx" 
  ON "TreatmentSchedule"("tenantId", "scheduledDate") 
  WHERE "status" IN ('SCHEDULED', 'OVERDUE');

-- Open cash drawers only
CREATE INDEX IF NOT EXISTS "CashDrawer_open_idx" 
  ON "CashDrawer"("tenantId", "openedAt") 
  WHERE "status" = 'OPEN';

-- Pending appointment requests
CREATE INDEX IF NOT EXISTS "AppointmentRequest_pending_idx" 
  ON "AppointmentRequest"("tenantId", "createdAt") 
  WHERE "status" = 'PENDING';

-- ============================================================================
-- 6. ADD CHECK CONSTRAINTS FOR DATA INTEGRITY
-- ============================================================================

-- Ensure sale total matches calculation
ALTER TABLE "Sale" 
  DROP CONSTRAINT IF EXISTS "Sale_total_check",
  ADD CONSTRAINT "Sale_total_check" 
  CHECK ("total" >= 0);

-- Ensure positive quantities
ALTER TABLE "InventoryItem" 
  DROP CONSTRAINT IF EXISTS "InventoryItem_quantity_check",
  ADD CONSTRAINT "InventoryItem_quantity_check" 
  CHECK ("quantity" >= 0);

-- Ensure payment amount is positive
ALTER TABLE "SalePayment" 
  DROP CONSTRAINT IF EXISTS "SalePayment_amount_check",
  ADD CONSTRAINT "SalePayment_amount_check" 
  CHECK ("amount" > 0);

-- Ensure appointment duration is reasonable
ALTER TABLE "Appointment" 
  DROP CONSTRAINT IF EXISTS "Appointment_duration_check",
  ADD CONSTRAINT "Appointment_duration_check" 
  CHECK ("duration" >= 5 AND "duration" <= 480); -- 5 min to 8 hours

-- Ensure tax rate is valid percentage
ALTER TABLE "TenantSettings" 
  DROP CONSTRAINT IF EXISTS "TenantSettings_taxRate_check",
  ADD CONSTRAINT "TenantSettings_taxRate_check" 
  CHECK ("taxRate" >= 0 AND "taxRate" <= 1); -- 0% to 100%

-- ============================================================================
-- 7. ADD HELPFUL DATABASE COMMENTS
-- ============================================================================

COMMENT ON TABLE "Customer" IS 'Stores pet owners and clients. Can be linked to User for portal access.';
COMMENT ON TABLE "Pet" IS 'Animals under care. Always belongs to a Customer (not User).';
COMMENT ON TABLE "Sale" IS 'Financial transactions for products and services.';
COMMENT ON TABLE "Appointment" IS 'Scheduled visits for pets. Linked to both Customer and optional User.';
COMMENT ON TABLE "TrialAccessLog" IS 'Audit log for trial period access attempts and restrictions.';
COMMENT ON TABLE "AdminAuditLog" IS 'Audit log for super admin actions on user accounts.';

COMMENT ON COLUMN "Tenant"."subscriptionStatus" IS 'Current subscription state. TRIALING = in trial, ACTIVE = paid, INACTIVE = expired';
COMMENT ON COLUMN "Customer"."source" IS 'How customer was created: MANUAL, PUBLIC_BOOKING, IMPORT';
COMMENT ON COLUMN "Customer"."needsReview" IS 'Flagged for duplicate review during import/booking';
COMMENT ON COLUMN "Sale"."status" IS 'Payment status: PENDING, PAID, PARTIALLY_PAID, COMPLETED, CANCELLED, REFUNDED';

-- ============================================================================
-- 8. VERIFY DATA INTEGRITY AFTER MIGRATION
-- ============================================================================

-- Check for orphaned records that will be affected by cascade changes
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  -- Check for pets without customers (should not exist)
  SELECT COUNT(*) INTO orphaned_count
  FROM "Pet" p
  LEFT JOIN "Customer" c ON p."customerId" = c.id
  WHERE c.id IS NULL;
  
  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % pets without valid customers', orphaned_count;
  END IF;
  
  -- Check for appointments without customers
  SELECT COUNT(*) INTO orphaned_count
  FROM "Appointment" a
  LEFT JOIN "Customer" c ON a."customerId" = c.id
  WHERE c.id IS NULL;
  
  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % appointments without valid customers', orphaned_count;
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Critical production fixes applied successfully';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run ANALYZE to update query planner statistics';
  RAISE NOTICE '2. Test customer deletion with related records';
  RAISE NOTICE '3. Monitor slow query log for index effectiveness';
  RAISE NOTICE '4. Update Prisma schema to match these changes';
END $$;

