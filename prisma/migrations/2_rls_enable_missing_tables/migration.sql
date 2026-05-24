-- =============================================================================
-- 2_rls_enable_missing_tables
-- =============================================================================
-- Fixes Supabase advisor findings:
--   * rls_disabled_in_public (14 tables in prod, more in dev)
--   * sensitive_columns_exposed (Webhook.secret, MedicalHistory.treatment,
--     MedicalOrder.treatment, SetupToken.token, TenantInvitation.token)
--   * public_bucket_allows_listing (handled in migration 4)
--
-- WHAT THIS DOES
--   For each of the 14 tables in prod that ENABLE_RLS=false but are exposed
--   through PostgREST, this migration:
--     - Enables row-level security
--     - Adds a tenant-scoped policy using user_tenant_id() (matches the
--       prevailing pattern from 0_init)
--   Two audit-log tables (SecurityAuditLog and the existing AdminAuditLog)
--   are default-deny — RLS enabled, no policies. They are accessed only via
--   the service_role from server-side code, which bypasses RLS.
--
-- IDEMPOTENCY: uses DROP POLICY IF EXISTS before CREATE POLICY. ENABLE RLS
-- is itself idempotent (no-op if already enabled). Safe to re-run.
-- =============================================================================


-- ---- Tenant-scoped policies ----------------------------------------------

ALTER TABLE public."CashShift" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cash_shift_tenant_isolation ON public."CashShift";
CREATE POLICY cash_shift_tenant_isolation ON public."CashShift"
  FOR ALL TO public USING ("tenantId" = user_tenant_id());

ALTER TABLE public."EmailLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS email_log_tenant_isolation ON public."EmailLog";
CREATE POLICY email_log_tenant_isolation ON public."EmailLog"
  FOR ALL TO public USING ("tenantId" = user_tenant_id());

ALTER TABLE public."InventoryTransfer" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inventory_transfer_tenant_isolation ON public."InventoryTransfer";
CREATE POLICY inventory_transfer_tenant_isolation ON public."InventoryTransfer"
  FOR ALL TO public USING ("tenantId" = user_tenant_id());

ALTER TABLE public."LandingPageAnalytics" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS landing_page_analytics_tenant_isolation ON public."LandingPageAnalytics";
CREATE POLICY landing_page_analytics_tenant_isolation ON public."LandingPageAnalytics"
  FOR ALL TO public USING ("tenantId" = user_tenant_id());

ALTER TABLE public."Location" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS location_tenant_isolation ON public."Location";
CREATE POLICY location_tenant_isolation ON public."Location"
  FOR ALL TO public USING ("tenantId" = user_tenant_id());

-- StaffLocation: join table, no tenantId column. Scope through Staff.
ALTER TABLE public."StaffLocation" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS staff_location_tenant_isolation ON public."StaffLocation";
CREATE POLICY staff_location_tenant_isolation ON public."StaffLocation"
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM "Staff"
                 WHERE ("Staff".id = "StaffLocation"."staffId"
                        AND "Staff"."tenantId" = user_tenant_id())));

ALTER TABLE public."Testimonial" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS testimonial_tenant_isolation ON public."Testimonial";
CREATE POLICY testimonial_tenant_isolation ON public."Testimonial"
  FOR ALL TO public USING ("tenantId" = user_tenant_id());

ALTER TABLE public."Webhook" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS webhook_tenant_isolation ON public."Webhook";
CREATE POLICY webhook_tenant_isolation ON public."Webhook"
  FOR ALL TO public USING ("tenantId" = user_tenant_id());

-- WebhookDeliveryLog: no tenantId column, scope through parent Webhook.
ALTER TABLE public."WebhookDeliveryLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS webhook_delivery_log_tenant_isolation ON public."WebhookDeliveryLog";
CREATE POLICY webhook_delivery_log_tenant_isolation ON public."WebhookDeliveryLog"
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM "Webhook"
                 WHERE ("Webhook".id = "WebhookDeliveryLog"."webhookId"
                        AND "Webhook"."tenantId" = user_tenant_id())));


-- ---- Global tables (no tenantId): public read, writes only via service_role ----

-- SystemPromotion: global, admin-managed.
ALTER TABLE public."SystemPromotion" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS system_promotion_public_read ON public."SystemPromotion";
DROP POLICY IF EXISTS system_promotion_no_insert ON public."SystemPromotion";
DROP POLICY IF EXISTS system_promotion_no_update ON public."SystemPromotion";
DROP POLICY IF EXISTS system_promotion_no_delete ON public."SystemPromotion";
CREATE POLICY system_promotion_public_read ON public."SystemPromotion"
  FOR SELECT TO public USING (true);
CREATE POLICY system_promotion_no_insert ON public."SystemPromotion"
  FOR INSERT TO public WITH CHECK (false);
CREATE POLICY system_promotion_no_update ON public."SystemPromotion"
  FOR UPDATE TO public USING (false);
CREATE POLICY system_promotion_no_delete ON public."SystemPromotion"
  FOR DELETE TO public USING (false);

-- ReferralPartner: global, admin-managed. Public read for the referral landing page.
ALTER TABLE public."ReferralPartner" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS referral_partner_public_read ON public."ReferralPartner";
DROP POLICY IF EXISTS referral_partner_no_insert ON public."ReferralPartner";
DROP POLICY IF EXISTS referral_partner_no_update ON public."ReferralPartner";
DROP POLICY IF EXISTS referral_partner_no_delete ON public."ReferralPartner";
CREATE POLICY referral_partner_public_read ON public."ReferralPartner"
  FOR SELECT TO public USING (true);
CREATE POLICY referral_partner_no_insert ON public."ReferralPartner"
  FOR INSERT TO public WITH CHECK (false);
CREATE POLICY referral_partner_no_update ON public."ReferralPartner"
  FOR UPDATE TO public USING (false);
CREATE POLICY referral_partner_no_delete ON public."ReferralPartner"
  FOR DELETE TO public USING (false);

-- ReferralCode: global. Public read so the landing page can validate codes.
ALTER TABLE public."ReferralCode" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS referral_code_public_read ON public."ReferralCode";
DROP POLICY IF EXISTS referral_code_no_insert ON public."ReferralCode";
DROP POLICY IF EXISTS referral_code_no_update ON public."ReferralCode";
DROP POLICY IF EXISTS referral_code_no_delete ON public."ReferralCode";
CREATE POLICY referral_code_public_read ON public."ReferralCode"
  FOR SELECT TO public USING (true);
CREATE POLICY referral_code_no_insert ON public."ReferralCode"
  FOR INSERT TO public WITH CHECK (false);
CREATE POLICY referral_code_no_update ON public."ReferralCode"
  FOR UPDATE TO public USING (false);
CREATE POLICY referral_code_no_delete ON public."ReferralCode"
  FOR DELETE TO public USING (false);

-- ReferralConversion: fully internal. RLS enabled, no policies — default-deny.
ALTER TABLE public."ReferralConversion" ENABLE ROW LEVEL SECURITY;


-- ---- Audit logs: RLS enabled, no policies (server-only via service_role) ----
ALTER TABLE public."SecurityAuditLog" ENABLE ROW LEVEL SECURITY;
-- (No policies — SecurityAuditLog is written by /api/internal/audit-log/route.ts
--  via Prisma + service_role, which bypasses RLS. No anon/authenticated path.)

-- _prisma_migrations is intentionally left as-is. RLS would interfere with
-- Prisma's migration management. The table contains no tenant data.
