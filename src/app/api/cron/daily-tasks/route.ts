/**
 * Combined Daily Tasks Cron API Route
 *
 * Runs all daily cron tasks in sequence:
 * - Inventory alerts
 * - Appointment reminders
 * - Treatment reminders
 *
 * Workaround for Vercel free plan limit of 2 cron jobs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAllTenantsInventory } from '@/lib/email/inventory-alerts';
import { processAppointmentReminders, processTreatmentReminders } from '@/lib/email/reminder-alerts';

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

  const allSuccess = errors.length === 0;
  console.log(`[CRON] Daily tasks complete. Success: ${allSuccess}, Errors: ${errors.length}`);

  return NextResponse.json({
    success: allSuccess,
    results,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  }, { status: allSuccess ? 200 : 207 }); // 207 Multi-Status if partial success
}
