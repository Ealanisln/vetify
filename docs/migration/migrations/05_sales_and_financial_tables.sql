-- Migration 05: Sales and Financial Tables
-- Creates sales, medical orders, cash drawers, and related tables

-- =============================================
-- SALE TABLE
-- =============================================

CREATE TABLE "Sale" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "petId" TEXT,
  "userId" TEXT,
  "staffId" TEXT,
  "saleNumber" TEXT NOT NULL UNIQUE,
  "subtotal" DECIMAL(65,30) NOT NULL,
  "tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "total" DECIMAL(65,30) NOT NULL,
  "status" "SaleStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Sale_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "Sale_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT "Sale_petId_fkey"
    FOREIGN KEY ("petId") REFERENCES "Pet"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT "Sale_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT "Sale_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "Staff"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

COMMENT ON TABLE "Sale" IS 'Sales transactions';
COMMENT ON COLUMN "Sale"."saleNumber" IS 'Unique receipt/invoice number';

-- =============================================
-- SALE ITEM TABLE
-- =============================================

CREATE TABLE "SaleItem" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "saleId" TEXT NOT NULL,
  "itemId" TEXT,
  "serviceId" TEXT,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(65,30) NOT NULL,
  "unitPrice" DECIMAL(65,30) NOT NULL,
  "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "total" DECIMAL(65,30) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SaleItem_saleId_fkey"
    FOREIGN KEY ("saleId") REFERENCES "Sale"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "SaleItem_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT "SaleItem_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "Service"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

COMMENT ON TABLE "SaleItem" IS 'Line items for sales';

-- =============================================
-- CASH DRAWER TABLE
-- =============================================

