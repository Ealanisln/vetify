
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
