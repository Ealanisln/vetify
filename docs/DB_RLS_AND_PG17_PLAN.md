# Vetify — Supabase DB Security + PG 17 Upgrade Remediation Plan

**Date:** 2026-05-23 (updated 2026-05-23 to add prod-backup + anonymized restore to Phase 1)
**Source audit:** `~/.gstack/projects/Ealanisln-vetify/ealanis-db-health-audit-20260523.md`
**Confirmed decisions:**
- Dev reset strategy: **wipe dev, re-baseline from prod schema dump, restore anonymized prod data**
- Sequencing: **two windows — RLS hardening first, PG 17 upgrade second**
- Backup discipline: **fresh on-demand prod snapshot now (before Phase 1) doubles as Phase 2 rollback insurance**

---

## Context

Supabase has emailed alerts about RLS gaps and outstanding PG 15 security patches in the `vetify-app` project. An audit run via the Supabase MCP confirmed three concurrent problems that need to be fixed together:

1. **RLS posture is broken.** Prod has 16 public tables without RLS (including `Webhook` with an exposed `secret` column); dev has ~50 tables without RLS (i.e. effectively no RLS at all). Three prod policies use `USING (true)` / `WITH CHECK (true)` which bypass tenant isolation entirely (`User`, `UserRole`, `AppointmentRequest`). Several Postgres functions have mutable `search_path` and `user_tenant_id()` is callable by `anon` as `SECURITY DEFINER` — a privilege-escalation surface.

2. **Migration history is broken.** Prod was assembled from a mix of Prisma migrations and direct SQL applied in Supabase (the RLS bootstrap migration `07_row_level_security_v2` exists only in Supabase's `_prisma_migrations` table, not in the repo's `prisma/migrations/`). Dev has 34 migrations with different version IDs than prod's 38 — the histories diverged at the source. The repo also has 7 tables defined in `schema.prisma` with no corresponding `migration.sql` file: `Location`, `StaffLocation`, `InventoryTransfer`, `Testimonial`, `SystemPromotion`, `LandingPageAnalytics`, `CashShift`.

3. **Version drift.** Prod runs Postgres 15.8.1.131 (security patches pending); dev runs Postgres 17.6.1.016. Anything PG-version-sensitive can behave differently between environments. Aligning prod to PG 17 also picks up the security patches Supabase is asking us to apply.

The intended outcome: the repo's `prisma/migrations/` becomes the single source of truth for the schema; dev and prod converge on PG 17 with identical RLS; the Supabase advisor returns zero ERROR-level findings.

---

## Workstream overview

| Phase | Title | Risk | Production impact | Status |
|---|---|---|---|---|
| 0 | Pre-flight: baseline the repo + author the new migrations | none | none — all reads + local files | ✅ Done (commit `d8ba84e`, 2026-05-23) |
| 1 | Dev reset: prod backup + wipe + re-baseline + restore (anonymized) + verify | low | none in prod (read-only snapshot) | ✅ Done (2026-05-23) |
| 2 | **Window 1** — RLS hardening on prod | medium | brief cron pause | 🔄 Pre-flight starting 2026-05-24 |
| 3 | **Window 2** — PG 17 upgrade on prod | medium | 5–10 min downtime | ⏳ Pending |
| 4 | Performance hygiene PR | low | none (CONCURRENTLY) | ⏳ Pending |
| 5 | Verification + ongoing discipline | none | none | ⏳ Pending |

Phases 0 + 1 are entirely safe. Phase 2 is the first production-touching step.