CREATE TABLE "CashDrawer" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  "openedById" TEXT NOT NULL,
  "closedById" TEXT,
  "initialAmount" DECIMAL(65,30) NOT NULL,
  "finalAmount" DECIMAL(65,30),
  "expectedAmount" DECIMAL(65,30),
  "difference" DECIMAL(65,30),
  "status" "DrawerStatus" NOT NULL DEFAULT 'OPEN',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CashDrawer_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "CashDrawer_openedById_fkey"
    FOREIGN KEY ("openedById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT "CashDrawer_closedById_fkey"
    FOREIGN KEY ("closedById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

COMMENT ON TABLE "CashDrawer" IS 'Cash register drawer sessions';

-- =============================================
-- CASH TRANSACTION TABLE
-- =============================================

CREATE TABLE "CashTransaction" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "drawerId" TEXT NOT NULL,
  "amount" DECIMAL(65,30) NOT NULL,
  "type" "TransactionType" NOT NULL,
  "description" TEXT,
  "relatedId" TEXT,
  "relatedType" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CashTransaction_drawerId_fkey"
    FOREIGN KEY ("drawerId") REFERENCES "CashDrawer"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

COMMENT ON TABLE "CashTransaction" IS 'Individual cash transactions in drawer';

-- =============================================
-- SALE PAYMENT TABLE
-- =============================================

CREATE TABLE "SalePayment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "saleId" TEXT NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL,
  "amount" DECIMAL(65,30) NOT NULL,
  "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "transactionId" TEXT,
  "notes" TEXT,
  "cashTransactionId" TEXT UNIQUE,

  CONSTRAINT "SalePayment_saleId_fkey"
    FOREIGN KEY ("saleId") REFERENCES "Sale"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "SalePayment_cashTransactionId_fkey"
    FOREIGN KEY ("cashTransactionId") REFERENCES "CashTransaction"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

COMMENT ON TABLE "SalePayment" IS 'Payment records for sales';

-- =============================================
-- MEDICAL ORDER TABLE
-- =============================================

CREATE TABLE "MedicalOrder" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "visitDate" TIMESTAMP(3) NOT NULL,
  "diagnosis" TEXT,
  "treatment" TEXT,
  "notes" TEXT,
  "status" "MedicalOrderStatus" NOT NULL DEFAULT 'PENDING',
  "saleId" TEXT UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT,

  CONSTRAINT "MedicalOrder_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "MedicalOrder_petId_fkey"
    FOREIGN KEY ("petId") REFERENCES "Pet"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "MedicalOrder_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "Staff"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT "MedicalOrder_saleId_fkey"
    FOREIGN KEY ("saleId") REFERENCES "Sale"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT "MedicalOrder_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

COMMENT ON TABLE "MedicalOrder" IS 'Medical orders/prescriptions';

-- Add MedicalHistory foreign key (circular relationship)
ALTER TABLE "MedicalHistory"
  ADD CONSTRAINT "MedicalHistory_medicalOrderId_fkey"
  FOREIGN KEY ("medicalOrderId")
  REFERENCES "MedicalOrder"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- =============================================
-- PRESCRIPTION TABLE
-- =============================================

CREATE TABLE "Prescription" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" DECIMAL(65,30) NOT NULL,
  "unitPrice" DECIMAL(65,30) NOT NULL,
  "dosage" TEXT,
  "frequency" TEXT,
  "duration" TEXT,
  "instructions" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Prescription_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "MedicalOrder"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "Prescription_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "InventoryItem"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

COMMENT ON TABLE "Prescription" IS 'Prescription line items';

-- =============================================
-- INDEXES
-- =============================================

-- Sale indexes
CREATE INDEX "Sale_tenantId_idx" ON "Sale"("tenantId");
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");
CREATE INDEX "Sale_petId_idx" ON "Sale"("petId");
CREATE INDEX "Sale_userId_idx" ON "Sale"("userId");
CREATE INDEX "Sale_staffId_idx" ON "Sale"("staffId");
CREATE INDEX "Sale_saleNumber_idx" ON "Sale"("saleNumber");
CREATE INDEX "Sale_status_idx" ON "Sale"("status");
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");

-- SaleItem indexes
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");
CREATE INDEX "SaleItem_itemId_idx" ON "SaleItem"("itemId");
CREATE INDEX "SaleItem_serviceId_idx" ON "SaleItem"("serviceId");

-- CashDrawer indexes
CREATE INDEX "CashDrawer_tenantId_idx" ON "CashDrawer"("tenantId");
CREATE INDEX "CashDrawer_openedAt_idx" ON "CashDrawer"("openedAt");
CREATE INDEX "CashDrawer_status_idx" ON "CashDrawer"("status");
CREATE INDEX "CashDrawer_openedById_idx" ON "CashDrawer"("openedById");
CREATE INDEX "CashDrawer_closedById_idx" ON "CashDrawer"("closedById");

-- CashTransaction indexes
CREATE INDEX "CashTransaction_drawerId_idx" ON "CashTransaction"("drawerId");
CREATE INDEX "CashTransaction_relatedId_relatedType_idx" ON "CashTransaction"("relatedId", "relatedType");
CREATE INDEX "CashTransaction_type_idx" ON "CashTransaction"("type");

-- SalePayment indexes
CREATE INDEX "SalePayment_saleId_idx" ON "SalePayment"("saleId");
CREATE INDEX "SalePayment_paymentMethod_idx" ON "SalePayment"("paymentMethod");
CREATE INDEX "SalePayment_paymentDate_idx" ON "SalePayment"("paymentDate");
CREATE INDEX "SalePayment_cashTransactionId_idx" ON "SalePayment"("cashTransactionId");

-- MedicalOrder indexes
CREATE INDEX "MedicalOrder_tenantId_idx" ON "MedicalOrder"("tenantId");
CREATE INDEX "MedicalOrder_petId_idx" ON "MedicalOrder"("petId");
CREATE INDEX "MedicalOrder_staffId_idx" ON "MedicalOrder"("staffId");
CREATE INDEX "MedicalOrder_status_idx" ON "MedicalOrder"("status");
CREATE INDEX "MedicalOrder_saleId_idx" ON "MedicalOrder"("saleId");

-- Prescription indexes
CREATE INDEX "Prescription_orderId_idx" ON "Prescription"("orderId");
CREATE INDEX "Prescription_productId_idx" ON "Prescription"("productId");

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_sale_updated_at BEFORE UPDATE ON "Sale"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cashdrawer_updated_at BEFORE UPDATE ON "CashDrawer"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicalorder_updated_at BEFORE UPDATE ON "MedicalOrder"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
