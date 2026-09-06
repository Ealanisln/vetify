/**
 * Trial Lifecycle Email Service
 *
 * Processes every email tied to the trial period:
 * - Activation emails early in the trial (each sent at most once per tenant,
 *   tracked by a dedicated column on Tenant):
 *     - Welcome (day 0): sent from onboarding; the cron acts as catch-up.
 *     - Activation nudge (day 2+): only for tenants with zero pets.
 *     - Check-in (day 7+): asks what the clinic is missing.
 * - Expiring warning when the trial is ending soon (<= 3 days)
 * - Expired notice when the trial has ended
 * - Respects cooldown periods to avoid spam
 */

import { prisma } from '@/lib/prisma';
import { calculateTrialDaysRemaining } from '@/lib/trial/utils';
import { TRIAL_WARNING_DAYS } from '@/lib/constants';
import { sendEmail } from './email-service';
import type {
  EmailSendResult,
  TrialExpiringData,
  TrialExpiredData,
  TrialWelcomeData,
  TrialActivationNudgeData,
  TrialCheckinData,
} from './types';

/** Minimum hours between expiring emails for the same tenant */
const EXPIRING_COOLDOWN_HOURS = 24;
/** Minimum days between expired emails for the same tenant */
const EXPIRED_COOLDOWN_DAYS = 7;
/** Stop resending expired emails once the trial ended this many days ago */
const EXPIRED_EMAIL_WINDOW_DAYS = 30;

/** The cron sends the welcome as catch-up only while the tenant is this young */
const WELCOME_CATCHUP_MAX_AGE_DAYS = 2;
/** Nudge tenants without pets once they are at least this old */
const NUDGE_MIN_AGE_DAYS = 2;
/** Check in once the tenant is at least this old */
const CHECKIN_MIN_AGE_DAYS = 7;
/**
 * Upper bound for nudge and check-in. Protects tenants that existed before
 * this feature shipped (and any tenant the cron missed for a long stretch)
 * from receiving "early trial" emails late in their trial.
 */
const ACTIVATION_MAX_AGE_DAYS = 10;

/** Replies to the check-in land in a mailbox a human reads */
const CHECKIN_REPLY_TO = 'contacto@vetify.pro';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface TrialLifecycleResult {
  success: boolean;
  tenantsChecked: number;
  expiringEmailsSent: number;
  expiredEmailsSent: number;
  welcomeEmailsSent: number;
  activationNudgesSent: number;
  checkinEmailsSent: number;
}

/** Tenant fields the lifecycle logic needs */
interface LifecycleTenant {
  id: string;
  name: string;
  isTrialPeriod: boolean;
  trialEndsAt: Date | null;
  lastTrialCheck: Date | null;
  createdAt: Date;
  welcomeEmailSentAt: Date | null;
  activationNudgeSentAt: Date | null;
  trialCheckinSentAt: Date | null;
}

const lifecycleTenantSelect = {
  id: true,
  name: true,
  isTrialPeriod: true,
  trialEndsAt: true,
  lastTrialCheck: true,
  createdAt: true,
  welcomeEmailSentAt: true,
  activationNudgeSentAt: true,
  trialCheckinSentAt: true,
} as const;

type ActivationEmail = 'welcome' | 'nudge' | 'checkin';

