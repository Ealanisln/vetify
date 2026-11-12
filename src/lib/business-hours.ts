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

/** The schedule a clinic gets until it configures its own. */
export const DEFAULT_SCHEDULE = {
  startTime: '08:00',
  endTime: '18:00',
  lunchStart: '13:00',
  lunchEnd: '14:00',
  slotDuration: 15,
} as const;

/** Monday to Saturday open, Sunday closed. */
export const isDefaultWorkingDay = (dayOfWeek: number) => dayOfWeek >= 1 && dayOfWeek <= 6;

/** Tenant-wide defaults as stored on TenantSettings. */
export interface ScheduleDefaults {
  defaultStartTime: string;
  defaultEndTime: string;
  defaultLunchStart: string | null;
  defaultLunchEnd: string | null;
  defaultSlotDuration: number;
}

export interface DayHours {
  dayOfWeek: number;
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  lunchStart: string | null;
  lunchEnd: string | null;
  slotDuration: number;
}

/**
 * Hours for a day that has no BusinessHours row: the tenant defaults when they
 * exist (an explicit null lunch means "Sin comida"), otherwise DEFAULT_SCHEDULE.
 */
export function defaultDayHours(dayOfWeek: number, defaults?: Partial<ScheduleDefaults> | null): DayHours {
  return {
    dayOfWeek,
    isWorkingDay: isDefaultWorkingDay(dayOfWeek),
    startTime: defaults?.defaultStartTime ?? DEFAULT_SCHEDULE.startTime,
    endTime: defaults?.defaultEndTime ?? DEFAULT_SCHEDULE.endTime,
    lunchStart: defaults?.defaultLunchStart !== undefined ? defaults.defaultLunchStart : DEFAULT_SCHEDULE.lunchStart,
    lunchEnd: defaults?.defaultLunchEnd !== undefined ? defaults.defaultLunchEnd : DEFAULT_SCHEDULE.lunchEnd,
    slotDuration: defaults?.defaultSlotDuration ?? DEFAULT_SCHEDULE.slotDuration,
  };
}

/** Seven default rows, Sunday (0) first. */
export function buildDefaultWeek(defaults?: Partial<ScheduleDefaults> | null): DayHours[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => defaultDayHours(dayOfWeek, defaults));
}

/**
 * Exactly one entry per day, Sunday first: the first stored row for each day
 * (older data can hold duplicates, since NULL locationIds never collide on the
 * unique index) or the default for days without a row.
 */
export function completeWeek<T extends { dayOfWeek: number }>(
  rows: T[],
  defaults?: Partial<ScheduleDefaults> | null,
): (T | DayHours)[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) =>
    rows.find(row => row.dayOfWeek === dayOfWeek) ?? defaultDayHours(dayOfWeek, defaults));
}

const DEFAULT_TO_DAY_FIELD = {
  defaultStartTime: 'startTime',
  defaultEndTime: 'endTime',
  defaultLunchStart: 'lunchStart',
  defaultLunchEnd: 'lunchEnd',
  defaultSlotDuration: 'slotDuration',
} as const;

export type DefaultField = keyof typeof DEFAULT_TO_DAY_FIELD;

interface EditableDay {
  startTime: string;
  endTime: string;
  lunchStart: string | null;
  lunchEnd: string | null;
  slotDuration: number | null;
}

/**
 * Changes a tenant default and carries it to every day that still follows it.
 *
 * A day "follows" a default when its value equals the previous default (or,
 * for slot duration, is missing); a day whose value differs was customized and
 * is left alone, including a day set to "Sin comida". This
 * makes saving the defaults do what an owner expects without a schema change:
 * the defaults drive every non-customized day, and "Aplicar a Todos los Días"
 * remains the way to override customized days too. Clearing the default lunch
 * start also clears the default lunch end, since an end needs a start.
 */
export function applyDefaultChange<D extends EditableDay, T extends ScheduleDefaults & { businessHours: D[] }>(
  data: T,
  field: DefaultField,
  value: string | number | null,
): T {
  const changes: [DefaultField, string | number | null][] = [[field, value]];
  if (field === 'defaultLunchStart' && value === null) changes.push(['defaultLunchEnd', null]);

  let next: T = { ...data };
  for (const [defaultField, newValue] of changes) {
    const dayField = DEFAULT_TO_DAY_FIELD[defaultField];
    const previous = next[defaultField] ?? null;
    next = {
      ...next,
      [defaultField]: newValue,
      businessHours: next.businessHours.map(day =>
        (day[dayField] ?? null) === previous || (dayField === 'slotDuration' && day.slotDuration == null)
          ? { ...day, [dayField]: newValue }
          : day),
    };
  }
  return next;
}
