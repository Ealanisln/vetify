#!/usr/bin/env node
// Anonymize a dev DB after restoring prod data. Refuses to run against prod.
// Required env: DATABASE_URL pointing at the dev DB (pooler session mode preferred).

import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROD_REFS = ['rqxhmhplxeiprzprobdb'];
const DEV_REFS = ['neyznxeecossozkffets'];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('FATAL: DATABASE_URL not set');
  process.exit(1);
}

for (const ref of PROD_REFS) {
  if (url.includes(ref)) {
    console.error(`FATAL: refusing to run — DATABASE_URL points at prod project ref "${ref}"`);
    process.exit(2);
  }
}

const matchedDev = DEV_REFS.find(ref => url.includes(ref));
if (!matchedDev) {
  console.error(`FATAL: DATABASE_URL does not match any known dev ref (${DEV_REFS.join(', ')})`);
  console.error('       Add the ref to DEV_REFS if intentional.');
  process.exit(3);
}

console.log(`✓ Target dev project ref: ${matchedDev}`);
console.log(`✓ Anonymizing PII, rotating secrets, purging audit logs...\n`);

const SQL = `
BEGIN;

-- 1. PII scrub: User
UPDATE "User" SET
  email = 'user-' || substring(id from 1 for 8) || '@example.test',
  "firstName" = 'User',
  "lastName" = 'Test-' || substring(id from 1 for 6),
  name = 'Test User ' || substring(id from 1 for 6),
  phone = '+52-555-' || lpad(((random() * 9999)::int)::text, 4, '0'),
  address = NULL;

-- 2. PII scrub: Customer
UPDATE "Customer" SET
  email = 'customer-' || substring(id from 1 for 8) || '@example.test',
  "firstName" = 'Customer',
  "lastName" = 'Test-' || substring(id from 1 for 6),
  name = 'Test Customer ' || substring(id from 1 for 6),
  phone = '+52-555-' || lpad(((random() * 9999)::int)::text, 4, '0');

-- 3. PII scrub: Staff
UPDATE "Staff" SET
  email = CASE WHEN email IS NULL THEN NULL
    ELSE 'staff-' || substring(id from 1 for 8) || '@example.test' END,
  name = 'Test Staff ' || substring(id from 1 for 6),
  phone = CASE WHEN phone IS NULL THEN NULL
    ELSE '+52-555-' || lpad(((random() * 9999)::int)::text, 4, '0') END;

-- 4. Pet names → generic (low risk but consistent)
UPDATE "Pet" SET name = 'Pet-' || substring(id from 1 for 6);

-- 5. Tenants: mark as TEST: + null Stripe IDs (prevents accidental real charges)
UPDATE "Tenant" SET
  name = CASE WHEN name LIKE 'TEST: %' THEN name ELSE 'TEST: ' || name END,
  "stripeCustomerId" = NULL;

-- 6. Webhook secret rotation (CRITICAL: prod secrets must not live in dev)
UPDATE "Webhook" SET
  secret = 'whsec_dev_' || encode(gen_random_bytes(24), 'hex'),
  url = 'https://example.test/webhook/' || substring(id from 1 for 8);

-- 7. TenantSubscription Stripe IDs
UPDATE "TenantSubscription" SET "stripeSubscriptionId" = NULL;

-- 8. Setup tokens + invitation tokens (rotate)
UPDATE "SetupToken" SET
  token = encode(gen_random_bytes(32), 'hex'),
  email = 'setup-' || substring(id from 1 for 8) || '@example.test';

UPDATE "TenantInvitation" SET
  token = encode(gen_random_bytes(32), 'hex'),
  email = 'invite-' || substring(id from 1 for 8) || '@example.test';

-- 9. Purge audit + email + webhook logs (PII-heavy, low value in dev)
TRUNCATE
  "SecurityAuditLog",
  "AdminAuditLog",
  "TrialAccessLog",
  "EmailLog",
  "WebhookDeliveryLog",
  "AutomationLog"
RESTART IDENTITY CASCADE;

-- 10. AppointmentRequest doesn't have direct PII columns (refs Customer via customerId).
--     petName is user-provided free text; scrub it.
UPDATE "AppointmentRequest" SET "petName" = 'TestPet-' || substring(id from 1 for 6);

COMMIT;

-- Sanity check: nothing should match the original prod domains
SELECT
  (SELECT count(*) FROM "Customer" WHERE email !~ '@example\\.test$') AS customer_pii_leak,
  (SELECT count(*) FROM "User" WHERE email !~ '@example\\.test$') AS user_pii_leak,
  (SELECT count(*) FROM "Webhook" WHERE secret NOT LIKE 'whsec_dev_%') AS webhook_secret_leak,
  (SELECT count(*) FROM "Tenant" WHERE "stripeCustomerId" IS NOT NULL) AS stripe_leak,
  (SELECT count(*) FROM "SecurityAuditLog") AS audit_log_remaining;
`;

const tmpDir = mkdtempSync(join(tmpdir(), 'anonymize-dev-'));
const sqlFile = join(tmpDir, 'anonymize.sql');
writeFileSync(sqlFile, SQL, { mode: 0o600 });

try {
  const out = execFileSync(
    'psql',
    [url, '-v', 'ON_ERROR_STOP=1', '-f', sqlFile],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }
  );
  console.log(out);
  console.log('\n✓ Anonymization complete. Verify the leak-check row above is all zeros.');
} catch (err) {
  console.error('\n✗ Anonymization failed. Transaction rolled back.');
  process.exit(err.status ?? 4);
} finally {
  try { unlinkSync(sqlFile); } catch {}
}
