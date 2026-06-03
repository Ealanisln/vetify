-- =============================================================================
-- 4_storage_bucket_listing_fix
-- =============================================================================
-- Fixes Supabase advisor finding:
--   * public_bucket_allows_listing on the `tenant-assets` bucket (dev only,
--     possibly prod too — verify in Phase 2 pre-flight).
--
-- WHAT THIS DOES
--   Drops the broad SELECT policy on storage.objects scoped to the
--   `tenant-assets` bucket. Public buckets serve objects by URL — they do
--   NOT need a SELECT policy on storage.objects for that. The policy was
--   only enabling clients to LIST every object in the bucket.
--
-- IDEMPOTENCY: DROP POLICY IF EXISTS is safe even if the policy never
-- existed on this environment.
-- =============================================================================

DROP POLICY IF EXISTS "Public read access for tenant assets" ON storage.objects;

-- Note: any signed URLs or direct object URLs continue to work. Only
-- enumeration via the storage.objects table is disabled.
