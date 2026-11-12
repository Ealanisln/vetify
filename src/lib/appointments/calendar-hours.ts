/**
 * Time-grid window and shaded business hours for the appointments calendar,
 * derived from the clinic's saved weekly schedule and widened so no
 * appointment falls outside the visible window.
 */
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { buildDefaultWeek, timeToMinutes } from '@/lib/business-hours';

export interface CalendarDayHours {
  dayOfWeek: number; // 0 = Sunday
  isWorkingDay: boolean;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface CalendarBusinessHours {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
}

export interface CalendarHoursConfig {
  businessHours: CalendarBusinessHours[];
  slotMinTime: string;
  slotMaxTime: string;
}

/**
 * Event bounds as FullCalendar receives them: a Date, an ISO instant, or a
 * wall time without offset ("YYYY-MM-DDTHH:mm:ss", read in the calendar's zone).
 */
export interface CalendarEventBounds {
  start: Date | string;
  end: Date | string;
}

const FALLBACK_START_MIN = 8 * 60;
const FALLBACK_END_MIN = 18 * 60;
const DAY_MIN = 24 * 60;

function toDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/** Wall-clock reading of an instant: browser-local, or in `timeZone` when given. */
function wallClock(date: Date, timeZone?: string): { day: string; minutes: number } {
  if (timeZone) {
    const [day, hh, mm] = formatInTimeZone(date, timeZone, 'yyyy-MM-dd|H|m').split('|');
    return { day, minutes: Number(hh) * 60 + Number(mm) };
  }
  return {
    day: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
    minutes: date.getHours() * 60 + date.getMinutes(),
  };
}

function parseBound(value: Date | string, timeZone?: string): Date {
  if (value instanceof Date || !timeZone) return new Date(value);
  // Offset-less strings are wall time in the calendar's zone, as in FullCalendar
  return toDate(value, { timeZone });
}

/**
 * @param timeZone The calendar's (clinic's) IANA zone. Slot times are wall
 *   clock in that zone; without it, the browser's zone is used.
 */
export function buildCalendarHours(
  days: CalendarDayHours[] | null | undefined,
  events: CalendarEventBounds[] = [],
  timeZone?: string
): CalendarHoursConfig {
  const week: CalendarDayHours[] = days && days.length > 0 ? days : buildDefaultWeek();
  const open = week.filter((day) => day.isWorkingDay);

  const businessHours = open.map((day) => ({
    daysOfWeek: [day.dayOfWeek],
    startTime: day.startTime,
    endTime: day.endTime,
  }));

  let min = open.length > 0 ? Math.min(...open.map((d) => timeToMinutes(d.startTime))) : FALLBACK_START_MIN;
  let max = open.length > 0 ? Math.max(...open.map((d) => timeToMinutes(d.endTime))) : FALLBACK_END_MIN;

  for (const event of events) {
    const start = parseBound(event.start, timeZone);
    const end = parseBound(event.end, timeZone);
    if (isNaN(start.getTime())) continue;

    const startClock = wallClock(start, timeZone);
    min = Math.min(min, startClock.minutes);
    if (!isNaN(end.getTime())) {
      const endClock = wallClock(end, timeZone);
      max = Math.max(max, endClock.day === startClock.day ? endClock.minutes : DAY_MIN);
    }
  }

  // Whole hours read better on the grid
  const slotMin = Math.floor(min / 60) * 60;
  const slotMax = Math.min(DAY_MIN, Math.ceil(max / 60) * 60);

  return {
    businessHours,
    slotMinTime: toDuration(slotMin),
    slotMaxTime: toDuration(Math.max(slotMax, slotMin + 60)),
  };
}
