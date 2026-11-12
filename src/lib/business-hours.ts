/**
 * Shared business-hours rules. Pure (no Prisma) so the settings form and the
 * API validate the same way.
 */

export interface DaySchedule {
  startTime: string;
  endTime: string;
  lunchStart?: string | null;
  lunchEnd?: string | null;
}

export type ScheduleField = 'startTime' | 'endTime' | 'lunchStart' | 'lunchEnd';

export interface ScheduleError {
  field: ScheduleField;
  message: string;
}

/** "HH:mm" (or "H:mm") to minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Consistency checks for one day's schedule. Times are compared numerically so
 * "8:00" and "08:00" behave the same.
 */
export function getScheduleErrors(schedule: DaySchedule): ScheduleError[] {
  const errors: ScheduleError[] = [];
  const start = timeToMinutes(schedule.startTime);
  const end = timeToMinutes(schedule.endTime);

  if (end <= start) {
    errors.push({ field: 'endTime', message: 'La hora de cierre debe ser posterior a la de apertura' });
  }

  const { lunchStart, lunchEnd } = schedule;
  if (lunchStart && !lunchEnd) {
    errors.push({ field: 'lunchEnd', message: 'Indica el fin de la comida' });
  } else if (!lunchStart && lunchEnd) {
    errors.push({ field: 'lunchStart', message: 'Indica el inicio de la comida' });
  } else if (lunchStart && lunchEnd) {
    const lunchStartMinutes = timeToMinutes(lunchStart);
    const lunchEndMinutes = timeToMinutes(lunchEnd);

    if (lunchEndMinutes <= lunchStartMinutes) {
      errors.push({ field: 'lunchEnd', message: 'El fin de la comida debe ser posterior al inicio' });
    } else if (lunchStartMinutes < start || lunchEndMinutes > end) {
      errors.push({ field: 'lunchStart', message: 'La comida debe quedar dentro del horario de atención' });
    }
  }

  return errors;
}
