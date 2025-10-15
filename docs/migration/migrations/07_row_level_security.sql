-- Migration 07: Row Level Security (RLS) Policies
-- CRITICAL FOR PRODUCTION: Ensures multi-tenant data isolation

-- =============================================
-- ENABLE RLS ON ALL TENANT-SCOPED TABLES
-- =============================================

ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AppointmentRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reminder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MedicalHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TreatmentRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TreatmentSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SaleItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CashDrawer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CashTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SalePayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MedicalOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Prescription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BusinessHours" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantApiKey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantUsageStats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AutomationLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrialAccessLog" ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTION: Get Current User's Tenant ID
-- =============================================

-- This function will be used by RLS policies to get the authenticated user's tenant
-- NOTE: In production, you'll need to set this via JWT claims or session variables
-- For now, we'll create a placeholder that can be overridden

CREATE OR REPLACE FUNCTION auth.user_tenant_id()
RETURNS TEXT AS $$
  SELECT current_setting('app.current_tenant_id', true);
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION auth.user_tenant_id IS 'Returns the current authenticated users tenant ID from session';

-- =============================================
-- TENANT RLS POLICIES
-- =============================================

-- Policy: Users can only see their own tenant
CREATE POLICY "tenant_isolation_policy" ON "Tenant"
  FOR ALL
  USING ("id" = auth.user_tenant_id());

-- =============================================
-- CUSTOMER RLS POLICIES
-- =============================================

CREATE POLICY "customer_tenant_isolation" ON "Customer"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

-- =============================================
-- PET RLS POLICIES
-- =============================================

CREATE POLICY "pet_tenant_isolation" ON "Pet"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

-- =============================================
-- STAFF RLS POLICIES
-- =============================================

CREATE POLICY "staff_tenant_isolation" ON "Staff"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

-- =============================================
-- SERVICE RLS POLICIES
-- =============================================

CREATE POLICY "service_tenant_isolation" ON "Service"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

-- =============================================
-- INVENTORY RLS POLICIES
-- =============================================

CREATE POLICY "inventory_tenant_isolation" ON "InventoryItem"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

CREATE POLICY "inventory_movement_tenant_isolation" ON "InventoryMovement"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

-- =============================================
-- APPOINTMENT RLS POLICIES
-- =============================================

CREATE POLICY "appointment_tenant_isolation" ON "Appointment"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

CREATE POLICY "appointment_request_tenant_isolation" ON "AppointmentRequest"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

-- Special policy for public booking page (SELECT only, no tenantId check)
CREATE POLICY "appointment_request_public_insert" ON "AppointmentRequest"
  FOR INSERT
  WITH CHECK (true);  -- Allow public inserts, validation done at app level

-- =============================================
-- REMINDER RLS POLICIES
-- =============================================

CREATE POLICY "reminder_tenant_isolation" ON "Reminder"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

-- =============================================
-- MEDICAL RECORDS RLS POLICIES
-- =============================================

CREATE POLICY "medical_history_tenant_isolation" ON "MedicalHistory"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

CREATE POLICY "medical_order_tenant_isolation" ON "MedicalOrder"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

CREATE POLICY "prescription_tenant_isolation" ON "Prescription"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "MedicalOrder"
      WHERE "MedicalOrder"."id" = "Prescription"."orderId"
        AND "MedicalOrder"."tenantId" = auth.user_tenant_id()
    )
  );

-- =============================================
-- TREATMENT RLS POLICIES
-- =============================================

CREATE POLICY "treatment_record_tenant_isolation" ON "TreatmentRecord"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

CREATE POLICY "treatment_schedule_tenant_isolation" ON "TreatmentSchedule"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

-- =============================================
-- SALES RLS POLICIES
-- =============================================

CREATE POLICY "sale_tenant_isolation" ON "Sale"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

CREATE POLICY "sale_item_tenant_isolation" ON "SaleItem"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Sale"
      WHERE "Sale"."id" = "SaleItem"."saleId"
        AND "Sale"."tenantId" = auth.user_tenant_id()
    )
  );

