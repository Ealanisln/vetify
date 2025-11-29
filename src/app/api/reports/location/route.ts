import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getFullLocationReportsData,
  getLocationRevenueAnalytics,
  getLocationInventoryAnalytics,
  getLocationPerformanceMetrics,
  getLocationComparison,
  validateLocationAccess,
} from '@/lib/reports-location';
import { getStaffLocationIds } from '@/lib/locations';
import {
  getCachedLocationReport,
  setCachedLocationReport,
} from '@/lib/reports-cache';

export const dynamic = 'force-dynamic';

// Valid report types
const VALID_TYPES = ['all', 'revenue', 'inventory', 'performance', 'comparison'] as const;
type ReportType = (typeof VALID_TYPES)[number];

export async function GET(request: NextRequest) {
  try {
    const { tenant, staff } = await requireAuth();
    const tenantId = tenant.id as string;
    const staffId = staff?.id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const reportType = (searchParams.get('type') || 'all') as ReportType;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const compareMode = searchParams.get('compare') === 'true';
    const locationIdsParam = searchParams.get('locationIds');

    // Validate report type
    if (!VALID_TYPES.includes(reportType)) {
      return NextResponse.json(
        {
          error: `Invalid report type. Must be one of: ${VALID_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate location access if a specific location is requested
    if (locationId && staffId) {
      const hasAccess = await validateLocationAccess(staffId, locationId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'No tienes acceso a esta ubicación' },
          { status: 403 }
        );
      }
    }

    // If staff has location restrictions and no location specified, get their assigned locations
    let effectiveLocationId = locationId;
    let allowedLocationIds: string[] | undefined;

    if (staffId && !locationId) {
      const staffLocationIds = await getStaffLocationIds(staffId);
      // If staff is assigned to specific locations, restrict to those
      if (staffLocationIds.length > 0) {
        allowedLocationIds = staffLocationIds;
        // For single-location staff, default to their location
        if (staffLocationIds.length === 1) {
          effectiveLocationId = staffLocationIds[0];
        }
      }
    }

    // Parse date range
    const dateRange = {
      startDate: startDateParam ? new Date(startDateParam) : undefined,
      endDate: endDateParam ? new Date(endDateParam) : undefined,
    };

    // Comparison mode - get data for multiple locations
    if (compareMode || reportType === 'comparison') {
      const locationIds = locationIdsParam?.split(',').filter(Boolean);

      // Apply access control to comparison
      let filteredLocationIds = locationIds;
      if (allowedLocationIds && locationIds) {
        filteredLocationIds = locationIds.filter((id) =>
          allowedLocationIds!.includes(id)
        );
      } else if (allowedLocationIds) {
        filteredLocationIds = allowedLocationIds;
      }

      // Build a cache key for comparison using sorted location IDs
      const comparisonCacheKey = filteredLocationIds?.sort().join('-') || 'all';

      // Try cache first for comparison
      const cachedComparison = await getCachedLocationReport<{ comparison: unknown }>(
        tenantId,
        comparisonCacheKey,
        'comparison',
        dateRange
      );

      if (cachedComparison) {
        return NextResponse.json(cachedComparison, {
          headers: {
            'Cache-Control': 'private, max-age=300',
            'X-Cache': 'HIT',
          },
        });
      }

      // Fetch fresh data
      const comparison = await getLocationComparison(tenantId, filteredLocationIds);
      const comparisonResponse = { comparison };

      // Store in cache
      await setCachedLocationReport(
        tenantId,
        comparisonCacheKey,
        'comparison',
        comparisonResponse,
        dateRange
      );

      return NextResponse.json(comparisonResponse, {
        headers: {
          'Cache-Control': 'private, max-age=300',
          'X-Cache': 'MISS',
        },
      });
    }

    // Single location or tenant-wide reports
    // Try cache first
    const cached = await getCachedLocationReport<Record<string, unknown>>(
      tenantId,
      effectiveLocationId,
      reportType,
      dateRange
    );

    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'private, max-age=300',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch fresh data
    let responseData: Record<string, unknown>;

    switch (reportType) {
      case 'revenue':
        responseData = {
          revenue: await getLocationRevenueAnalytics(
            tenantId,
            effectiveLocationId,
            dateRange
          ),
        };
        break;

      case 'inventory':
        responseData = {
          inventory: await getLocationInventoryAnalytics(
            tenantId,
            effectiveLocationId
          ),
        };
        break;

      case 'performance':
        responseData = {
          performance: await getLocationPerformanceMetrics(
            tenantId,
            effectiveLocationId,
            dateRange
          ),
        };
        break;

      case 'all':
      default:
        responseData = await getFullLocationReportsData(
          tenantId,
          effectiveLocationId,
          dateRange
        );
        break;
    }

    // Store in cache
    await setCachedLocationReport(
      tenantId,
      effectiveLocationId,
      reportType,
      responseData,
      dateRange
    );

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'private, max-age=300',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Error fetching location reports:', error);

    if (error instanceof Error) {
      // Handle auth errors
      if (error.message.includes('No tienes acceso') || error.message.includes('Access denied')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
