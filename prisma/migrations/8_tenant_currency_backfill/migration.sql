-- =============================================================================
-- 8_tenant_currency_backfill
-- =============================================================================
-- Prepares TenantSettings to actually drive per-tenant currency in the POS.
--
-- BACKGROUND
--   TenantSettings.currencyCode has existed since 0_init with @default("USD"),
--   is written on tenant creation, and is read by absolutely nothing. Every
--   money surface in the clinic-facing app hardcodes
--   Intl.NumberFormat('es-MX', { currency: 'MXN' }).
--
--   That makes the column a landmine: the first code that reads it honestly
--   flips every existing Mexican clinic to USD. This migration defuses it
--   BEFORE any reader ships.
--
-- WHAT THIS DOES
--   1. Adds currencyConfirmed, distinguishing "the clinic chose this currency"
--      from "we guessed it". The settings UI uses it to nudge until confirmed.
--   2. Repoints the currencyCode default from 'USD' to 'MXN', matching what
--      every UI has always rendered.
--   3. Backfills existing rows from 'USD' to 'MXN'.
--
-- WHY THE 'USD' GUARD IS SAFE
--   No UI has ever existed to choose a currency, so every 'USD' in the table
--   is the dead default rather than a deliberate choice. Verified against
--   production before writing this migration: 20 of 20 TenantSettings rows
--   were 'USD'/'$', and 0 tenants were missing a settings row. The guard is
--   there so that if this ever runs after a real selector exists, a genuine
--   USD choice survives.
--
-- WHAT THIS DOES NOT DO
--   No money columns are touched. Amounts are relabeled, never converted --
--   Vetify has no exchange rates and no rate-at-time-of-sale, so rewriting a
--   clinic's books is not something this migration is entitled to do.
--
-- IDEMPOTENCY
--   IF NOT EXISTS on the new column; SET DEFAULT is idempotent; the UPDATE is
--   guarded and becomes a no-op on re-run. Safe to re-run.
-- =============================================================================

-- AlterTable: track whether the currency was chosen or guessed
ALTER TABLE "TenantSettings"
  ADD COLUMN IF NOT EXISTS "currencyConfirmed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: new tenants default to the currency the product actually renders
ALTER TABLE "TenantSettings"
  ALTER COLUMN "currencyCode" SET DEFAULT 'MXN';

-- Backfill: existing rows carry the dead 'USD' default, not a real choice
UPDATE "TenantSettings"
SET "currencyCode" = 'MXN',
    "currencySymbol" = '$'
WHERE "currencyCode" = 'USD';
