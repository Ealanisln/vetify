import { NextResponse } from 'next/server';
import { requireActiveSubscription } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/settings/tax-rate
 *
 * Returns the tax rate for the current tenant.
 * This endpoint only requires an active subscription (not settings permission)
 * because the tax rate is needed by any staff member who can view sales.
 */
export async function GET() {
  try {
    const { tenant } = await requireActiveSubscription();

    // Get only the tax rate from TenantSettings table
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: {
        taxRate: true
      }
    });

    // Convert Decimal to number, default to 0.16 (16% IVA in Mexico)
    const taxRate = tenantSettings?.taxRate
      ? Number(tenantSettings.taxRate)
      : 0.16;

    return NextResponse.json({ taxRate });
  } catch (error) {
    console.error('Error fetching tax rate:', error);

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
