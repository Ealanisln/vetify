-- =============================================================================
-- 1_rls_function_hardening
-- =============================================================================
-- Fixes Supabase advisor findings:
--   * function_search_path_mutable (4 functions)
--   * anon_security_definer_function_executable (user_tenant_id callable by anon)
--   * authenticated_security_definer_function_executable (callable by authenticated)
--
-- WHAT THIS DOES
--   1. Pins search_path on all 4 public functions to empty. This prevents a
--      privileged role from hijacking the function by injecting a malicious
--      schema into search_path before calling it.
--   2. Revokes EXECUTE on user_tenant_id() from anon and authenticated. Only
--      service_role keeps EXECUTE — RLS policies that call user_tenant_id()
--      still work because policies are evaluated with definer privileges.
--      (And service_role bypasses RLS entirely.)
--
-- IDEMPOTENCY: ALTER FUNCTION ... SET search_path is idempotent.
-- REVOKE on a role that doesn't have the privilege is a no-op.
-- Safe to run multiple times.
-- =============================================================================

ALTER FUNCTION public.update_updated_at_column()              SET search_path = '';
ALTER FUNCTION public.user_tenant_id()                        SET search_path = '';
ALTER FUNCTION public.expire_old_trials()                     SET search_path = '';
ALTER FUNCTION public.has_active_trial_access(text)           SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.user_tenant_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_tenant_id() FROM authenticated;
-- service_role retains EXECUTE; that's the only caller the app needs.
