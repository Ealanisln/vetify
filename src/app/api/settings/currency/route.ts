import { NextResponse, type NextRequest } from 'next/server';
import { requireActiveSubscription, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  DEFAULT_CURRENCY,
  getCurrency,
  isSupportedCurrency,
} from '@/lib/currency';
import { extractAuditInfo, logAuditEvent } from '@/lib/security/audit-logger';

const DEFAULT_TAX_RATE = 0.16;

/**
 * GET /api/settings/currency
 *
 * Requires only an active subscription, matching /api/settings/tax-rate: any
 * staff member who can see money needs to know how to render it.
 *
 * Returns saleCount so the settings form can state the real number in its
 * relabel confirmation without a second round trip.
 */
export async function GET() {
  try {
    const { tenant } = await requireActiveSubscription();

    const [settings, saleCount] = await Promise.all([
      prisma.tenantSettings.findUnique({
        where: { tenantId: tenant.id },
        select: { currencyCode: true, taxRate: true, currencyConfirmed: true },
      }),
      prisma.sale.count({ where: { tenantId: tenant.id } }),
    ]);

    const meta = getCurrency(settings?.currencyCode ?? DEFAULT_CURRENCY);

    return NextResponse.json({
      currencyCode: meta.code,
      currencySymbol: meta.symbol,
      taxRate: settings?.taxRate ? Number(settings.taxRate) : DEFAULT_TAX_RATE,
      currencyConfirmed: settings?.currencyConfirmed ?? false,
      saleCount,
      // Read-only: the charge currency is fixed at onboarding and only
      // changes through support (a Stripe subscription cannot switch
      // currency in place)
      billingCurrency: tenant.billingCurrency ?? 'MXN',
    });
  } catch (error) {
    console.error('Error fetching currency settings:', error);

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

const updateSchema = z.object({
  currencyCode: z
    .string()
    .length(3)
    .refine(isSupportedCurrency, { message: 'Moneda no soportada' }),
  // Stored as Decimal(5,4): 0.19 means 19%.
  taxRate: z.number().min(0).max(1),
  confirmRelabel: z.boolean().optional(),
});

/**
 * PUT /api/settings/currency
 *
 * Changing currency RELABELS, it never converts. Vetify has no exchange rates
 * and no rate-at-time-of-sale, so rewriting a clinic's books is not something
 * this endpoint is entitled to do.
 *
 * A tenant with sales must therefore pass confirmRelabel, having been told what
 * that means. We deliberately do not hard-block: the common case is a clinic
 * that picked wrong at signup and notices on day one after a couple of test
 * sales, and blocking would punish exactly them.
 */
export async function PUT(request: NextRequest) {
  try {
    const { tenant, user } = await requirePermission('settings', 'write');

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { currencyCode, taxRate, confirmRelabel } = parsed.data;

    const current = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { currencyCode: true },
    });
    const previousCurrency = current?.currencyCode ?? DEFAULT_CURRENCY;
    const isCurrencyChange = previousCurrency !== currencyCode;

    if (isCurrencyChange && !confirmRelabel) {
      const saleCount = await prisma.sale.count({ where: { tenantId: tenant.id } });
      if (saleCount > 0) {
        return NextResponse.json(
          {
            error: 'Se requiere confirmación para cambiar la moneda',
            code: 'CONFIRM_RELABEL_REQUIRED',
            saleCount,
            from: previousCurrency,
            to: currencyCode,
          },
          { status: 409 }
        );
      }
    }

    const meta = getCurrency(currencyCode);

    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: {
        currencyCode: meta.code,
        currencySymbol: meta.symbol,
        currencyConfirmed: true,
        taxRate,
      },
      create: {
        tenantId: tenant.id,
        currencyCode: meta.code,
        currencySymbol: meta.symbol,
        currencyConfirmed: true,
        taxRate,
      },
    });

    if (isCurrencyChange) {
      // A currency change is a material financial-record event, even though no
      // stored amount moves.
      await logAuditEvent({
        ...extractAuditInfo(request, user?.id, tenant.id),
        eventType: 'data_update',
        resource: 'tenant_currency',
        resourceId: tenant.id,
        details: { from: previousCurrency, to: meta.code, relabeledOnly: true },
        riskLevel: 'medium',
        success: true,
      });
    }

    return NextResponse.json({
      currencyCode: meta.code,
      currencySymbol: meta.symbol,
      taxRate,
      currencyConfirmed: true,
    });
  } catch (error) {
    console.error('Error updating currency settings:', error);

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
