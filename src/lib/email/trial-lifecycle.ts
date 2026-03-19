/**
 * Trial Lifecycle Email Service
 *
 * Processes trial expiration notifications:
 * - Sends warning emails when trials are ending soon (<=3 days)
 * - Sends expired emails when trials have expired
 * - Respects cooldown periods to avoid spam
 */

import { prisma } from '@/lib/prisma';
import { calculateTrialDaysRemaining } from '@/lib/trial/utils';
import { TRIAL_WARNING_DAYS } from '@/lib/constants';
import { sendEmail } from './email-service';
import { formatDateLong } from '../utils/date-format';
import type { TrialExpiringData, TrialExpiredData } from './types';

/** Minimum hours between expiring emails for the same tenant */
const EXPIRING_COOLDOWN_HOURS = 24;
/** Minimum days between expired emails for the same tenant */
const EXPIRED_COOLDOWN_DAYS = 7;

export interface TrialLifecycleResult {
  success: boolean;
  tenantsChecked: number;
  expiringEmailsSent: number;
  expiredEmailsSent: number;
}

export async function processTrialLifecycleEmails(): Promise<TrialLifecycleResult> {
  const result: TrialLifecycleResult = {
    success: true,
    tenantsChecked: 0,
    expiringEmailsSent: 0,
    expiredEmailsSent: 0,
  };

  try {
    // Find all tenants still in trial with a known end date
    const tenants = await prisma.tenant.findMany({
      where: {
        isTrialPeriod: true,
        trialEndsAt: { not: null },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        trialEndsAt: true,
        lastTrialCheck: true,
      },
    });

    result.tenantsChecked = tenants.length;

    for (const tenant of tenants) {
      try {
        // calculateTrialDaysRemaining expects a full Tenant; we only need the fields it checks
        const daysRemaining = calculateTrialDaysRemaining(tenant as Parameters<typeof calculateTrialDaysRemaining>[0]);
        if (daysRemaining === null) continue;

        const now = new Date();

        // Trial ending soon: days <= TRIAL_WARNING_DAYS and > 0
        if (daysRemaining <= TRIAL_WARNING_DAYS && daysRemaining > 0) {
          if (!shouldSendExpiringEmail(tenant.lastTrialCheck, now)) continue;

          const adminEmail = await getAdminEmail(tenant.id);
          if (!adminEmail) continue;

          const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vetify.pro'}/dashboard/settings?tab=subscription`;

          const emailData: TrialExpiringData = {
            template: 'trial-expiring',
            to: { email: adminEmail.email, name: adminEmail.name },
            subject: `⚠️ Tu prueba de Vetify termina en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}`,
            tenantId: tenant.id,
            data: {
              clinicName: tenant.name,
              ownerName: adminEmail.name,
              daysRemaining,
              trialEndsDate: tenant.trialEndsAt!,
              upgradeUrl,
            },
          };

          const sendResult = await sendEmail(emailData);
          if (sendResult.success) {
            result.expiringEmailsSent++;
            await prisma.tenant.update({
              where: { id: tenant.id },
              data: { lastTrialCheck: now },
            });
          }
        }

        // Trial expired: days < 0 (includes day 0 as last day, not expired)
        if (daysRemaining < 0) {
          if (!shouldSendExpiredEmail(tenant.lastTrialCheck, now)) continue;

          const adminEmail = await getAdminEmail(tenant.id);
          if (!adminEmail) continue;

          const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vetify.pro'}/dashboard/settings?tab=subscription`;

          const emailData: TrialExpiredData = {
            template: 'trial-expired',
            to: { email: adminEmail.email, name: adminEmail.name },
            subject: '🔒 Tu prueba gratuita de Vetify ha expirado',
            tenantId: tenant.id,
            data: {
              clinicName: tenant.name,
              ownerName: adminEmail.name,
              expiredDate: tenant.trialEndsAt!,
              upgradeUrl,
            },
          };

          const sendResult = await sendEmail(emailData);
          if (sendResult.success) {
            result.expiredEmailsSent++;
            await prisma.tenant.update({
              where: { id: tenant.id },
              data: { lastTrialCheck: now },
            });
          }
        }
      } catch (error) {
        console.error(`[TRIAL_LIFECYCLE] Error processing tenant ${tenant.id}:`, error);
        // Continue with other tenants
      }
    }
  } catch (error) {
    console.error('[TRIAL_LIFECYCLE] Failed to process trial lifecycle emails:', error);
    result.success = false;
  }

  return result;
}

/**
 * Check if enough time has passed since the last expiring email (24h cooldown)
 */
function shouldSendExpiringEmail(lastCheck: Date | null, now: Date): boolean {
  if (!lastCheck) return true;
  const hoursSince = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);
  return hoursSince >= EXPIRING_COOLDOWN_HOURS;
}

/**
 * Check if enough time has passed since the last expired email (7-day cooldown)
 */
function shouldSendExpiredEmail(lastCheck: Date | null, now: Date): boolean {
  if (!lastCheck) return true;
  const daysSince = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= EXPIRED_COOLDOWN_DAYS;
}

/**
 * Find the admin/manager staff member's email for a tenant
 */
async function getAdminEmail(tenantId: string): Promise<{ email: string; name: string } | null> {
  const admin = await prisma.staff.findFirst({
    where: {
      tenantId,
      isActive: true,
      email: { not: null },
      OR: [
        { position: 'Administrador' },
        { position: 'MANAGER' },
      ],
    },
    select: { email: true, name: true },
    orderBy: { createdAt: 'asc' },
  });

  if (admin?.email) {
    return { email: admin.email, name: admin.name };
  }

  // Fallback: any staff with email
  const anyStaff = await prisma.staff.findFirst({
    where: {
      tenantId,
      isActive: true,
      email: { not: null },
    },
    select: { email: true, name: true },
    orderBy: { createdAt: 'asc' },
  });

  return anyStaff?.email ? { email: anyStaff.email, name: anyStaff.name } : null;
}
