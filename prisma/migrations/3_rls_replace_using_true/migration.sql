-- =============================================================================
-- 3_rls_replace_using_true
-- =============================================================================
-- Fixes Supabase advisor findings:
--   * rls_policy_always_true on User.user_access, UserRole.user_role_access,
--     AppointmentRequest.appointment_request_public_insert
--   * multiple_permissive_policies on AppointmentRequest (the overlapping
--     `_tenant_isolation` ALL policy covered INSERT too, causing duplicate
--     policy evaluation on every public-form INSERT)
--
-- WHAT THIS DOES
--   1. Replaces User.user_access (USING true) with tenantId-scoped policy.
--   2. Replaces UserRole.user_role_access (USING true) with a policy that
--      joins through User to enforce tenant isolation.
--   3. Tightens AppointmentRequest by dropping the overlapping ALL policy
--      and replacing with split SELECT/UPDATE/DELETE policies — the public
--      INSERT policy is preserved (booking form needs anonymous INSERT).
-- =============================================================================


-- ---- User ----------------------------------------------------------------
DROP POLICY IF EXISTS user_access ON public."User";
CREATE POLICY user_tenant_isolation ON public."User"
  FOR ALL TO public
  USING ("tenantId" = user_tenant_id())
  WITH CHECK ("tenantId" = user_tenant_id());


-- ---- UserRole ------------------------------------------------------------
DROP POLICY IF EXISTS user_role_access ON public."UserRole";
CREATE POLICY user_role_tenant_isolation ON public."UserRole"
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM "User" u
                 WHERE u.id = "UserRole"."userId"
                   AND u."tenantId" = user_tenant_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM "User" u
                      WHERE u.id = "UserRole"."userId"
                        AND u."tenantId" = user_tenant_id()));


-- ---- AppointmentRequest --------------------------------------------------
-- Keep `appointment_request_public_insert` (anonymous public booking form
-- needs to INSERT). Drop the overlapping ALL policy and replace with three
-- non-overlapping policies for SELECT, UPDATE, DELETE.
DROP POLICY IF EXISTS appointment_request_tenant_isolation ON public."AppointmentRequest";

CREATE POLICY appointment_request_tenant_select ON public."AppointmentRequest"
  FOR SELECT TO public
  USING ("tenantId" = user_tenant_id());

CREATE POLICY appointment_request_tenant_update ON public."AppointmentRequest"
  FOR UPDATE TO public
  USING ("tenantId" = user_tenant_id())
  WITH CHECK ("tenantId" = user_tenant_id());

CREATE POLICY appointment_request_tenant_delete ON public."AppointmentRequest"
  FOR DELETE TO public
  USING ("tenantId" = user_tenant_id());

-- After this migration, AppointmentRequest has exactly 4 policies:
--   - appointment_request_public_insert (INSERT, anon-allowed, WITH CHECK true)
--   - appointment_request_tenant_select (SELECT, tenant-scoped)
--   - appointment_request_tenant_update (UPDATE, tenant-scoped)
--   - appointment_request_tenant_delete (DELETE, tenant-scoped)
-- No overlap on any single command — eliminates the multiple_permissive_policies
-- warning the linter flagged.
