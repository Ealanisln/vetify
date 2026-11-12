/**
 * SWR-based hook for fetching appointments data
 *
 * This hook provides automatic caching, request deduplication,
 * and background revalidation through SWR.
 *
 * Multiple components using this hook with the same parameters
 * will share a single request and cache entry.
 */

'use client';

import useSWR from 'swr';
import { useMemo, useCallback } from 'react';
import {
  APPOINTMENTS_KEYS,
  createListKey,
  AppointmentListParams,
} from '@/lib/appointments/cache-keys';
import {
  fetchAppointments,
  AppointmentWithDetails,
  AppointmentQuery,
} from '@/lib/appointments/fetchers';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from 'date-fns';

const WEEK_OPTIONS = { weekStartsOn: 1 } as const; // Monday start

/**
 * Range that covers today, this week and this month. The Today list and the
 * stats are computed from this range, never from the calendar's visible one.
 */
export function getStatsDateRange(now: Date = new Date()): { start: Date; end: Date } {
  const weekStart = startOfWeek(now, WEEK_OPTIONS);
  const monthStart = startOfMonth(now);
  const weekEnd = endOfWeek(now, WEEK_OPTIONS);
  const monthEnd = endOfMonth(now);
  return {
    start: weekStart < monthStart ? weekStart : monthStart,
    end: weekEnd > monthEnd ? weekEnd : monthEnd,
  };
}

/**
 * Options for useAppointmentsData hook
 */
export interface UseAppointmentsDataOptions {
  /** Start date filter */
  startDate?: Date;
  /** End date filter */
  endDate?: Date;
  /** Status filter */
  status?: string;
  /** Location filter */
  locationId?: string;
  /** Enable/disable the query */
  enabled?: boolean;
  /** Revalidate on window focus */
  revalidateOnFocus?: boolean;
  /** Keep previous data while revalidating */
  keepPreviousData?: boolean;
}

/**
 * Return type for useAppointmentsData hook
 */
export interface UseAppointmentsDataReturn {
  /** List of appointments */
  appointments: AppointmentWithDetails[];
  /** Loading state (no data yet) */
  isLoading: boolean;
  /** Revalidating state (has data, fetching fresh) */
  isValidating: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Manually trigger revalidation */
  refresh: () => Promise<void>;
  /** SWR mutate function for cache updates */
  mutate: ReturnType<typeof useSWR<AppointmentWithDetails[]>>['mutate'];
}

/**
 * Main hook for fetching appointments with SWR
 *
 * Features:
 * - Automatic request deduplication (same params = single request)
 * - Caching with stale-while-revalidate
 * - Optimistic updates support via mutate
 *
 * @example
 * ```tsx
 * // Fetch all appointments for current week
 * const { appointments, isLoading } = useAppointmentsData({
 *   startDate: startOfWeek(new Date()),
 *   endDate: endOfWeek(new Date()),
 * });
 *
 * // Multiple components with same params share the same cache
 * ```
 */
export function useAppointmentsData(
  options: UseAppointmentsDataOptions = {}
): UseAppointmentsDataReturn {
  const {
    startDate,
    endDate,
    status,
    locationId,
    enabled = true,
    revalidateOnFocus = false,
    keepPreviousData = true,
  } = options;

  // Build query params
  const query: AppointmentQuery | undefined = useMemo(() => {
    if (!enabled) return undefined;

    return {
      start_date: startDate?.toISOString(),
      end_date: endDate?.toISOString(),
      status,
      locationId,
    };
  }, [enabled, startDate, endDate, status, locationId]);

  // Create cache key - null key disables the request
  const key = enabled ? createListKey(startDate, endDate, status) : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    AppointmentWithDetails[],
    Error
  >(
    key,
    () => fetchAppointments(query),
    {
      revalidateOnFocus,
      keepPreviousData,
      // Dedupe requests within 2 seconds
      dedupingInterval: 2000,
      // Don't retry on 4xx errors
      shouldRetryOnError: (err) => {
        if (err instanceof Error && err.message.includes('401')) return false;
        if (err instanceof Error && err.message.includes('403')) return false;
        return true;
      },
      errorRetryCount: 3,
    }
  );

  // IMPORTANT: Memoize refresh to prevent infinite re-render loops
  // Without useCallback, a new function reference is created on every render,
  // which can trigger useEffect dependencies and cause "Maximum update depth exceeded"
  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    appointments: data ?? [],
    isLoading,
    isValidating,
    error: error ?? null,
    refresh,
    mutate,
  };
}

/**
 * Hook for today's appointments
 * Filters from the main appointments cache to avoid extra API call
 */
