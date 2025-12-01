/**
 * Appointment Reminders Cron API Route
 *
 * Sends reminder emails 24 hours before scheduled appointments.
 * Triggered by Vercel Cron daily at 8am.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processAppointmentReminders } from '@/lib/email/reminder-alerts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for processing

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
    console.error('[CRON] Unauthorized appointment reminders request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CRON] Starting appointment reminders job');

  try {
    const result = await processAppointmentReminders();

    console.log(
      `[CRON] Appointment reminders complete: ${result.emailsSent} sent, ${result.appointmentsChecked} checked`
    );

    return NextResponse.json({
      success: result.success,
      appointmentsChecked: result.appointmentsChecked,
      emailsSent: result.emailsSent,
      errors: result.errors.length > 0 ? result.errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[CRON] Appointment reminders failed:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
