import { prisma } from '../prisma';
import { sendEmail } from '../email/email-service';
import type { DataRetentionWarningData } from '../email/types';
import {
  RETENTION_TRIGGER_STATUSES,
  RETENTION_WARNING_BATCH_LIMIT,
  RETENTION_WARNING_DAYS_BEFORE,
} from './constants';

export interface RetentionNotifyResult {
  scanned: number;
  sent: string[];
  failed: { tenantId: string; error: string }[];
  skippedNoAdmin: string[];
  remaining: boolean;
}

async function getAdminEmail(
  tenantId: string,
): Promise<{ email: string; name: string } | null> {
  const admin = await prisma.staff.findFirst({
    where: {
      tenantId,
      isActive: true,
      email: { not: null },
      OR: [{ position: 'Administrador' }, { position: 'MANAGER' }],
    },
    select: { email: true, name: true },
    orderBy: { createdAt: 'asc' },
  });
  if (admin?.email) return { email: admin.email, name: admin.name };

  const fallback = await prisma.staff.findFirst({
    where: { tenantId, isActive: true, email: { not: null } },
    select: { email: true, name: true },
    orderBy: { createdAt: 'asc' },
  });
  return fallback?.email
    ? { email: fallback.email, name: fallback.name }
    : null;
}

function daysBetween(later: Date, earlier: Date): number {
  const ms = later.getTime() - earlier.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export async function sendRetentionWarnings(
  limit: number = RETENTION_WARNING_BATCH_LIMIT,
  now: Date = new Date(),
): Promise<RetentionNotifyResult> {
  const windowEnd = new Date(now);
  windowEnd.setUTCDate(
    windowEnd.getUTCDate() + RETENTION_WARNING_DAYS_BEFORE,
  );

  const candidates = await prisma.tenant.findMany({
    where: {
      subscriptionStatus: { in: [...RETENTION_TRIGGER_STATUSES] },
      dataRetentionEndsAt: { not: null, gte: now, lte: windowEnd },
      retentionWarningSentAt: null,
    },
    select: { id: true, name: true, dataRetentionEndsAt: true },
    take: limit + 1,
    orderBy: { dataRetentionEndsAt: 'asc' },
  });

  const toProcess = candidates.slice(0, limit);
  const remaining = candidates.length > limit;

  const result: RetentionNotifyResult = {
    scanned: toProcess.length,
    sent: [],
    failed: [],
    skippedNoAdmin: [],
    remaining,
  };

  for (const tenant of toProcess) {
    try {
      const admin = await getAdminEmail(tenant.id);
      if (!admin) {
        result.skippedNoAdmin.push(tenant.id);
        continue;
      }

      const deletionDate = tenant.dataRetentionEndsAt!;
      const daysRemaining = Math.max(0, daysBetween(deletionDate, now));
      const reactivateUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vetify.pro'}/dashboard/settings?tab=subscription`;

      const emailData: DataRetentionWarningData = {
        template: 'data-retention-warning',
        to: { email: admin.email, name: admin.name },
        subject: `⚠️ La información de ${tenant.name} se eliminará en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}`,
        tenantId: tenant.id,
        data: {
          clinicName: tenant.name,
          ownerName: admin.name,
          daysRemaining,
          deletionDate,
          reactivateUrl,
        },
      };

      const sendResult = await sendEmail(emailData);

      if (sendResult.success) {
        // Mark only on successful send so a Resend outage means we
        // try again tomorrow instead of silently dropping the warning.
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { retentionWarningSentAt: now },
        });
        result.sent.push(tenant.id);
      } else {
        result.failed.push({
          tenantId: tenant.id,
          error: sendResult.error || `status ${sendResult.statusCode}`,
        });
      }
    } catch (error) {
      result.failed.push({
        tenantId: tenant.id,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error('sendRetentionWarnings: failed for tenant', {
        tenantId: tenant.id,
        error,
      });
    }
  }

  return result;
}
