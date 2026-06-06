-- =============================================================================
-- 7_add_stripe_webhook_event
-- =============================================================================
-- Adds the StripeWebhookEvent table used for webhook idempotency + visibility.
--
-- WHAT THIS DOES
--   1. Creates the StripeWebhookEventStatus enum and StripeWebhookEvent table.
--      The primary key is the Stripe event id (evt_...), giving at-least-once
--      delivery protection: a redelivered event collides on INSERT, so we can
--      detect duplicates and skip non-idempotent side effects (referral
--      commissions, promotion redemptions).
--   2. Enables RLS with NO policies (default-deny), matching SecurityAuditLog
--      and AdminAuditLog from migration 2. This is an internal table written
--      only by the webhook handler via the postgres/service role, which
--      bypasses RLS — so default-deny keeps anon/authenticated PostgREST
--      callers out without affecting the app.
--
-- IDEMPOTENCY
--   Uses IF NOT EXISTS guards; ENABLE ROW LEVEL SECURITY is itself idempotent.
--   Safe to re-run.
-- =============================================================================

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StripeWebhookEventStatus') THEN
    CREATE TYPE "StripeWebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'SKIPPED');
  END IF;
END
$$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "StripeWebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "livemode" BOOLEAN NOT NULL DEFAULT false,
    "apiVersion" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "error" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StripeWebhookEvent_type_idx" ON "StripeWebhookEvent"("type");
CREATE INDEX IF NOT EXISTS "StripeWebhookEvent_status_idx" ON "StripeWebhookEvent"("status");
CREATE INDEX IF NOT EXISTS "StripeWebhookEvent_receivedAt_idx" ON "StripeWebhookEvent"("receivedAt");

-- Enable RLS (default-deny: no policies; service role bypasses RLS)
ALTER TABLE public."StripeWebhookEvent" ENABLE ROW LEVEL SECURITY;
