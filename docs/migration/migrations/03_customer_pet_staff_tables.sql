-- Migration 03: Customer, Pet, and Staff Tables
-- Creates tables that depend on Tenant and User

-- =============================================
-- CUSTOMER TABLE
-- =============================================

CREATE TABLE "Customer" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "email" TEXT,
  "firstName" TEXT,
  "lastName" TEXT,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "preferredContactMethod" TEXT DEFAULT 'phone',
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "source" TEXT DEFAULT 'MANUAL', -- MANUAL, PUBLIC_BOOKING, IMPORT
  "needsReview" BOOLEAN NOT NULL DEFAULT false,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "mergedFrom" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT,

  CONSTRAINT "Customer_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT "Customer_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "User"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

COMMENT ON TABLE "Customer" IS 'Pet owners and clients';
COMMENT ON COLUMN "Customer"."source" IS 'How customer was created: MANUAL, PUBLIC_BOOKING, IMPORT';
COMMENT ON COLUMN "Customer"."needsReview" IS 'Flag for potential duplicate customers';
COMMENT ON COLUMN "Customer"."mergedFrom" IS 'Array of customer IDs that were merged into this one';

-- =============================================
-- STAFF TABLE
-- =============================================

CREATE TABLE "Staff" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT UNIQUE,
  "name" TEXT NOT NULL,
  "position" TEXT NOT NULL,
  "email" TEXT UNIQUE,
  "phone" TEXT,
  "licenseNumber" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Staff_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

COMMENT ON TABLE "Staff" IS 'Veterinary staff members';
COMMENT ON COLUMN "Staff"."licenseNumber" IS 'Professional license number for veterinarians';

-- =============================================
-- PET TABLE
-- =============================================

CREATE TABLE "Pet" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "internalId" TEXT,
  "name" TEXT NOT NULL,
  "species" TEXT NOT NULL,
  "breed" TEXT NOT NULL,
  "dateOfBirth" TIMESTAMP(3) NOT NULL,
  "gender" TEXT NOT NULL,
  "weight" DECIMAL(65,30),
  "weightUnit" TEXT,
  "microchipNumber" TEXT,
  "isNeutered" BOOLEAN NOT NULL DEFAULT false,
  "isDeceased" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Pet_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT "Pet_customerId_fkey"
    FOREIGN KEY ("customerId")
    REFERENCES "Customer"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

COMMENT ON TABLE "Pet" IS 'Pets/patients in the veterinary system';
COMMENT ON COLUMN "Pet"."internalId" IS 'Optional clinic-specific patient ID';
COMMENT ON COLUMN "Pet"."customerId" IS 'References Customer table (pet owner)';

-- =============================================
-- SERVICE TABLE
-- =============================================

CREATE TABLE "Service" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" "ServiceCategory" NOT NULL,
  "price" DECIMAL(65,30) NOT NULL,
  "duration" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Service_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

COMMENT ON TABLE "Service" IS 'Services offered by the clinic';
COMMENT ON COLUMN "Service"."duration" IS 'Service duration in minutes';

-- =============================================
-- INVENTORY ITEM TABLE
-- =============================================

CREATE TABLE "InventoryItem" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" "InventoryCategory" NOT NULL,
  "description" TEXT,
  "activeCompound" TEXT,
  "presentation" TEXT,
  "measure" TEXT,
  "brand" TEXT,
  "quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "minStock" DECIMAL(65,30),
  "location" TEXT,
  "expirationDate" TIMESTAMP(3),
  "status" "InventoryStatus" NOT NULL DEFAULT 'ACTIVE',
  "batchNumber" TEXT,
  "specialNotes" TEXT,
  "cost" DECIMAL(65,30),
  "price" DECIMAL(65,30),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InventoryItem_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

COMMENT ON TABLE "InventoryItem" IS 'Inventory items (medicines, vaccines, supplies, etc.)';
COMMENT ON COLUMN "InventoryItem"."activeCompound" IS 'Active ingredient for medications';

-- =============================================
-- INDEXES
-- =============================================

-- Customer indexes
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");
CREATE INDEX "Customer_email_idx" ON "Customer"("email");
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");
CREATE INDEX "Customer_tenantId_name_idx" ON "Customer"("tenantId", "name");
CREATE INDEX "Customer_tenantId_needsReview_idx" ON "Customer"("tenantId", "needsReview");
CREATE INDEX "Customer_tenantId_source_idx" ON "Customer"("tenantId", "source");

-- Staff indexes
CREATE INDEX "Staff_tenantId_idx" ON "Staff"("tenantId");
CREATE INDEX "Staff_isActive_idx" ON "Staff"("isActive");
CREATE INDEX "Staff_email_idx" ON "Staff"("email");
CREATE INDEX "Staff_userId_idx" ON "Staff"("userId");

-- Pet indexes
CREATE INDEX "Pet_tenantId_idx" ON "Pet"("tenantId");
CREATE INDEX "Pet_customerId_idx" ON "Pet"("customerId");
CREATE INDEX "Pet_name_idx" ON "Pet"("name");
CREATE INDEX "Pet_tenantId_customerId_idx" ON "Pet"("tenantId", "customerId");

-- Service indexes
CREATE INDEX "Service_tenantId_idx" ON "Service"("tenantId");
CREATE INDEX "Service_category_idx" ON "Service"("category");
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");
CREATE INDEX "Service_name_idx" ON "Service"("name");

-- InventoryItem indexes
CREATE INDEX "InventoryItem_tenantId_idx" ON "InventoryItem"("tenantId");
CREATE INDEX "InventoryItem_category_idx" ON "InventoryItem"("category");
CREATE INDEX "InventoryItem_name_idx" ON "InventoryItem"("name");
CREATE INDEX "InventoryItem_status_idx" ON "InventoryItem"("status");
CREATE INDEX "InventoryItem_expirationDate_idx" ON "InventoryItem"("expirationDate");
CREATE INDEX "InventoryItem_quantity_idx" ON "InventoryItem"("quantity");

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_customer_updated_at BEFORE UPDATE ON "Customer"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON "Staff"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pet_updated_at BEFORE UPDATE ON "Pet"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_updated_at BEFORE UPDATE ON "Service"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventoryitem_updated_at BEFORE UPDATE ON "InventoryItem"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
