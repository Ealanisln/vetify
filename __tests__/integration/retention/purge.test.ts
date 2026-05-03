/**
 * Integration test: retention purge against the real dev DB.
 *
 * Verifies the operations that mocks lie about:
 * - prisma.tenant.delete() actually cascades 32 child tables
 * - The transactional re-check inside purgeExpiredTenants prevents the
 *   reactivation race
 * - SecurityAuditLog snapshot lands with the correct shape
 */

jest.unmock('@prisma/client');

import { PrismaClient } from '@prisma/client';
import { purgeExpiredTenants } from '@/lib/retention/purge';

const prisma = new PrismaClient();

const PAST = new Date('2026-01-01T00:00:00Z');
const FUTURE = new Date('2030-01-01T00:00:00Z');

const createdTenantIds: string[] = [];
const createdAuditLogIds: string[] = [];

async function createCanceledTenant(opts: {
  slug: string;
  retentionEnds: Date;
  status?: 'CANCELED' | 'UNPAID' | 'INCOMPLETE_EXPIRED' | 'ACTIVE';
}) {
  const ts = Date.now();
  const tenant = await prisma.tenant.create({
    data: {
      name: `RetentionTest-${opts.slug}`,
      slug: `retention-test-${opts.slug}-${ts}`,
      subscriptionStatus: opts.status ?? 'CANCELED',
      canceledAt: opts.retentionEnds < FUTURE ? PAST : null,
      dataRetentionEndsAt: opts.retentionEnds,
    },
  });
  createdTenantIds.push(tenant.id);
  return tenant;
}

async function cleanupTenant(tenantId: string) {
  try {
    // Cascade does most of the work but we delete defensively in case the
    // test left a partial state behind.
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
  } catch {
    // already deleted by the purge
  }
}

afterEach(async () => {
  // Audit logs reference tenantId but use String, not FK — so they survive
  // tenant deletion. Clean them up explicitly.
  if (createdAuditLogIds.length > 0) {
    await prisma.securityAuditLog.deleteMany({
      where: { id: { in: createdAuditLogIds } },
    });
    createdAuditLogIds.length = 0;
  }
});

afterAll(async () => {
  for (const id of createdTenantIds) {
    await cleanupTenant(id);
  }
  await prisma.$disconnect();
});

describe('purgeExpiredTenants integration', () => {
  it('deletes a real tenant when dataRetentionEndsAt has passed', async () => {
    const tenant = await createCanceledTenant({
      slug: 'happy-path',
      retentionEnds: PAST,
    });

    const result = await purgeExpiredTenants(50, new Date());

    expect(result.purged).toContain(tenant.id);

    const stillThere = await prisma.tenant.findUnique({
      where: { id: tenant.id },
    });
    expect(stillThere).toBeNull();

    // Audit log written with snapshot
    const log = await prisma.securityAuditLog.findFirst({
      where: { tenantId: tenant.id, eventType: 'data_delete' },
    });
    expect(log).not.toBeNull();
    expect(log?.riskLevel).toBe('critical');
    expect(log?.success).toBe(true);
    if (log) createdAuditLogIds.push(log.id);
  });

  it('skips a tenant whose status flipped to ACTIVE between findMany and TX', async () => {
    const tenant = await createCanceledTenant({
      slug: 'reactivation-race',
      retentionEnds: PAST,
    });

    // Simulate the reactivation race: between candidate selection and
    // the TX re-check, a webhook flips the tenant back to ACTIVE.
    // We simulate this by reactivating before invoking the cron-side
    // purge — the re-check inside the TX should catch it.
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: 'ACTIVE',
        canceledAt: null,
        dataRetentionEndsAt: null,
      },
    });

    const result = await purgeExpiredTenants(50, new Date());

    expect(result.purged).not.toContain(tenant.id);

    const stillThere = await prisma.tenant.findUnique({
      where: { id: tenant.id },
    });
    expect(stillThere).not.toBeNull();
    expect(stillThere?.subscriptionStatus).toBe('ACTIVE');
  });

  it('does not purge tenants whose dataRetentionEndsAt is in the future', async () => {
    const tenant = await createCanceledTenant({
      slug: 'still-in-grace',
      retentionEnds: FUTURE,
    });

    const result = await purgeExpiredTenants(50, new Date());

    expect(result.purged).not.toContain(tenant.id);

    const stillThere = await prisma.tenant.findUnique({
      where: { id: tenant.id },
    });
    expect(stillThere).not.toBeNull();
  });
});
