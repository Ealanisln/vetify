/**
 * Inventory Alerts Cron API Route
 *
 * Checks all tenant inventories and sends low stock alerts to staff.
 * Triggered by Vercel Cron daily at 7am.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAllTenantsInventory } from '@/lib/email/inventory-alerts';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Allow up to 120 seconds for processing all tenants

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
    console.error('[CRON] Unauthorized inventory alerts request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CRON] Starting inventory alerts job');

  try {
    const result = await checkAllTenantsInventory();

    const errorCount = Object.keys(result.errors).length;
    console.log(
      `[CRON] Inventory alerts complete: ${result.totalAlertsSent} alerts sent, ${result.tenantsChecked} tenants checked, ${errorCount} errors`
    );

    return NextResponse.json({
      success: result.success,
      tenantsChecked: result.tenantsChecked,
      alertsSent: result.totalAlertsSent,
      errors: errorCount > 0 ? result.errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[CRON] Inventory alerts failed:', errorMessage);

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