export async function processTrialLifecycleEmails(): Promise<TrialLifecycleResult> {
  const result: TrialLifecycleResult = {
    success: true,
    tenantsChecked: 0,
    expiringEmailsSent: 0,
    expiredEmailsSent: 0,
    welcomeEmailsSent: 0,
    activationNudgesSent: 0,
    checkinEmailsSent: 0,
  };

  try {
    // Find all tenants still in trial with a known end date
    const tenants: LifecycleTenant[] = await prisma.tenant.findMany({
      where: {
        isTrialPeriod: true,
        trialEndsAt: { not: null },
        status: 'ACTIVE',
      },
      select: lifecycleTenantSelect,
    });

    result.tenantsChecked = tenants.length;

    for (const tenant of tenants) {
      try {
        const daysRemaining = calculateTrialDaysRemaining(tenant);
        if (daysRemaining === null) continue;

        const now = new Date();

        // Activation emails only while the trial is still running (day 0 is
        // the last day, not expired). At most one activation email per
        // tenant per run so a catch-up never stacks two emails on one day.
        if (daysRemaining >= 0) {
          const sent = await sendPendingActivationEmail(tenant, now);
          if (sent === 'welcome') result.welcomeEmailsSent++;
          if (sent === 'nudge') result.activationNudgesSent++;
          if (sent === 'checkin') result.checkinEmailsSent++;
        }

        // Trial ending soon: days <= TRIAL_WARNING_DAYS and > 0
        if (daysRemaining <= TRIAL_WARNING_DAYS && daysRemaining > 0) {
          if (!shouldSendExpiringEmail(tenant.lastTrialCheck, now)) continue;

          const adminEmail = await getAdminEmail(tenant.id);
          if (!adminEmail) continue;

          const upgradeUrl = `${getAppUrl()}/dashboard/settings?tab=subscription`;

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

        // Trial expired: days < 0 (includes day 0 as last day, not expired).
        // Bounded to EXPIRED_EMAIL_WINDOW_DAYS so stale TRIALING tenants
        // don't keep receiving expired emails indefinitely.
        if (daysRemaining < 0 && daysRemaining >= -EXPIRED_EMAIL_WINDOW_DAYS) {
          if (!shouldSendExpiredEmail(tenant.lastTrialCheck, now)) continue;

          const adminEmail = await getAdminEmail(tenant.id);
          if (!adminEmail) continue;

          const upgradeUrl = `${getAppUrl()}/dashboard/settings?tab=subscription`;

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
 * Send the trial welcome email to a freshly created tenant.
 *
 * Meant to be called from onboarding right after the tenant exists. It never
 * throws: any failure resolves to `{ success: false }` so the caller can fire
 * and forget. Idempotent via `welcomeEmailSentAt`; the daily cron covers
 * tenants where this call failed.
 */
export async function sendTrialWelcomeEmail(tenantId: string): Promise<EmailSendResult> {
  try {
    const tenant: LifecycleTenant | null = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: lifecycleTenantSelect,
    });

    if (!tenant) {
      return { success: false, error: 'Tenant not found' };
    }
    if (!tenant.isTrialPeriod || tenant.welcomeEmailSentAt) {
      return { success: false, error: 'Welcome email not applicable' };
    }

    const daysRemaining = calculateTrialDaysRemaining(tenant);
    if (daysRemaining === null || daysRemaining < 0) {
      return { success: false, error: 'Trial is not active' };
    }

    const sent = await sendWelcomeEmail(tenant, new Date());
    return sent ? { success: true } : { success: false, error: 'Welcome email not sent' };
  } catch (error) {
    console.error(`[TRIAL_LIFECYCLE] Failed to send welcome email for tenant ${tenantId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send whichever activation email is due for this tenant, if any.
 * Priority: welcome catch-up, then nudge, then check-in.
 */
async function sendPendingActivationEmail(
  tenant: LifecycleTenant,
  now: Date
): Promise<ActivationEmail | null> {
  const ageDays = (now.getTime() - tenant.createdAt.getTime()) / MS_PER_DAY;

  if (!tenant.welcomeEmailSentAt && ageDays <= WELCOME_CATCHUP_MAX_AGE_DAYS) {
    return (await sendWelcomeEmail(tenant, now)) ? 'welcome' : null;
  }

  // Everything below is bounded so pre-existing tenants never get backfilled
  if (ageDays > ACTIVATION_MAX_AGE_DAYS) return null;

  if (!tenant.activationNudgeSentAt && ageDays >= NUDGE_MIN_AGE_DAYS) {
    const petCount = await prisma.pet.count({ where: { tenantId: tenant.id } });
    if (petCount === 0) {
      return (await sendActivationNudgeEmail(tenant, now)) ? 'nudge' : null;
    }
  }

  if (!tenant.trialCheckinSentAt && ageDays >= CHECKIN_MIN_AGE_DAYS) {
    return (await sendCheckinEmail(tenant, now)) ? 'checkin' : null;
  }

  return null;
}

async function sendWelcomeEmail(tenant: LifecycleTenant, now: Date): Promise<boolean> {
  const adminEmail = await getAdminEmail(tenant.id);
  if (!adminEmail) return false;

  const emailData: TrialWelcomeData = {
    template: 'trial-welcome',
    to: { email: adminEmail.email, name: adminEmail.name },
    subject: `🐾 ${tenant.name} ya está lista en Vetify`,
    tenantId: tenant.id,
    data: {
      clinicName: tenant.name,
      ownerName: adminEmail.name,
      trialEndsDate: tenant.trialEndsAt!,
      createPetUrl: getCreatePetUrl(),
      dashboardUrl: getDashboardUrl(),
    },
  };

  const sendResult = await sendEmail(emailData);
  if (!sendResult.success) return false;

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { welcomeEmailSentAt: now },
  });
  return true;
}

async function sendActivationNudgeEmail(tenant: LifecycleTenant, now: Date): Promise<boolean> {
  const adminEmail = await getAdminEmail(tenant.id);
  if (!adminEmail) return false;

  const emailData: TrialActivationNudgeData = {
    template: 'trial-activation-nudge',
    to: { email: adminEmail.email, name: adminEmail.name },
    subject: '🐶 Registra a tu primera mascota en Vetify',
    tenantId: tenant.id,
    data: {
      clinicName: tenant.name,
      ownerName: adminEmail.name,
      createPetUrl: getCreatePetUrl(),
    },
  };

  const sendResult = await sendEmail(emailData);
  if (!sendResult.success) return false;

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { activationNudgeSentAt: now },
  });
  return true;
}

async function sendCheckinEmail(tenant: LifecycleTenant, now: Date): Promise<boolean> {
  const adminEmail = await getAdminEmail(tenant.id);
  if (!adminEmail) return false;

  const emailData: TrialCheckinData = {
    template: 'trial-checkin',
    to: { email: adminEmail.email, name: adminEmail.name },
    subject: '¿Cómo te va con Vetify?',
    tenantId: tenant.id,
    replyTo: CHECKIN_REPLY_TO,
    data: {
      clinicName: tenant.name,
      ownerName: adminEmail.name,
      dashboardUrl: getDashboardUrl(),
    },
  };

  const sendResult = await sendEmail(emailData);
  if (!sendResult.success) return false;

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { trialCheckinSentAt: now },
  });
  return true;
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://vetify.pro';
}

function getDashboardUrl(): string {
  return `${getAppUrl()}/dashboard`;
}

function getCreatePetUrl(): string {
  return `${getAppUrl()}/dashboard/pets/new`;
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
  const daysSince = (now.getTime() - lastCheck.getTime()) / MS_PER_DAY;
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
