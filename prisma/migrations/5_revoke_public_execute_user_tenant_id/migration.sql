-- =============================================================================
-- 5_revoke_public_execute_user_tenant_id
-- =============================================================================
-- Fixes a bug in migration 1_rls_function_hardening: that migration revoked
-- EXECUTE on user_tenant_id() from anon and authenticated explicitly, but did
-- NOT revoke from PUBLIC. Since functions in the public schema get the default
-- "PUBLIC EXECUTE" grant, and anon/authenticated implicitly inherit from PUBLIC,
-- the effective privilege didn't change. The Supabase advisor continued to
-- report:
--   * anon_security_definer_function_executable
--   * authenticated_security_definer_function_executable
--
-- WHY THIS MATTERS
-- user_tenant_id() is SECURITY DEFINER and resolves the current request's
-- tenant. Exposed via /rest/v1/rpc/user_tenant_id, an unauthenticated caller
-- could probe tenant identity. Revoking from PUBLIC closes the back door.
--
-- WHY POLICIES STILL WORK
-- RLS policies that call user_tenant_id() do so through the SECURITY DEFINER
-- path, which evaluates with the function owner's privileges (postgres). The
-- caller's EXECUTE grant is only checked when the function is invoked as an
-- RPC. Service-role app code keeps EXECUTE explicitly.
--
-- IDEMPOTENCY
-- REVOKE on a privilege that isn't held is a no-op. Safe to re-run.
-- =============================================================================

REVOKE EXECUTE ON FUNCTION public.user_tenant_id() FROM PUBLIC;

-- Also lock down the other two functions that mutate / leak trial state.
-- update_updated_at_column is a trigger function with no side effects when
-- called directly, so leave it on PUBLIC.
REVOKE EXECUTE ON FUNCTION public.expire_old_trials()           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.expire_old_trials()           FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_trial_access(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_active_trial_access(text) FROM anon, authenticated;