export function useTodayAppointments(
  allAppointments: AppointmentWithDetails[]
): AppointmentWithDetails[] {
  return useMemo(() => {
    const today = { start: startOfDay(new Date()), end: endOfDay(new Date()) };

    return allAppointments.filter((apt) => isWithinInterval(new Date(apt.dateTime), today));
  }, [allAppointments]);
}

/**
 * Appointment statistics derived from cached data
 * No separate API call needed
 */
export interface AppointmentStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  completionRate: number;
}

/**
 * Hook for appointment statistics
 * Calculates stats from the main appointments cache
 */
export function useAppointmentStatsFromData(
  appointments: AppointmentWithDetails[]
): AppointmentStats {
  return useMemo(() => {
    if (!appointments.length) {
      return { today: 0, thisWeek: 0, thisMonth: 0, completionRate: 0 };
    }

    const now = new Date();
    const today = { start: startOfDay(now), end: endOfDay(now) };
    const week = { start: startOfWeek(now, WEEK_OPTIONS), end: endOfWeek(now, WEEK_OPTIONS) };
    const month = { start: startOfMonth(now), end: endOfMonth(now) };
    const within = (interval: { start: Date; end: Date }) =>
      appointments.filter((apt) => isWithinInterval(new Date(apt.dateTime), interval));

    const todayAppointments = within(today);
    const weekAppointments = within(week);
    const monthAppointments = within(month);

    const completed = monthAppointments.filter(
      (apt) => apt.status === 'COMPLETED'
    ).length;
    const completionRate =
      monthAppointments.length > 0
        ? Math.round((completed / monthAppointments.length) * 100)
        : 0;

    return {
      today: todayAppointments.length,
      thisWeek: weekAppointments.length,
      thisMonth: monthAppointments.length,
      completionRate,
    };
  }, [appointments]);
}

/**
 * Hook for calendar events
 * Transforms appointments to calendar event format
 */
export function useCalendarEvents(appointments: AppointmentWithDetails[]) {
  return useMemo(() => {
    return appointments.map((appointment) => {
      const startTime = new Date(appointment.dateTime);
      const endTime = new Date(
        startTime.getTime() + appointment.duration * 60000
      );

      const colors = getStatusColor(appointment.status);
      const priority = getPriority(appointment.reason);
      const canEdit = ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);
      const canCancel = !['COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'].includes(
        appointment.status
      );

      return {
        // Include status in id to force FullCalendar to re-mount event when status changes
        // This ensures the tooltip (set in eventDidMount) gets updated
        id: `${appointment.id}-${appointment.status}`,
        title: `${appointment.pet.name} - ${appointment.customer.name}`,
        start: formatLocalDateTime(startTime),
        end: formatLocalDateTime(endTime),
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        extendedProps: {
          appointment,
          customerPhone: appointment.customer.phone,
          priority,
          canEdit,
          canCancel,
        },
      };
    });
  }, [appointments]);
}

// Helper functions

function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function getStatusColor(status: string) {
  const colors = {
    SCHEDULED: { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a5f' },
    CONFIRMED: { bg: '#dcfce7', border: '#22c55e', text: '#14532d' },
    CHECKED_IN: { bg: '#fef3c7', border: '#f59e0b', text: '#78350f' },
    IN_PROGRESS: { bg: '#f3e8ff', border: '#a855f7', text: '#581c87' },
    COMPLETED: { bg: '#ccfbf1', border: '#14b8a6', text: '#134e4a' },
    CANCELLED_CLIENT: { bg: '#fee2e2', border: '#ef4444', text: '#7f1d1d' },
    CANCELLED_CLINIC: { bg: '#fee2e2', border: '#ef4444', text: '#7f1d1d' },
    NO_SHOW: { bg: '#e5e7eb', border: '#6b7280', text: '#374151' },
  };

  return colors[status as keyof typeof colors] || colors.SCHEDULED;
}

function getPriority(reason: string): 'low' | 'medium' | 'high' | 'emergency' {
  const emergencyKeywords = ['emergencia', 'urgente', 'accidente', 'grave'];
  const highKeywords = ['cirugia', 'operacion', 'consulta especial'];
  const lowKeywords = ['vacuna', 'revision', 'control', 'bano'];

  const lowerReason = reason.toLowerCase();

  if (emergencyKeywords.some((keyword) => lowerReason.includes(keyword))) {
    return 'emergency';
  }
  if (highKeywords.some((keyword) => lowerReason.includes(keyword))) {
    return 'high';
  }
  if (lowKeywords.some((keyword) => lowerReason.includes(keyword))) {
    return 'low';
  }

  return 'medium';
}
