-- Migration: Add data retention tracking (90 days post-cancellation)
-- See: ~/.gstack/projects/Ealanisln-vetify/ealanis-feature-data-retention-eng-review-plan-20260428.md
--
-- Adds three columns to Tenant for the retention lifecycle:
--   canceledAt              when subscription first became non-active
--   dataRetentionEndsAt     when prisma.tenant.delete() should fire (canceledAt + 90d)
--   retentionWarningSentAt  idempotency marker for the T-7 warning email
--
-- Plus a partial index over the cron's hot query (find tenants whose retention has expired).

ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "canceledAt"             TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "dataRetentionEndsAt"    TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "retentionWarningSentAt" TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Tenant_dataRetention_idx"
  ON "Tenant" ("dataRetentionEndsAt")
  WHERE "subscriptionStatus" IN ('CANCELED','UNPAID','INCOMPLETE_EXPIRED');