CREATE POLICY "sale_payment_tenant_isolation" ON "SalePayment"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Sale"
      WHERE "Sale"."id" = "SalePayment"."saleId"
        AND "Sale"."tenantId" = auth.user_tenant_id()
    )
  );

-- =============================================
-- CASH DRAWER RLS POLICIES
-- =============================================

CREATE POLICY "cash_drawer_tenant_isolation" ON "CashDrawer"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

CREATE POLICY "cash_transaction_tenant_isolation" ON "CashTransaction"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "CashDrawer"
      WHERE "CashDrawer"."id" = "CashTransaction"."drawerId"
        AND "CashDrawer"."tenantId" = auth.user_tenant_id()
    )
  );

-- =============================================
-- TENANT CONFIGURATION RLS POLICIES
-- =============================================

CREATE POLICY "tenant_settings_isolation" ON "TenantSettings"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

CREATE POLICY "business_hours_isolation" ON "BusinessHours"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

CREATE POLICY "tenant_subscription_isolation" ON "TenantSubscription"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

CREATE POLICY "tenant_invitation_isolation" ON "TenantInvitation"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

CREATE POLICY "tenant_apikey_isolation" ON "TenantApiKey"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

CREATE POLICY "tenant_usage_stats_isolation" ON "TenantUsageStats"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

-- =============================================
-- AUTOMATION LOG RLS POLICIES
-- =============================================

CREATE POLICY "automation_log_tenant_isolation" ON "AutomationLog"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

-- =============================================
-- TRIAL ACCESS LOG RLS POLICIES
-- =============================================

CREATE POLICY "trial_access_log_tenant_isolation" ON "TrialAccessLog"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id());

-- =============================================
-- GLOBAL TABLES (No Tenant Isolation)
-- =============================================

-- These tables don't need RLS because they're either:
-- 1. Global reference data (Plan)
-- 2. Protected by application logic (User, Role, UserRole)
-- 3. Admin-only (AdminAuditLog, SetupToken)

-- Plan table: Read-only for all authenticated users
ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_public_read" ON "Plan"
  FOR SELECT
  USING (true);

-- Prevent modifications to plans via RLS (only admins via service role)
CREATE POLICY "plan_no_modifications" ON "Plan"
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "plan_no_updates" ON "Plan"
  FOR UPDATE
  USING (false);

CREATE POLICY "plan_no_deletes" ON "Plan"
  FOR DELETE
  USING (false);

-- User, Role, UserRole: Protected by application logic
-- These require more complex policies based on your auth system
-- For now, we'll allow all operations (to be refined based on Kinde Auth integration)

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_access" ON "User"
  FOR ALL
  USING (true);  -- TODO: Refine based on Kinde Auth claims

ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_tenant_isolation" ON "Role"
  FOR ALL
  USING ("tenantId" = auth.user_tenant_id() OR "tenantId" IS NULL);

ALTER TABLE "UserRole" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_role_access" ON "UserRole"
  FOR ALL
  USING (true);  -- TODO: Refine based on user permissions

-- Admin tables: Service role only (no RLS policies = only service_role can access)
ALTER TABLE "AdminAuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SetupToken" ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY NOTES
-- =============================================

-- 1. The auth.user_tenant_id() function MUST be set by your application
--    using: SET LOCAL app.current_tenant_id = '<tenant_id>';
--
-- 2. This should be set in your middleware after authenticating the user
--
-- 3. For Supabase, you can also use JWT claims:
--    CREATE OR REPLACE FUNCTION auth.user_tenant_id()
--    RETURNS TEXT AS $$
--      SELECT COALESCE(
--        current_setting('request.jwt.claims', true)::json->>'tenant_id',
--        current_setting('app.current_tenant_id', true)
--      );
--    $$ LANGUAGE SQL STABLE;
--
-- 4. Public booking requests have a special INSERT policy that allows
--    unauthenticated inserts (protected by application validation)
--
-- 5. Service role (used by your backend) bypasses all RLS policies
--    Use it carefully and only for administrative operations

COMMENT ON SCHEMA public IS 'RLS policies enforce strict multi-tenant data isolation';
