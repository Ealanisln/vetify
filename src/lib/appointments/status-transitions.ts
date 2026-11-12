/**
 * Server-side rules for appointment status changes.
 *
 * The flow only moves forward (SCHEDULED -> CONFIRMED -> CHECKED_IN ->
 * IN_PROGRESS -> COMPLETED, skipping steps is fine). An appointment can be
 * cancelled until it is completed, and marked NO_SHOW only before check-in.
 * COMPLETED, cancelled and NO_SHOW are terminal.
 */
import {
  getAppointmentStatusLabel,
  type AppointmentStatus,
} from '@/lib/validations/appointments';

export const CANCELLED_STATUSES: readonly AppointmentStatus[] = ['CANCELLED_CLIENT', 'CANCELLED_CLINIC'];

export const ALLOWED_STATUS_TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  SCHEDULED: ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'],
  CONFIRMED: ['CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'],
  CHECKED_IN: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC'],
  COMPLETED: [],
  CANCELLED_CLIENT: [],
  CANCELLED_CLINIC: [],
  NO_SHOW: [],
};

export type StatusChange =
  | { type: 'unchanged' }
  | { type: 'allowed' }
  | { type: 'invalid'; message: string };

export const isCancelledStatus = (status: string): boolean =>
  (CANCELLED_STATUSES as readonly string[]).includes(status);

/**
 * Decide whether an appointment may move from `from` to `to`.
 * Re-cancelling an already cancelled appointment is a no-op ("unchanged"),
 * so callers can stay idempotent and skip side effects such as emails.
 */
export function evaluateStatusChange(from: AppointmentStatus, to: AppointmentStatus): StatusChange {
  if (from === to || (isCancelledStatus(from) && isCancelledStatus(to))) {
    return { type: 'unchanged' };
  }

  if (ALLOWED_STATUS_TRANSITIONS[from]?.includes(to)) {
    return { type: 'allowed' };
  }

  const fromLabel = getAppointmentStatusLabel(from);
  const message = isCancelledStatus(to)
    ? `No se puede cancelar una cita con estado "${fromLabel}".`
    : `No se puede cambiar una cita de "${fromLabel}" a "${getAppointmentStatusLabel(to)}".`;

  return { type: 'invalid', message };
}
