-- =============================================================================
-- 9_tenant_billing_currency
-- =============================================================================
-- First step of multi-currency BILLING (charging subscriptions in local
-- currency), distinct from the display currency shipped in
-- 8_tenant_currency_backfill:
--
--   TenantSettings.currencyCode  -> what the clinic's own POS/tickets show
--   Tenant.billingCurrency       -> what Vetify charges the clinic in
--
-- WHAT THIS DOES
--   1. Adds Tenant.countryCode (ISO-3166-1 alpha-2), chosen at onboarding.
--   2. Adds Tenant.billingCurrency, limited by the app to MXN/CLP/COP/USD
--      (BILLING_CURRENCIES in src/lib/currency.ts).
--   3. Backfills existing tenants to MX/MXN.
--
-- WHY THE MX/MXN BACKFILL IS SAFE
--   Every existing tenant predates any country selector and has only ever
--   been offered MXN prices (the Stripe catalog holds MXN prices only), so
--   MX/MXN records what they are already being charged. New tenants get
--   their values from the onboarding country selector once it ships; until
--   then the MXN default preserves current behavior.

ALTER TABLE "Tenant" ADD COLUMN "countryCode" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "billingCurrency" TEXT NOT NULL DEFAULT 'MXN';

UPDATE "Tenant" SET "countryCode" = 'MX' WHERE "countryCode" IS NULL;
