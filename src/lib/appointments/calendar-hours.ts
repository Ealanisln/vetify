/**
 * Time-grid window and shaded business hours for the appointments calendar,
 * derived from the clinic's saved weekly schedule and widened so no
 * appointment falls outside the visible window.
 */
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

/** Event bounds as FullCalendar receives them: Date or local "YYYY-MM-DDTHH:mm:ss". */
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

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function buildCalendarHours(
  days: CalendarDayHours[] | null | undefined,
  events: CalendarEventBounds[] = []
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
    const start = new Date(event.start);
    const end = new Date(event.end);
    if (isNaN(start.getTime())) continue;

    min = Math.min(min, minutesOfDay(start));
    if (!isNaN(end.getTime())) {
      max = Math.max(max, isSameLocalDay(start, end) ? minutesOfDay(end) : DAY_MIN);
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
