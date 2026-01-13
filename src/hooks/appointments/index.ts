/**
 * Appointments Hooks
 *
 * SWR-based hooks for appointment data management.
 * These hooks provide caching, deduplication, and optimistic updates.
 */

export {
  useAppointmentsData,
  useTodayAppointments,
  useAppointmentStatsFromData,
  useCalendarEvents,
  type UseAppointmentsDataOptions,
  type UseAppointmentsDataReturn,
  type AppointmentStats,
} from './useAppointmentsData';

export {
  useAppointmentMutations,
  useOptimisticAppointmentMutation,
  type UseAppointmentMutationsReturn,
} from './useAppointmentMutations';
