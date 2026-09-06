-- =============================================================================
-- 10_trial_activation_emails
-- =============================================================================
-- Early-lifecycle trial emails (welcome, day-2 activation nudge, day-7
-- check-in). Until now the first email a trial received was the T-3
-- "expiring" warning on day 27.
--
-- WHAT THIS DOES
--   Adds three nullable timestamps on Tenant, one per activation email.
--   Each email is sent at most once: the cron only targets rows whose
--   column is NULL and stamps it after a successful send.
--
-- WHY SEPARATE COLUMNS
--   Tenant.lastTrialCheck already drives the expiring/expired cooldown and
--   is overwritten on every send, so it cannot record "which" email went out.
--
-- BACKFILL
--   None. Existing tenants keep NULLs; the cron additionally bounds every
--   activation email by tenant age (createdAt), so old tenants never receive
--   them retroactively.

ALTER TABLE "Tenant" ADD COLUMN "welcomeEmailSentAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "activationNudgeSentAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "trialCheckinSentAt" TIMESTAMP(3);