### Phase 1 step checklist
- [x] 1.1 ✅ Prod dump captured 2026-05-23 16:01 CST via pooler `aws-0-us-east-1.pooler.supabase.com:5432` (free tier — no Supabase backups). Files: `prisma/migrations/.audit/prod-{schema,dump}-2026-05-23.*`
- [x] 1.2 ✅ Dev snapshot captured 2026-05-23 16:03 CST via pooler `aws-1-us-east-1.pooler.supabase.com:5432` (PG 17.6, 50 public tables, 0 with RLS — matches audit). File: `prisma/migrations/.audit/dev-snapshot-2026-05-23.dump` (586K, schema+data)
- [x] 1.3 ✅ Dev wiped 2026-05-23 16:05 CST — `DROP SCHEMA public CASCADE` removed 81 objects (50 tables + 31 enums/types)
- [x] 1.4 ✅ All 5 migrations applied via pooler session-mode (`aws-1-us-east-1.pooler.supabase.com:5432`). Result: 50 tables, 49 with RLS (only `_prisma_migrations` excluded by design), 59 policies, 4 functions
- [x] 1.5 ✅ Prod data restored. All 49 public tables match prod row counts exactly. (`--disable-triggers` warnings ignored — pg_dump's topological order made FK validation succeed naturally.)
- [x] 1.6 ✅ `scripts/anonymize-dev.mjs` run. 26 Users + 38 Customers + 18 Staff scrubbed, 25 Pets renamed, 13 Tenants marked TEST + Stripe IDs nulled, 2 invitations rotated, 6 audit/log tables truncated. Leak counters all zero.
- [x] 1.7 ✅ Advisor + spot-checks pass. **Bug found & fixed:** migration `1_rls_function_hardening` revoked from anon/authenticated but not from PUBLIC, leaving user_tenant_id() callable. Authored migration `5_revoke_public_execute_user_tenant_id`. Remaining advisor findings: 5 INFO (RLS-on-no-policy: by-design default-deny per migration 2), 1 WARN (AppointmentRequest public insert: by design), 1 ERROR (`_prisma_migrations` RLS — decision pending).
- [x] 1.8 ✅ Dumps encrypted with gpg AES256-symmetric. Passphrase stored in user's password manager. Files: `prisma/.audit/{prod-dump,dev-snapshot}-2026-05-23.dump.gpg`. To decrypt for Phase 2 rollback: `gpg --decrypt --pinentry-mode loopback prisma/.audit/prod-dump-2026-05-23.dump.gpg > /tmp/restore.dump`

**Phase 1 complete (2026-05-23).** Dev = prod-schema + anonymized prod-data + 6 RLS migrations applied. Advisor: 0 ERRORs, 1 expected WARN (public booking), 6 expected INFO (default-deny audit tables). Found and fixed bug in migration 1 (PUBLIC EXECUTE not revoked) via new migration 5; added migration 6 to lock down `_prisma_migrations`. Both fixes will also apply to prod in Phase 2.

### Phase 2 step checklist
- [x] P1 ✅ 2026-05-24: prod `_prisma_migrations` has **21 OLD entries**, no `0_init`. **Rebaseline required** before W2 (decided: clean rebaseline — delete old, mark 0_init applied).
- [x] P2 ✅ Prod advisor baseline saved: **15 ERROR** (14 rls_disabled + 1 sensitive_columns_exposed on Webhook.secret), 9 WARN (3 USING(true), 4 search_path_mutable, 2 SECURITY DEFINER, 1 pg_version), 3 INFO (RLS-no-policy).
- [x] P4 ✅ Prod pooler reachable via `aws-0-us-east-1.pooler.supabase.com:5432`. PG 15.8, 50 tables, 35 with RLS.
- [ ] Open Phase 2 PR against `development`
- [ ] P3 Fresh prod pg_dump → encrypt → shred plaintext
- [ ] W1 Pause `/api/cron/daily-tasks` via Vercel dashboard
- [ ] W1.5 **NEW** — Reconcile `_prisma_migrations`: DELETE 21 old entries + `prisma migrate resolve --applied 0_init`
- [ ] W2 `pnpm prisma migrate deploy` against prod (now applies 1–6 cleanly)
- [ ] W3 Advisor diff + function ACL spot-check + `/api/health` + 4 smoke flows
- [ ] W4 Re-enable cron + 30 min GlitchTip/Sentry watch
- [ ] W5 Merge PR + final tracker update

---

## Phase 0 — Pre-flight: build the canonical migration set

Branch: `fix/db-rls-and-pg17`

### 0.1 Capture the prod schema as the new source of truth
- Run `pg_dump --schema-only --no-owner --no-privileges` against the prod DB into a working file. Use Supabase MCP `execute_sql` with `pg_dump`-equivalent queries (`pg_get_tabledef`, `pg_get_functiondef`, `pg_policies`, `pg_class`) since shell `pg_dump` requires network credentials. Save to `prisma/migrations/.audit/prod-schema-2026-05-23.sql` (gitignored).
- Verify the dump against the live `Pet`, `Customer`, `Tenant`, `Webhook` tables manually.

### 0.2 Re-baseline `prisma/migrations/`
- Move the existing `prisma/migrations/` folder to `prisma/migrations.archive-2026-05-23/`.
- Create a fresh `prisma/migrations/0_init/migration.sql` containing the full prod schema (tables, indexes, FKs, enums, functions, policies). This becomes the new baseline.
- On prod, mark this migration as already applied via `prisma migrate resolve --applied 0_init` (no-op since schema already exists). On dev (after wipe in Phase 1), it will run normally.

### 0.3 Author the new security migrations
Create these as discrete migrations on top of the new baseline, in order:

1. **`prisma/migrations/1_rls_function_hardening/migration.sql`**
   ```sql
   ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
   ALTER FUNCTION public.user_tenant_id()           SET search_path = '';
   ALTER FUNCTION public.expire_old_trials()        SET search_path = '';
   ALTER FUNCTION public.has_active_trial_access()  SET search_path = '';
   REVOKE EXECUTE ON FUNCTION public.user_tenant_id() FROM anon, authenticated;
   -- Keep service_role/postgres EXECUTE intact so policies can still call it.
   ```

2. **`prisma/migrations/2_rls_enable_missing_tables/migration.sql`** — enable RLS on the 16 prod tables missing it and add tenant-scoped policies. For each of `Webhook`, `WebhookDeliveryLog`, `EmailLog`, `Location`, `StaffLocation`, `Testimonial`, `SystemPromotion`, `InventoryTransfer`, `LandingPageAnalytics`, `ReferralPartner`, `ReferralCode`, `ReferralConversion`, `CashShift`, `SecurityAuditLog`, `_prisma_migrations`:
   ```sql
   ALTER TABLE public."Webhook" ENABLE ROW LEVEL SECURITY;
   CREATE POLICY webhook_tenant_isolation ON public."Webhook"
     FOR ALL TO authenticated
     USING ("tenantId" = public.user_tenant_id())
     WITH CHECK ("tenantId" = public.user_tenant_id());
   ```
   Service-role-only tables (`SecurityAuditLog`, `AdminAuditLog`, `_prisma_migrations`) get `FOR ALL TO authenticated USING (false)` — they should never be reachable from the API. Confirmed safe: the audit + Explore phase verified that all access is through Prisma + the service role, which bypasses RLS.
   Use `CREATE POLICY IF NOT EXISTS` and `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is idempotent — running this against prod (which has some RLS already) won't double-enable.

3. **`prisma/migrations/3_rls_replace_using_true/migration.sql`** — tighten the three permissive policies:
   ```sql
   DROP POLICY IF EXISTS user_access ON public."User";
   CREATE POLICY user_tenant_isolation ON public."User"
     FOR ALL TO authenticated
     USING ("tenantId" = public.user_tenant_id())
     WITH CHECK ("tenantId" = public.user_tenant_id());

   DROP POLICY IF EXISTS user_role_access ON public."UserRole";
   CREATE POLICY user_role_tenant_isolation ON public."UserRole"
     FOR ALL TO authenticated
     USING (EXISTS (SELECT 1 FROM public."User" u
                    WHERE u.id = "UserRole"."userId"
                      AND u."tenantId" = public.user_tenant_id()));

   -- AppointmentRequest: keep the public-insert policy, drop the redundant overlap.
   -- Audit confirmed both policies were intentional but overlap on INSERT for every role.
   -- Keep `appointment_request_public_insert` (public booking form), drop the duplicate.
   DROP POLICY IF EXISTS appointment_request_tenant_isolation ON public."AppointmentRequest"
     /* re-create scoped to SELECT/UPDATE/DELETE only, not INSERT */ ;
   CREATE POLICY appointment_request_tenant_read ON public."AppointmentRequest"
     FOR SELECT TO authenticated
     USING ("tenantId" = public.user_tenant_id());
   CREATE POLICY appointment_request_tenant_modify ON public."AppointmentRequest"
     FOR UPDATE TO authenticated
     USING ("tenantId" = public.user_tenant_id())
     WITH CHECK ("tenantId" = public.user_tenant_id());
   ```

4. **`prisma/migrations/4_storage_bucket_listing_fix/migration.sql`** — drop the broad SELECT policy that lets `anon` list every object in the `tenant-assets` bucket. Object URLs continue to work (PostgREST serves them by URL, not by listing).

### 0.4 Validation locally
- Spin up a local Postgres 17 via `pnpm supabase start` (or `docker compose` if no Supabase CLI). Run `prisma migrate deploy`. Confirm `_prisma_migrations` shows all 5 new entries applied without error.
- Read every new policy with `\d+ public."TableName"` to confirm exact wording.

**Phase 0 has zero production impact and can be done over a couple of working days. PR titled `fix(db): rebaseline migrations + RLS hardening` opens against `development`.**

---

## Phase 1 — Dev reset (with prod backup + anonymized restore)

### 1.1 Take a fresh prod backup (now, before any reset)
**Free-tier reality:** the `vetify-app` project is on Supabase's free tier, which does **not** include managed backups or PITR. The local `pg_dump` file we create here is therefore the **only** rollback target we have — for both the dev restore AND for Phase 2. Treat it as load-bearing.

- Pull a data-only logical dump from prod (project id `rqxhmhplxeiprzprobdb`) to a trusted workstation:
  ```bash
  mkdir -p prisma/migrations/.audit
  pg_dump --data-only --disable-triggers --no-owner --no-privileges --no-acl \
    --format=custom \
    --file=prisma/migrations/.audit/prod-dump-2026-05-23.dump \
    "$PROD_DATABASE_URL"
  ```
- Also pull a schema-only dump as a safety net (small file, useful for diff'ing against the rebaseline):
  ```bash
  pg_dump --schema-only --no-owner --no-privileges --no-acl \
    --file=prisma/migrations/.audit/prod-schema-2026-05-23.sql \
    "$PROD_DATABASE_URL"
  ```
- Verify the data dump is non-empty and roughly the expected size (production DB is ~17 MB per audit; expect a compressed `.dump` of a few MB).
- The dump contains real PII (customer names, emails, phones, webhook secrets). Gitignored under `prisma/migrations/.audit/`. **Do not delete in step 1.8** — encrypt and keep through Phase 2 since this is our only rollback target.

### 1.2 Snapshot dev
- Take a one-off Supabase backup of `vetify-app-dev` (project id `neyznxeecossozkffets`) for rollback insurance (we don't care about current dev data, but we want the 7-day option).

### 1.3 Wipe dev
- In the Supabase dashboard for `vetify-app-dev`: drop all tables in `public` schema, drop the functions, drop the policies. Or simpler — use Supabase's "Reset database" option if available.
- Verify with `\dt public.*` returning empty.

### 1.4 Re-baseline dev schema from Phase 0 migrations
- Set `DATABASE_URL` in `.env.local` to dev. Run `pnpm prisma migrate deploy`.
- Expected: all 5 migrations from Phase 0 apply cleanly (`0_init`, `1_rls_function_hardening`, `2_rls_enable_missing_tables`, `3_rls_replace_using_true`, `4_storage_bucket_listing_fix`).
- Confirm `_prisma_migrations` shows 5 entries, all applied. Confirm `\dt public.*` shows all 50+ tables with RLS enabled.

### 1.5 Restore prod data into dev
- Restore the data-only dump from 1.1 into the freshly-migrated dev DB:
  ```bash
  pg_restore --data-only --disable-triggers --no-owner --no-acl \
    --dbname="$DEV_DATABASE_URL" .audit/prod-dump-2026-05-23.dump
  ```
- `--disable-triggers` is required so the dump can insert into RLS-enabled tables without the policies blocking inserts (we're restoring as the postgres role, which bypasses RLS, but triggers like `updated_at` still fire).
- Expected: all prod rows land in dev. Check counts on a few tables: `SELECT COUNT(*) FROM "Tenant"`, `"Pet"`, `"Customer"` should match prod.

### 1.6 Anonymize dev
**Critical:** the data in dev right now is real PII (Mexican LFPDPPP territory) and real secrets. Before anyone touches dev, run the anonymization pass.

- Create `scripts/anonymize-dev.mjs` that, against `DEV_DATABASE_URL` only (guard with a hostname check — refuse to run if URL contains `rqxhmhplxeiprzprobdb`):
  1. **PII scrub** — replace `Customer.firstName`, `Customer.lastName`, `Customer.email`, `Customer.phone`, `User.email`, `User.firstName`, `User.lastName`, `Pet.name`, `AppointmentRequest.customerName/Email/Phone` with `@faker-js/faker` data, keyed deterministically on the row id so referential consistency holds across sessions.
  2. **Secret rotation** — regenerate `Webhook.secret` with `crypto.randomBytes(32).toString('hex')` for every row. Truncate `WebhookDeliveryLog.requestBody`/`responseBody` to `'[REDACTED]'` so historical PII in payloads is gone.
  3. **Token nulling** — null out `User.kindeRefreshToken` (if present), `Tenant.stripeCustomerId`, `Tenant.stripeSubscriptionId`, any Kinde access tokens cached in the DB. Login from dev will then re-auth from scratch.
  4. **Audit log purge** — `TRUNCATE "SecurityAuditLog", "AdminAuditLog", "TrialAccessLog" RESTART IDENTITY` — these contain user activity traces we don't want in dev.
- Run it: `DATABASE_URL=$DEV_DATABASE_URL node scripts/anonymize-dev.mjs`.
- Verify a few rows by hand: open Prisma Studio against dev, confirm `Customer.email` no longer matches prod, confirm `Webhook.secret` is different from prod for the same row id.

### 1.7 Verify
- Re-run the Supabase advisor against dev: `mcp__supabase-alanis__get_advisors type=security project_id=neyznxeecossozkffets`. Expected: zero ERROR-level findings, zero `rls_disabled_in_public`.
- Smoke-test the app against dev: login (will re-auth via Kinde since tokens were nulled) → load dashboard with anonymized customer/pet data → create a new pet → submit a public booking form → trigger a test webhook delivery (should succeed with new rotated secret, not the prod one).
- Sanity-check that no prod-looking PII remains: `psql $DEV_DATABASE_URL -c "SELECT email FROM \"Customer\" WHERE email LIKE '%@%vetify%' LIMIT 5;"` — should return only faker addresses.

### 1.8 Secure the dump (keep through Phase 2 — free tier = no other backup)
- **Do NOT delete the dump after Phase 1.** On free tier, this is the only rollback target we have for Phase 2. Encrypt it in place:
  ```bash
  age -p -o prisma/migrations/.audit/prod-dump-2026-05-23.dump.age \
      prisma/migrations/.audit/prod-dump-2026-05-23.dump \
    && shred -u prisma/migrations/.audit/prod-dump-2026-05-23.dump
  ```
  (Or `gpg --symmetric` if `age` isn't installed.) Store the passphrase in your password manager.
- Keep the encrypted `.age` file on the workstation through Phase 2. Take a **second fresh dump** right before Phase 2 (see Phase 2.1) — that becomes the tight rollback target; this older dump is the wider net.
- After Phase 2 stabilizes (≥48h, advisor green), you may delete or archive the old dumps.

**Phase 1 has zero production impact.** All prod-touching steps are read-only (the on-demand backup is a Supabase-side snapshot operation; `pg_dump` is a read).

---

## Phase 2 — Window 1: RLS hardening on prod

Scheduled for a low-traffic time (suggest weekday early morning in the Mexico City timezone).

### 2.1 Pre-flight
- **Take a second fresh `pg_dump` of prod** to `prisma/migrations/.audit/prod-dump-pre-rls-window-<date>.dump`, then encrypt with `age` per Phase 1.8. On free tier this is the rollback target — there is no Supabase backup to fall back to. Verify the dump file is non-empty and of plausible size before proceeding.
- Announce maintenance window internally (no public-facing impact expected, but conservative).
- Confirm the PR from Phase 0 has been reviewed and is green on CI.

### 2.2 Freeze
- Disable the 4 Vercel cron jobs: `/api/cron/daily-tasks`, `/api/cron/appointment-reminders`, `/api/cron/inventory-alerts`, `/api/cron/treatment-reminders`. Either via Vercel dashboard or by temporarily renaming the cron config in `vercel.json`.
- Lock the `main` branch from merges for the duration.

### 2.3 Apply migrations
- Merge the Phase 0 PR to `development`, then to `main`.
- Run `pnpm prisma migrate deploy` against prod (Vercel deployment will do this in `vercel-build`, OR run it manually from a local shell with the prod `DATABASE_URL`).
- Expected: 4 new migrations applied (`1_rls_function_hardening`, `2_rls_enable_missing_tables`, `3_rls_replace_using_true`, `4_storage_bucket_listing_fix`). The `0_init` migration is already marked as applied from Phase 0.3.

### 2.4 Verify
- Re-run `get_advisors type=security project_id=rqxhmhplxeiprzprobdb`. Expected: zero `rls_disabled_in_public`, zero `sensitive_columns_exposed`, zero `rls_policy_always_true`, zero `function_search_path_mutable`, no `anon_security_definer_function_executable` for `user_tenant_id`.
- Smoke-test prod paths: login as a real tenant → confirm dashboard loads → create a pet → submit a public booking form to confirm the anonymous INSERT policy still works → trigger a webhook delivery to confirm the outbound HMAC signing still has access to `Webhook.secret` via Prisma + service role.

### 2.5 Resume
- Re-enable the 4 Vercel cron jobs.
- Watch GlitchTip / Sentry for elevated 5xx for 30 minutes post-resume.

### 2.6 Rollback if needed
- `prisma migrate resolve --rolled-back` for each of the 4 new migrations, then revert the SQL by hand (DROP POLICY / ALTER FUNCTION SET search_path TO public). The pre-window backup snapshot is the nuclear option.

**Phase 2 window: estimated 30–45 minutes total, with the migration step itself taking <60 seconds.**

---

## Phase 3 — Window 2: Postgres 17 upgrade on prod

Scheduled **separately** from Phase 2 — ideally 3–7 days later, after Phase 2 has had time to stabilize. Off-hours window.

### 3.1 Pre-flight
- Confirm prod has a fresh automated backup and PIT recovery is enabled. Note the recovery point timestamp.
- Confirm `package.json` and Prisma versions: `@prisma/client 6.10.1`, `prisma 6.5.0` — both PG 17–compatible.
- Confirm the pooler endpoint: from the Supabase dashboard, note the current Supavisor (or pgBouncer) port and mode. The upgrade may rotate the pooler URL — have the new one ready to paste into Vercel env vars.

### 3.2 Freeze
- Disable the 4 Vercel cron jobs (same as Phase 2).
- Briefly disable new deployments to Vercel during the upgrade.

### 3.3 Upgrade
- In the Supabase dashboard for `vetify-app` → Database → Infrastructure → "Upgrade Postgres version" → select Postgres 17 (latest patch). Confirm.
- Supabase performs the in-place upgrade. Expected duration: 5–10 minutes of write unavailability.

### 3.4 Update connection strings (if changed)
- After the upgrade, copy the new `DATABASE_URL` and `DIRECT_URL` from the Supabase dashboard if they changed.
- Update Vercel env vars for `production` environment.
- Trigger a redeploy.

### 3.5 Verify
- `mcp__supabase-alanis__get_project id=rqxhmhplxeiprzprobdb` — confirm `database.version` starts with `17.`.
- Re-run security advisor — confirm `vulnerable_postgres_version` warning is gone.
- Smoke-test the same paths as Phase 2.4. Specifically watch for any query that hits the planner differently in PG 17.
- Run the weekly P0/P1 smoke test suite: `pnpm test:e2e:weekly:p0`.

### 3.6 Resume
- Re-enable cron jobs.
- Watch error rates for 24 hours.

**Phase 3 window: estimated 30–60 minutes total clock time, with 5–10 minutes of actual write unavailability during the Supabase upgrade.**

---

## Phase 4 — Performance hygiene PR

Done after Phase 3 has stabilized for at least 48 hours. No maintenance window required — all changes use `CREATE INDEX CONCURRENTLY` and idempotent `DROP INDEX IF EXISTS`.

### 4.1 Author migration
`prisma/migrations/5_perf_hygiene/migration.sql`:

- Add covering indexes for the 18 unindexed FKs in prod (see audit §12 for the full list). Example:
  ```sql
  CREATE INDEX CONCURRENTLY IF NOT EXISTS "Customer_userId_idx"
    ON public."Customer" ("userId");
  ```
- Drop the confirmed duplicate indexes (from audit §15): `TrialAccessLog_tenant_user_idx`, `TrialAccessLog_tenant_feature_idx`, `idx_pet_tenant_customer`, `idx_customer_tenant_active`, `idx_staff_tenant_active`, `idx_tenant_subscription_status`.

### 4.2 Deploy
- Standard PR → `development` → `main`. No cron pause needed.

---

## Phase 5 — Verification + ongoing discipline

### 5.1 Set up a weekly advisor check
- Add a `/loop` schedule (or a manual ritual): every Monday morning, run security + performance advisors via the Supabase MCP. File any new findings.

### 5.2 Document the new discipline
- Add a short section to `CLAUDE.md` titled "Schema change discipline": **all** DB schema changes go through `prisma/migrations/`. Never apply SQL directly in the Supabase dashboard. If you need a hotfix in Supabase, write a follow-up Prisma migration the same day.

### 5.3 Capture the win
- Note in `CHANGELOG.md` under the next release: "Hardened Row Level Security across all public tables; upgraded Postgres to v17 with latest security patches; reconciled dev with prod schema."

---

## Critical files

- **`prisma/migrations/`** — entire directory is rebaselined in Phase 0 and gets 4 new migrations in Phase 0 + 1 more in Phase 4
- **`prisma/schema.prisma`** — no changes needed (models already match prod); will verify after dev reset
- **`src/lib/webhooks/webhook-delivery.ts:131-146`** — confirmed safe under new RLS (service role bypasses)
- **`src/lib/setup/setup-token.ts:26-39`** — confirmed safe under new RLS
- **`src/lib/invitations/invitation-token.ts:109-133`** — confirmed safe under new RLS
- **`src/app/api/public/appointments/route.ts:138`** — relies on anonymous INSERT policy; confirmed retained in migration 3
- **`src/app/api/cron/*`** — pause + resume during both windows
- **`vercel.json`** — cron schedule definitions; may be edited to disable during windows
- **`CLAUDE.md`** — append schema discipline section in Phase 5
- **`scripts/anonymize-dev.mjs`** — new in Phase 1.6; scrubs PII + rotates secrets in dev after the prod-data restore. Guards against ever running against prod via URL hostname check.
- **`prisma/migrations/.audit/prod-dump-2026-05-23.dump`** (gitignored) — local-only data-only dump used for the Phase 1.5 restore; deleted/encrypted in Phase 1.8.

## Existing utilities reused

- `pnpm prisma migrate deploy` — Phase 0, 1, 2 deployment mechanism
- `pnpm prisma migrate resolve --applied <name>` — used in Phase 0 to mark the rebaseline as already applied on prod
- `pg_dump --data-only --disable-triggers` / `pg_restore --data-only --disable-triggers` — Phase 1.1 + 1.5 prod→dev data copy
- `@faker-js/faker` (already a transitive dep via `@faker-js/faker` if not installed, `pnpm add -D` it) — used by `scripts/anonymize-dev.mjs` in Phase 1.6
- `scripts/seed-production.mjs` — superseded by the prod-restore + anonymize flow in Phase 1; keep as a fallback if the restore fails
- `mcp__supabase-alanis__get_advisors` — verification gate at the end of every phase
- `mcp__supabase-alanis__execute_sql` — schema dump in Phase 0, smoke checks throughout
- `src/lib/prisma.ts` — already isolates the Prisma client; no changes needed
- The `set_config('app.current_tenant_id', ...)` pattern in `src/lib/prisma.ts:70-83` — already PG 17 compatible

---

## Verification (end-to-end)

After Phase 2:
- `mcp__supabase-alanis__get_advisors project_id=rqxhmhplxeiprzprobdb type=security` returns zero ERROR-level findings.
- A real-user smoke test on prod: login → create pet → submit booking form anonymously → trigger a webhook delivery → confirm all succeed.

After Phase 3:
- `mcp__supabase-alanis__get_project id=rqxhmhplxeiprzprobdb` shows `database.version` starting with `17.`.
- Security advisor no longer flags `vulnerable_postgres_version`.
- `pnpm test:e2e:weekly:p0` passes against prod.

After Phase 4:
- Performance advisor `unindexed_foreign_keys` count drops from 18 → 0 in prod.
- `duplicate_index` count drops from 2 → 0 in prod.

After Phase 5:
- Weekly advisor ritual is set up and has run at least once.
- `CLAUDE.md` documents the new schema-change discipline.

---

## What is NOT in this plan

- **Installing `pg_stat_monitor` and `pgaudit`** — useful but optional (audit §17). Defer until after Phase 5; no security reason to rush them.
- **Cleaning up the 100+ "unused indexes"** — most are unused only because traffic is low (audit §15). Re-evaluate after 30 days of meaningful prod traffic on PG 17. Will likely keep most.
- **Migrating away from Kinde Auth or changing the auth model** — out of scope. RLS policies use `public.user_tenant_id()`, which already resolves the right identity for the existing auth flow.
- **Multi-region failover, read replicas, or HA work** — premature for a 17 MB database.

---

## Rollback summary

| Phase | Rollback action |
|---|---|
| 0 | Discard the branch. No state changed. |
| 1 | Dev only. Restore the Phase 1.1 backup if anything weird happens. |
| 2 | `prisma migrate resolve --rolled-back` for the 4 new migrations; revert the SQL by hand. Worst case, restore from the pre-window automated Supabase backup. |
| 3 | Supabase supports rollback to the pre-upgrade snapshot via PIT recovery. Up to 24 hours of writes can be replayed forward after rollback. |
| 4 | Drop the indexes that were just added; restore the dropped duplicates from the archived migration files. |

---

## Estimated effort

| Phase | Human (lead engineer) | CC + gstack equivalent |
|---|---|---|
| 0 — Pre-flight | ~6 hours of careful work (schema dump, rebaseline, write 4 migrations, local validation) | ~1 hour |
| 1 — Dev reset (with prod backup + anonymized restore) | ~2.5 hours (backup wait + dump + wipe + migrate + restore + anonymize script + verify) | ~30 min |
| 2 — RLS window | ~45 min in-window + 30 min monitoring | same (operational) |
| 3 — PG upgrade window | ~60 min in-window + 24h passive monitoring | same (operational) |
| 4 — Perf PR | ~1 hour | ~10 min |
| 5 — Discipline | ~30 min | ~10 min |

Total: ~10 hours of human focus, spread across two weeks. The PG upgrade window itself is the only piece with real user-visible downtime (5–10 minutes).
