import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getLandingPageAnalytics } from '@/lib/analytics/landing-queries';
import { subDays, startOfDay, endOfDay, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/landing-page/export
 *
 * Export landing page analytics as CSV.
 * Requires authentication.
 *
 * Query params:
 * - startDate: ISO date string (default: 30 days ago)
 * - endDate: ISO date string (default: today)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();

    if (!tenant?.id) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 403 }
      );
    }

    // Parse date range from query params
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Default to last 30 days
    const endDate = endDateParam
      ? endOfDay(parseISO(endDateParam))
      : endOfDay(new Date());
    const startDate = startDateParam
      ? startOfDay(parseISO(startDateParam))
      : startOfDay(subDays(endDate, 29));

    // Get analytics data
    const analytics = await getLandingPageAnalytics({
      tenantId: tenant.id,
      startDate,
      endDate,
    });

    // Build CSV content
    const lines: string[] = [];

    // Header
    lines.push('Analytics de Landing Page - ' + (tenant.name || 'Clínica'));
    lines.push('Período: ' + format(startDate, "d 'de' MMMM yyyy", { locale: es }) + ' - ' + format(endDate, "d 'de' MMMM yyyy", { locale: es }));
    lines.push('');

    // Summary
    lines.push('RESUMEN');
    lines.push('Métrica,Valor');
    lines.push(`Total de visitas,${analytics.totalPageViews}`);
    lines.push(`Visitantes únicos,${analytics.uniqueSessions}`);
    lines.push(`Total de conversiones,${analytics.totalConversions}`);
    lines.push(`Tasa de conversión,${analytics.conversionRate}%`);
    lines.push(`Cambio en visitas vs período anterior,${analytics.pageViewsChange}%`);
    lines.push(`Cambio en conversiones vs período anterior,${analytics.conversionsChange}%`);
    lines.push('');

    // Daily data
    lines.push('DATOS DIARIOS');
    lines.push('Fecha,Visitas,Visitantes únicos,Conversiones,Tasa de conversión');
    for (const day of analytics.dailyData) {
      lines.push(`${day.date},${day.pageViews},${day.uniqueSessions},${day.conversions},${day.conversionRate}%`);
    }
    lines.push('');

    // Traffic sources
    lines.push('FUENTES DE TRÁFICO');
    lines.push('Fuente,Visitas,Porcentaje');
    for (const source of analytics.topReferrers) {
      lines.push(`${source.source},${source.count},${source.percentage}%`);
    }
    lines.push('');

    // Device breakdown
    lines.push('DISPOSITIVOS');
    lines.push('Dispositivo,Visitas,Porcentaje');
    for (const device of analytics.deviceBreakdown) {
      lines.push(`${device.device},${device.count},${device.percentage}%`);
    }
    lines.push('');

    // Browser breakdown
    lines.push('NAVEGADORES');
    lines.push('Navegador,Visitas,Porcentaje');
    for (const browser of analytics.browserBreakdown) {
      lines.push(`${browser.browser},${browser.count},${browser.percentage}%`);
    }
    lines.push('');

    // Top pages
    lines.push('PÁGINAS MÁS VISITADAS');
    lines.push('Página,Visitas,Visitantes únicos');
    for (const page of analytics.topPages) {
      lines.push(`${page.page},${page.views},${page.uniqueSessions}`);
    }

    // Create CSV content
    const csvContent = lines.join('\n');

    // Generate filename
    const filename = `analytics-${tenant.slug || 'clinica'}-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[Analytics] Error exporting landing page analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
