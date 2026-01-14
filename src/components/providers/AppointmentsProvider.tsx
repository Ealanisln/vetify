/**
 * Appointments Provider
 *
 * Central context for sharing appointment data across components.
 * Uses SWR for data fetching with automatic caching and deduplication.
 *
 * This provider eliminates redundant API calls by:
 * 1. Single source of truth for appointment data
 * 2. Derived data (today, stats) calculated client-side
 * 3. Shared mutations that invalidate the cache
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { SWRConfig } from 'swr';
import {
  useAppointmentsData,
  useTodayAppointments,
  useAppointmentStatsFromData,
  useCalendarEvents,
  AppointmentStats,
} from '@/hooks/appointments/useAppointmentsData';
import { useAppointmentMutations } from '@/hooks/appointments/useAppointmentMutations';
import { AppointmentWithDetails } from '@/lib/appointments/fetchers';
import { AppointmentFormData } from '@/lib/validations/appointments';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
} from 'date-fns';

/**
 * Date range for fetching appointments
 */
interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Calendar view types
 */
export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

/**
 * Calendar event type for FullCalendar
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    appointment: AppointmentWithDetails;
    customerPhone?: string;
    priority: 'low' | 'medium' | 'high' | 'emergency';
    canEdit: boolean;
    canCancel: boolean;
  };
}

/**
 * Context value type
 */
interface AppointmentsContextValue {
  // Data
  appointments: AppointmentWithDetails[];
  todayAppointments: AppointmentWithDetails[];
  stats: AppointmentStats;
  calendarEvents: CalendarEvent[];

  // State
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;

  // Date range management
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;

  // Calendar view management
  currentView: CalendarView;
  setCurrentView: (view: CalendarView) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;

  // Actions
  refresh: () => Promise<void>;

  // Mutations
  createAppointment: (data: AppointmentFormData) => Promise<AppointmentWithDetails>;
  updateAppointment: (
    id: string,
    data: Partial<AppointmentFormData>
  ) => Promise<AppointmentWithDetails>;
  deleteAppointment: (id: string) => Promise<AppointmentWithDetails>;
  quickAction: (
    id: string,
    action: string,
    notes?: string
  ) => Promise<AppointmentWithDetails>;
}

const AppointmentsContext = createContext<AppointmentsContextValue | null>(null);

/**
 * Get default date range based on view
 */
function getDefaultDateRange(view: CalendarView, date: Date): DateRange {
  switch (view) {
    case 'dayGridMonth':
      // Fetch current month + buffer for prev/next month visibility
      return {
        start: startOfMonth(subMonths(date, 1)),
        end: endOfMonth(addMonths(date, 1)),
      };
    case 'timeGridWeek':
    case 'listWeek':
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 }),
      };
    case 'timeGridDay':
      return {
        start: new Date(date.setHours(0, 0, 0, 0)),
        end: new Date(date.setHours(23, 59, 59, 999)),
      };
    default:
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
  }
}

/**
 * Provider props
 */
interface AppointmentsProviderProps {
  children: ReactNode;
  /** Initial calendar view */
  initialView?: CalendarView;
  /** Initial date */
  initialDate?: Date;
}

/**
 * Appointments Provider Component
 *
 * Wrap your appointments page with this provider to share data
 * across all appointment-related components.
 *
 * @example
 * ```tsx
 * <AppointmentsProvider initialView="timeGridWeek">
 *   <AppointmentsPageClient />
 * </AppointmentsProvider>
 * ```
 */
export function AppointmentsProvider({
  children,
  initialView = 'timeGridWeek',
  initialDate = new Date(),
}: AppointmentsProviderProps) {
  // Calendar state
  const [currentView, setCurrentView] = useState<CalendarView>(initialView);
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);

  // Calculate date range based on view
  const dateRange = useMemo(
    () => getDefaultDateRange(currentView, currentDate),
    [currentView, currentDate]
  );

  // Fetch appointments with SWR
  const {
    appointments,
    isLoading,
    isValidating,
    error,
    refresh,
    mutate,
  } = useAppointmentsData({
    startDate: dateRange.start,
    endDate: dateRange.end,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  // Derived data - calculated client-side, no extra API calls
  const todayAppointments = useTodayAppointments(appointments);
  const stats = useAppointmentStatsFromData(appointments);
  const calendarEvents = useCalendarEvents(appointments);

  // Mutations
  const {
    createAppointment,
    updateAppointment,
    deleteAppointment,
    quickAction,
  } = useAppointmentMutations();

  // Custom setDateRange that updates both start and end
  const handleSetDateRange = useCallback((range: DateRange) => {
    // When date range is explicitly set, we update currentDate to match
    setCurrentDate(range.start);
  }, []);

  // Context value
  const value = useMemo<AppointmentsContextValue>(
    () => ({
      // Data
      appointments,
      todayAppointments,
      stats,
      calendarEvents,

      // State
      isLoading,
      isValidating,
      error,

      // Date range
      dateRange,
      setDateRange: handleSetDateRange,

      // Calendar
      currentView,
      setCurrentView,
      currentDate,
      setCurrentDate,

      // Actions
      refresh,

      // Mutations
      createAppointment,
      updateAppointment,
      deleteAppointment,
      quickAction,
    }),
    [
      appointments,
      todayAppointments,
      stats,
      calendarEvents,
      isLoading,
      isValidating,
      error,
      dateRange,
      handleSetDateRange,
      currentView,
      currentDate,
      refresh,
      createAppointment,
      updateAppointment,
      deleteAppointment,
      quickAction,
    ]
  );

  return (
    <SWRConfig
      value={{
        // Global SWR configuration for appointments
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 2000,
        errorRetryCount: 3,
      }}
    >
      <AppointmentsContext.Provider value={value}>
        {children}
      </AppointmentsContext.Provider>
    </SWRConfig>
  );
}

/**
 * Hook to access appointments context
 *
 * Must be used within an AppointmentsProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { appointments, stats, quickAction } = useAppointmentsContext();
 *
 *   return <div>{appointments.length} citas</div>;
 * }
 * ```
 */
export function useAppointmentsContext(): AppointmentsContextValue {
  const context = useContext(AppointmentsContext);

  if (!context) {
    throw new Error(
      'useAppointmentsContext must be used within an AppointmentsProvider'
    );
  }

  return context;
}

/**
 * Hook to check if we're inside an AppointmentsProvider
 */
export function useIsInAppointmentsProvider(): boolean {
  const context = useContext(AppointmentsContext);
  return context !== null;
}

/**
 * Safe version of useAppointmentsContext that returns null if not in provider
 * Use this when the component needs to support both context and legacy modes
 */
export function useSafeAppointmentsContext(): AppointmentsContextValue | null {
  return useContext(AppointmentsContext);
}
