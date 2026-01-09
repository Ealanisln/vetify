/**
 * Landing Page Analytics Queries
 *
 * Server-side queries for aggregating analytics data.
 * Used by the dashboard API to fetch metrics.
 */

import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, eachDayOfInterval, format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface LandingPageMetrics {
  // Overview metrics
  totalPageViews: number;
  uniqueSessions: number;
  totalConversions: number;
  conversionRate: number;

  // Comparison with previous period
  pageViewsChange: number;
  conversionsChange: number;

  // Time series data for charts
  dailyData: Array<{
    date: string;
    dateLabel: string;
    pageViews: number;
    uniqueSessions: number;
    conversions: number;
    conversionRate: number;
  }>;

  // Traffic sources
  topReferrers: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;

  // Device breakdown
  deviceBreakdown: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;

  // Browser breakdown
  browserBreakdown: Array<{
    browser: string;
    count: number;
    percentage: number;
  }>;

  // Top pages
  topPages: Array<{
    page: string;
    views: number;
    uniqueSessions: number;
  }>;
}

export interface AnalyticsQueryParams {
  tenantId: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Get comprehensive landing page analytics for a tenant
 */
export async function getLandingPageAnalytics(
  params: AnalyticsQueryParams
): Promise<LandingPageMetrics> {
  const { tenantId, startDate, endDate } = params;

  // Calculate previous period for comparison
  const periodLength = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const prevStartDate = subDays(startDate, periodLength);
  const prevEndDate = subDays(endDate, periodLength);

  // Run all queries in parallel
  const [
    currentPeriodStats,
    previousPeriodStats,
    dailyStats,
    referrerStats,
    deviceStats,
    browserStats,
    pageStats,
  ] = await Promise.all([
    // Current period totals
    getPeroidStats(tenantId, startDate, endDate),
    // Previous period for comparison
    getPeroidStats(tenantId, prevStartDate, prevEndDate),
    // Daily breakdown
    getDailyStats(tenantId, startDate, endDate),
    // Referrer breakdown
    getReferrerStats(tenantId, startDate, endDate),
    // Device breakdown
    getDeviceStats(tenantId, startDate, endDate),
    // Browser breakdown
    getBrowserStats(tenantId, startDate, endDate),
    // Page breakdown
    getPageStats(tenantId, startDate, endDate),
  ]);

  // Calculate conversion rate
  const conversionRate =
    currentPeriodStats.uniqueSessions > 0
      ? (currentPeriodStats.conversions / currentPeriodStats.uniqueSessions) * 100
      : 0;

  // Calculate changes
  const pageViewsChange = calculatePercentageChange(
    previousPeriodStats.pageViews,
    currentPeriodStats.pageViews
  );
  const conversionsChange = calculatePercentageChange(
    previousPeriodStats.conversions,
    currentPeriodStats.conversions
  );

  return {
    totalPageViews: currentPeriodStats.pageViews,
    uniqueSessions: currentPeriodStats.uniqueSessions,
    totalConversions: currentPeriodStats.conversions,
    conversionRate: Math.round(conversionRate * 100) / 100,
    pageViewsChange,
    conversionsChange,
    dailyData: dailyStats,
    topReferrers: referrerStats,
    deviceBreakdown: deviceStats,
    browserBreakdown: browserStats,
    topPages: pageStats,
  };
}

/**
 * Get aggregate stats for a period
 */
async function getPeroidStats(tenantId: string, startDate: Date, endDate: Date) {
  const [pageViewsResult, sessionsResult, conversionsResult] = await Promise.all([
    // Count page views
    prisma.landingPageAnalytics.count({
      where: {
        tenantId,
        eventType: 'PAGE_VIEW',
        createdAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
    }),
    // Count unique sessions
    prisma.landingPageAnalytics.groupBy({
      by: ['sessionId'],
      where: {
        tenantId,
        createdAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
    }),
    // Count conversions
    prisma.landingPageAnalytics.count({
      where: {
        tenantId,
        eventType: 'CONVERSION',
        createdAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
    }),
  ]);

  return {
    pageViews: pageViewsResult,
    uniqueSessions: sessionsResult.length,
    conversions: conversionsResult,
  };
}

/**
 * Get daily stats for charts
 */
async function getDailyStats(tenantId: string, startDate: Date, endDate: Date) {
  // Get all dates in the range
  const dates = eachDayOfInterval({ start: startDate, end: endDate });

  // Query events grouped by date
  const events = await prisma.landingPageAnalytics.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
    select: {
      eventType: true,
      sessionId: true,
      createdAt: true,
    },
  });

  // Group by date
  const dailyMap = new Map<
    string,
    { pageViews: number; sessions: Set<string>; conversions: number }
  >();

  // Initialize all dates
  for (const date of dates) {
    const key = format(date, 'yyyy-MM-dd');
    dailyMap.set(key, { pageViews: 0, sessions: new Set(), conversions: 0 });
  }

  // Aggregate events
  for (const event of events) {
    const key = format(event.createdAt, 'yyyy-MM-dd');
    const day = dailyMap.get(key);
    if (day) {
      if (event.eventType === 'PAGE_VIEW') {
        day.pageViews++;
      }
      if (event.eventType === 'CONVERSION') {
        day.conversions++;
      }
      day.sessions.add(event.sessionId);
    }
  }

  // Convert to array
  return dates.map((date) => {
    const key = format(date, 'yyyy-MM-dd');
    const day = dailyMap.get(key)!;
    const uniqueSessions = day.sessions.size;
    const conversionRate = uniqueSessions > 0 ? (day.conversions / uniqueSessions) * 100 : 0;

    return {
      date: key,
      dateLabel: format(date, 'd MMM', { locale: es }),
      pageViews: day.pageViews,
      uniqueSessions,
      conversions: day.conversions,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  });
}

/**
 * Get referrer breakdown
 */
async function getReferrerStats(tenantId: string, startDate: Date, endDate: Date) {
  const results = await prisma.landingPageAnalytics.groupBy({
    by: ['referrer'],
    where: {
      tenantId,
      eventType: 'PAGE_VIEW',
      createdAt: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 10,
  });

  const total = results.reduce((sum, r) => sum + r._count.id, 0);

  return results.map((r) => ({
    source: categorizeReferrer(r.referrer),
    count: r._count.id,
    percentage: total > 0 ? Math.round((r._count.id / total) * 1000) / 10 : 0,
  }));
}

/**
 * Categorize referrer into a readable source
 */
function categorizeReferrer(referrer: string | null): string {
  if (!referrer || referrer === '') return 'Directo';

  const url = referrer.toLowerCase();

  if (url.includes('google')) return 'Google';
  if (url.includes('facebook') || url.includes('fb.')) return 'Facebook';
  if (url.includes('instagram')) return 'Instagram';
  if (url.includes('twitter') || url.includes('t.co')) return 'Twitter/X';
  if (url.includes('tiktok')) return 'TikTok';
  if (url.includes('whatsapp')) return 'WhatsApp';
  if (url.includes('linkedin')) return 'LinkedIn';
  if (url.includes('bing')) return 'Bing';
  if (url.includes('yahoo')) return 'Yahoo';

  // Try to extract domain
  try {
    const domain = new URL(referrer).hostname.replace('www.', '');
    return domain;
  } catch {
    return 'Otro';
  }
}

/**
 * Get device breakdown
 */
async function getDeviceStats(tenantId: string, startDate: Date, endDate: Date) {
  const results = await prisma.landingPageAnalytics.groupBy({
    by: ['device'],
    where: {
      tenantId,
      eventType: 'PAGE_VIEW',
      createdAt: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  });

  const total = results.reduce((sum, r) => sum + r._count.id, 0);

  const deviceLabels: Record<string, string> = {
    mobile: 'Móvil',
    desktop: 'Escritorio',
    tablet: 'Tablet',
  };

  return results.map((r) => ({
    device: deviceLabels[r.device || 'unknown'] || r.device || 'Desconocido',
    count: r._count.id,
    percentage: total > 0 ? Math.round((r._count.id / total) * 1000) / 10 : 0,
  }));
}

/**
 * Get browser breakdown
 */
async function getBrowserStats(tenantId: string, startDate: Date, endDate: Date) {
  const results = await prisma.landingPageAnalytics.groupBy({
    by: ['browser'],
    where: {
      tenantId,
      eventType: 'PAGE_VIEW',
      createdAt: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 5,
  });

  const total = results.reduce((sum, r) => sum + r._count.id, 0);

  return results.map((r) => ({
    browser: r.browser || 'Desconocido',
    count: r._count.id,
    percentage: total > 0 ? Math.round((r._count.id / total) * 1000) / 10 : 0,
  }));
}

/**
 * Get page breakdown
 */
async function getPageStats(tenantId: string, startDate: Date, endDate: Date) {
  const results = await prisma.landingPageAnalytics.groupBy({
    by: ['pageSlug'],
    where: {
      tenantId,
      eventType: 'PAGE_VIEW',
      createdAt: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  });

  // Also get unique sessions per page
  const sessionsPerPage = await prisma.landingPageAnalytics.groupBy({
    by: ['pageSlug', 'sessionId'],
    where: {
      tenantId,
      eventType: 'PAGE_VIEW',
      createdAt: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
  });

  // Count unique sessions per page
  const sessionCounts = new Map<string, number>();
  for (const item of sessionsPerPage) {
    const count = sessionCounts.get(item.pageSlug) || 0;
    sessionCounts.set(item.pageSlug, count + 1);
  }

  const pageLabels: Record<string, string> = {
    landing: 'Página principal',
    agendar: 'Agendar cita',
    servicios: 'Servicios',
    equipo: 'Equipo',
    galeria: 'Galería',
    testimonios: 'Testimonios',
  };

  return results.map((r) => ({
    page: pageLabels[r.pageSlug] || r.pageSlug,
    views: r._count.id,
    uniqueSessions: sessionCounts.get(r.pageSlug) || 0,
  }));
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentageChange(previous: number, current: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
