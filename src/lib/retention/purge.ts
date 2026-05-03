import { prisma } from '../prisma';
import {
  RETENTION_PURGE_BATCH_LIMIT,
  RETENTION_TRIGGER_STATUSES,
} from './constants';
import type { PurgeResult, TenantSnapshot } from './types';

async function captureTenantSnapshot(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  tenantId: string,
): Promise<TenantSnapshot | null> {
  const tenant = await tx.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      canceledAt: true,
      dataRetentionEndsAt: true,
    },
  });

  if (!tenant) return null;

  const [customers, pets, medicalHistories, appointments, sales, users] =
    await Promise.all([
      tx.customer.count({ where: { tenantId } }),
      tx.pet.count({ where: { tenantId } }),
      tx.medicalHistory.count({ where: { tenantId } }),
      tx.appointment.count({ where: { tenantId } }),
      tx.sale.count({ where: { tenantId } }),
      tx.user.count({ where: { tenantId } }),
    ]);

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    canceledAt: tenant.canceledAt,
    dataRetentionEndsAt: tenant.dataRetentionEndsAt,
    counts: { customers, pets, medicalHistories, appointments, sales, users },
  };
}

export async function purgeExpiredTenants(
  limit: number = RETENTION_PURGE_BATCH_LIMIT,
  now: Date = new Date(),
): Promise<PurgeResult> {
  const candidates = await prisma.tenant.findMany({
    where: {
      subscriptionStatus: { in: [...RETENTION_TRIGGER_STATUSES] },
      dataRetentionEndsAt: { lt: now, not: null },
    },
    select: { id: true, slug: true },
    take: limit + 1,
    orderBy: { dataRetentionEndsAt: 'asc' },
  });

  const toProcess = candidates.slice(0, limit);
  const remaining = candidates.length > limit;

  const result: PurgeResult = {
    scanned: toProcess.length,
    purged: [],
    skippedReactivated: [],
    failed: [],
    remaining,
  };

  for (const candidate of toProcess) {
    try {
      const outcome = await prisma.$transaction(async (tx) => {
        // Re-check inside the transaction. If the tenant reactivated
        // between findMany and now, dataRetentionEndsAt will be null
        // (cleared by handleSubscriptionChange) or status will be ACTIVE.
        const fresh = await tx.tenant.findUnique({
          where: { id: candidate.id },
          select: {
            id: true,
            subscriptionStatus: true,
            dataRetentionEndsAt: true,
          },
        });

        if (!fresh) {
          return { kind: 'gone' as const };
        }

        const stillEligible =
          fresh.dataRetentionEndsAt !== null &&
          fresh.dataRetentionEndsAt < now &&
          (RETENTION_TRIGGER_STATUSES as readonly string[]).includes(
            fresh.subscriptionStatus,
          );

        if (!stillEligible) {
          return { kind: 'reactivated' as const };
        }

        const snapshot = await captureTenantSnapshot(tx, candidate.id);

        await tx.securityAuditLog.create({
          data: {
            eventType: 'data_delete',
            tenantId: candidate.id,
            ipAddress: 'system:retention-cron',
            userAgent: 'system:retention-cron',
            endpoint: '/api/cron/daily-tasks',
            method: 'POST',
            resource: 'Tenant',
            resourceId: candidate.id,
            riskLevel: 'critical',
            success: true,
            details: snapshot ? { snapshot } : { snapshot: null },
          },
        });

        await tx.tenant.delete({ where: { id: candidate.id } });

        return { kind: 'purged' as const };
      });

      if (outcome.kind === 'purged') {
        result.purged.push(candidate.id);
      } else if (outcome.kind === 'reactivated') {
        result.skippedReactivated.push(candidate.id);
      }
    } catch (error) {
      result.failed.push({
        tenantId: candidate.id,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error('purgeExpiredTenants: failed to purge tenant', {
        tenantId: candidate.id,
        slug: candidate.slug,
        error,
      });
    }
  }

  return result;
}
