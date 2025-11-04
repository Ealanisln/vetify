import { NextResponse } from 'next/server';
import { processAllReminders } from '@/lib/email/reminder-alerts';

/**
 * GET /api/reminders/process?secret=xxx
 * Cron job endpoint to process all reminders (treatment + appointment)
 * Protected by secret token
 *
 * Should be called hourly via cron job
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Verify cron secret
    const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-change-in-prod';
    if (secret !== CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[REMINDERS] Running scheduled reminder processing');

    const result = await processAllReminders();

    return NextResponse.json({
      success: result.success,
      treatmentReminders: result.treatmentReminders,
      appointmentReminders: result.appointmentReminders,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[REMINDERS] Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
