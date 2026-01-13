/**
 * Appointments Library
 *
 * Shared utilities for appointment data management.
 */

export {
  APPOINTMENTS_KEYS,
  createListKey,
  createCalendarKey,
  type AppointmentListParams,
  type AppointmentCacheKey,
} from './cache-keys';

export {
  fetchAppointments,
  fetchAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  quickActionAppointment,
  checkAvailability,
  checkSpecificSlot,
  type AppointmentWithDetails,
  type AppointmentQuery,
} from './fetchers';
