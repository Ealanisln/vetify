import { Redis } from '@upstash/redis';
import { format } from 'date-fns';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache TTL in seconds (5 minutes)
const CACHE_TTL = 300;

// Cache key prefix
const CACHE_PREFIX = 'vetify:report';

interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Build a consistent cache key for location reports
 */
function buildCacheKey(
  tenantId: string,
  locationId: string | null,
  reportType: string,
  dateRange?: DateRange
): string {
  const parts = [
    CACHE_PREFIX,
    tenantId,
    locationId || 'all',
    reportType,
  ];

  if (dateRange?.startDate) {
    parts.push(format(dateRange.startDate, 'yyyy-MM-dd'));
  } else {
    parts.push('nostart');
  }

  if (dateRange?.endDate) {
    parts.push(format(dateRange.endDate, 'yyyy-MM-dd'));
  } else {
    parts.push('noend');
  }

  return parts.join(':');
}

/**
 * Get cached location report data
 * @returns The cached data if it exists, null otherwise
 */
export async function getCachedLocationReport<T>(
  tenantId: string,
  locationId: string | null,
  reportType: string,
  dateRange?: DateRange
): Promise<T | null> {
  try {
    const cacheKey = buildCacheKey(tenantId, locationId, reportType, dateRange);
    const cached = await redis.get<T>(cacheKey);

    if (cached) {
      console.log(`[Cache HIT] ${cacheKey}`);
      return cached;
    }

    console.log(`[Cache MISS] ${cacheKey}`);
    return null;
  } catch (error) {
    // Log error but don't fail - cache is optional optimization
    console.error('[Cache Error] Failed to get cached report:', error);
    return null;
  }
}

/**
 * Store location report data in cache
 */
export async function setCachedLocationReport(
  tenantId: string,
  locationId: string | null,
  reportType: string,
  data: unknown,
  dateRange?: DateRange
): Promise<void> {
  try {
    const cacheKey = buildCacheKey(tenantId, locationId, reportType, dateRange);
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
    console.log(`[Cache SET] ${cacheKey} (TTL: ${CACHE_TTL}s)`);
  } catch (error) {
    // Log error but don't fail - cache is optional optimization
    console.error('[Cache Error] Failed to set cached report:', error);
  }
}

/**
 * Invalidate all cached reports for a tenant
 * Useful when data changes (new sales, appointments, etc.)
 */
export async function invalidateTenantReportCache(tenantId: string): Promise<void> {
  try {
    const pattern = `${CACHE_PREFIX}:${tenantId}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[Cache INVALIDATE] Cleared ${keys.length} keys for tenant ${tenantId}`);
    }
  } catch (error) {
    console.error('[Cache Error] Failed to invalidate cache:', error);
  }
}

/**
 * Invalidate cached reports for a specific location
 */
export async function invalidateLocationReportCache(
  tenantId: string,
  locationId: string
): Promise<void> {
  try {
    const pattern = `${CACHE_PREFIX}:${tenantId}:${locationId}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[Cache INVALIDATE] Cleared ${keys.length} keys for location ${locationId}`);
    }
  } catch (error) {
    console.error('[Cache Error] Failed to invalidate location cache:', error);
  }
}

/**
 * Check if Redis is available
 * Useful for health checks or conditional caching
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
