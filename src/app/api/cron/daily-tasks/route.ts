/**
 * Combined Daily Tasks Cron API Route
 *
 * Runs all daily cron tasks in sequence:
 * - Inventory alerts
 * - Appointment reminders
 * - Treatment reminders
 * - Trial lifecycle emails
 * - Retention warnings (T-7d email before deletion)
 * - Retention purge (delete tenants past 90-day grace)
 *
 * Workaround for Vercel free plan limit of 2 cron jobs.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { checkAllTenantsInventory } from '@/lib/email/inventory-alerts';
import { processAppointmentReminders, processTreatmentReminders } from '@/lib/email/reminder-alerts';
import { processTrialLifecycleEmails } from '@/lib/email/trial-lifecycle';
import { sendRetentionWarnings } from '@/lib/retention/notify';
import { purgeExpiredTenants } from '@/lib/retention/purge';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Allow up to 120 seconds for all tasks

/**
 * Verify the request is from Vercel Cron
 */
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('[CRON] CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    console.error('[CRON] Unauthorized daily tasks request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CRON] Starting combined daily tasks');
  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  // Task 1: Inventory Alerts
  try {
    console.log('[CRON] Running inventory alerts...');
    const inventoryResult = await checkAllTenantsInventory();
    results.inventory = {
      success: inventoryResult.success,
      tenantsChecked: inventoryResult.tenantsChecked,
      alertsSent: inventoryResult.totalAlertsSent,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CRON] Inventory alerts failed:', msg);
    errors.push(`inventory: ${msg}`);
    results.inventory = { success: false, error: msg };
  }

  // Task 2: Appointment Reminders
  try {
    console.log('[CRON] Running appointment reminders...');
    const appointmentResult = await processAppointmentReminders();
    results.appointments = {
      success: appointmentResult.success,
      appointmentsChecked: appointmentResult.appointmentsChecked,
      emailsSent: appointmentResult.emailsSent,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CRON] Appointment reminders failed:', msg);
    errors.push(`appointments: ${msg}`);
    results.appointments = { success: false, error: msg };
  }

  // Task 3: Treatment Reminders
  try {
    console.log('[CRON] Running treatment reminders...');
    const treatmentResult = await processTreatmentReminders();
    results.treatments = {
      success: treatmentResult.success,
      remindersProcessed: treatmentResult.remindersProcessed,
      emailsSent: treatmentResult.emailsSent,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CRON] Treatment reminders failed:', msg);
    errors.push(`treatments: ${msg}`);
    results.treatments = { success: false, error: msg };
  }

  // Task 4: Trial Lifecycle Emails
  try {
    console.log('[CRON] Running trial lifecycle emails...');
    const trialResult = await processTrialLifecycleEmails();
    results.trialLifecycle = {
      success: trialResult.success,
      tenantsChecked: trialResult.tenantsChecked,
      expiringEmailsSent: trialResult.expiringEmailsSent,
      expiredEmailsSent: trialResult.expiredEmailsSent,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CRON] Trial lifecycle emails failed:', msg);
    errors.push(`trialLifecycle: ${msg}`);
    results.trialLifecycle = { success: false, error: msg };
  }

  // Task 5: Retention warnings (T-7d email, idempotent via retentionWarningSentAt)
  try {
    console.log('[CRON] Running retention warnings...');
    const notifyResult = await sendRetentionWarnings();
    results.retentionWarnings = {
      success: notifyResult.failed.length === 0,
      scanned: notifyResult.scanned,
      sent: notifyResult.sent.length,
      skippedNoAdmin: notifyResult.skippedNoAdmin.length,
      failed: notifyResult.failed.length,
      remaining: notifyResult.remaining,
    };
    if (notifyResult.remaining) {
      console.warn('[CRON] Retention warnings: more candidates remain, will resume next run');
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CRON] Retention warnings failed:', msg);
    errors.push(`retentionWarnings: ${msg}`);
    results.retentionWarnings = { success: false, error: msg };
  }

  // Task 6: Retention purge (delete tenants past dataRetentionEndsAt)
  try {
    console.log('[CRON] Running retention purge...');
    const purgeResult = await purgeExpiredTenants();
    results.retentionPurge = {
      success: purgeResult.failed.length === 0,
      scanned: purgeResult.scanned,
      purged: purgeResult.purged.length,
      skippedReactivated: purgeResult.skippedReactivated.length,
      failed: purgeResult.failed.length,
      remaining: purgeResult.remaining,
    };
    if (purgeResult.purged.length > 0) {
      console.warn('[CRON] Retention purge: deleted tenants', purgeResult.purged);
    }
    if (purgeResult.remaining) {
      console.warn('[CRON] Retention purge: more candidates remain, will resume next run');
    }
    if (purgeResult.failed.length > 0) {
      Sentry.captureMessage('Retention purge: per-tenant failures', {
        level: 'error',
        tags: { category: 'retention', issue: 'purge_failed' },
        contexts: { failures: { failed: purgeResult.failed } },
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CRON] Retention purge failed:', msg);
    errors.push(`retentionPurge: ${msg}`);
    results.retentionPurge = { success: false, error: msg };
  }

  const allSuccess = errors.length === 0;
  console.log(`[CRON] Daily tasks complete. Success: ${allSuccess}, Errors: ${errors.length}`);

  if (errors.length > 0) {
    Sentry.captureMessage(`Daily cron: ${errors.length}/6 tasks failed`, {
      level: errors.length >= 3 ? 'fatal' : 'error',
      tags: { category: 'cron', failedTasks: errors.length },
      contexts: {
        cron: {
          errors,
          results: JSON.stringify(results),
        },
      },
    });
  }

  return NextResponse.json({
    success: allSuccess,
    results,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  }, { status: allSuccess ? 200 : 207 }); // 207 Multi-Status if partial success
}
