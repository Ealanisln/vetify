/**
 * Centralized cache key definitions for SWR
 *
 * These keys are used to identify and deduplicate requests across components.
 * SWR automatically deduplicates requests with the same key.
 */

import { format } from 'date-fns';

export interface AppointmentListParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  locationId?: string;
  page?: number;
  limit?: number;
}

/**
 * Cache key factory for appointments
 *
 * Structure: ['appointments', scope, ...params]
 * - Hierarchical keys allow targeted invalidation
 * - Same params = same key = request deduplication
 */
export const APPOINTMENTS_KEYS = {
  // Base key for all appointments data
  all: ['appointments'] as const,

  // List queries
  lists: () => [...APPOINTMENTS_KEYS.all, 'list'] as const,
  list: (params: AppointmentListParams) =>
    [...APPOINTMENTS_KEYS.lists(), normalizeParams(params)] as const,

  // Single appointment
  details: () => [...APPOINTMENTS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...APPOINTMENTS_KEYS.details(), id] as const,

  // Today's appointments (date-specific key for cache freshness)
  today: () =>
    [...APPOINTMENTS_KEYS.all, 'today', format(new Date(), 'yyyy-MM-dd')] as const,

  // Stats - derived from list data, but can be cached separately if needed
  stats: () => [...APPOINTMENTS_KEYS.all, 'stats'] as const,

  // Availability checking
  availability: (date: string, duration?: number, staffId?: string) =>
    ['appointments', 'availability', date, duration, staffId] as const,
} as const;

/**
 * Normalize params to ensure consistent cache keys
 * Removes undefined values and sorts keys for consistency
 */
function normalizeParams(params: AppointmentListParams): string {
  const normalized: Record<string, string> = {};

  if (params.startDate) normalized.startDate = params.startDate;
  if (params.endDate) normalized.endDate = params.endDate;
  if (params.status) normalized.status = params.status;
  if (params.locationId) normalized.locationId = params.locationId;
  if (params.page !== undefined) normalized.page = String(params.page);
  if (params.limit !== undefined) normalized.limit = String(params.limit);

  // Sort keys for consistent serialization
  const sortedKeys = Object.keys(normalized).sort();
  const sortedParams = sortedKeys.map((k) => `${k}=${normalized[k]}`).join('&');

  return sortedParams || 'all';
}

/**
 * Create a list cache key from Date objects
 * Converts dates to ISO strings for the cache key
 */
export function createListKey(startDate?: Date, endDate?: Date, status?: string) {
  return APPOINTMENTS_KEYS.list({
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
    status,
  });
}

/**
 * Create a key for calendar view based on date range
 */
export function createCalendarKey(
  view: 'month' | 'week' | 'day',
  currentDate: Date
) {
  const start = new Date(currentDate);
  const end = new Date(currentDate);

  switch (view) {
    case 'month':
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
      break;
    case 'week':
      const dayOfWeek = start.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(start.getDate() - adjustedDay);
      end.setDate(start.getDate() + 6);
      break;
    case 'day':
      // Start and end are already the same day
      break;
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return createListKey(start, end);
}

/**
 * Type for cache key tuples
 */
export type AppointmentCacheKey = ReturnType<
  (typeof APPOINTMENTS_KEYS)[keyof typeof APPOINTMENTS_KEYS]
>;
