import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  sendLowStockAlertNow,
  checkAllTenantsInventory,
} from '@/lib/email/inventory-alerts';

/**
 * POST /api/inventory/alerts
 * Manually trigger low stock alert for current tenant
 */
export async function POST() {
  try {
    const { tenant } = await requireAuth();

    const result = await sendLowStockAlertNow(tenant.id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        itemsCount: result.itemsCount,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: result.message,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[INVENTORY_ALERTS] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al enviar alertas de inventario',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/inventory/alerts?secret=xxx
 * Cron job endpoint to check all tenants
 * Protected by secret token
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // SECURITY FIX: Require CRON_SECRET without default - fail if not configured
    const CRON_SECRET = process.env.CRON_SECRET;
    if (!CRON_SECRET) {
      console.error('[INVENTORY_ALERTS] CRON_SECRET environment variable is not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }
    if (secret !== CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[INVENTORY_ALERTS] Running scheduled check for all tenants');

    const result = await checkAllTenantsInventory();

    return NextResponse.json({
      success: result.success,
      tenantsChecked: result.tenantsChecked,
      alertsSent: result.totalAlertsSent,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[INVENTORY_ALERTS] Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
