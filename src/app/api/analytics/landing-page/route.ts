import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getLandingPageAnalytics } from '@/lib/analytics/landing-queries';
import { subDays, startOfDay, endOfDay, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/landing-page
 *
 * Get landing page analytics for the current tenant.
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

    // Check if public page is enabled
    if (!tenant.publicPageEnabled) {
      return NextResponse.json({
        message: 'Landing page analytics not available - public page is disabled',
        data: null,
      });
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
      : startOfDay(subDays(endDate, 29)); // 30 days including today

    // Validate date range (max 90 days)
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff > 90) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 90 days' },
        { status: 400 }
      );
    }

    // Get analytics data
    const analytics = await getLandingPageAnalytics({
      tenantId: tenant.id,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      data: analytics,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: daysDiff,
      },
    });
  } catch (error) {
    console.error('[Analytics] Error fetching landing page analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
