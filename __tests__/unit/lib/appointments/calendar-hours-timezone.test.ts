/**
 * @jest-environment ./__tests__/utils/jsdom-timezone-environment.cjs
 * @timezone Asia/Tokyo
 *
 * The grid window (slotMinTime/slotMaxTime) is clinic wall-clock time, so an
 * appointment must widen it by its clinic time, not the browser's.
 */
import { buildCalendarHours, type CalendarDayHours } from '@/lib/appointments/calendar-hours';

const MX = 'America/Mexico_City';

function week(): CalendarDayHours[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isWorkingDay: dayOfWeek >= 1 && dayOfWeek <= 5,
    startTime: '09:00',
    endTime: '17:00',
  }));
}

describe('buildCalendarHours in the clinic timezone', () => {
  it('runs in a browser zone different from the clinic', () => {
    expect(new Date('2026-11-16T16:00:00Z').getTimezoneOffset()).toBe(-540);
  });

  it('widens to a 19:00 clinic appointment given as an absolute instant', () => {
    // 19:00-19:30 in Mexico City (10:00 the next day in Tokyo)
    const config = buildCalendarHours(
      week(),
      [{ start: '2026-11-17T01:00:00.000Z', end: '2026-11-17T01:30:00.000Z' }],
      MX
    );

    expect(config.slotMinTime).toBe('09:00:00');
    expect(config.slotMaxTime).toBe('20:00:00');
  });

  it('widens to a 06:30 clinic appointment', () => {
    // 06:30 in Mexico City (21:30 in Tokyo)
    const config = buildCalendarHours(
      week(),
      [{ start: new Date('2026-11-16T12:30:00.000Z'), end: new Date('2026-11-16T13:00:00.000Z') }],
      MX
    );

    expect(config.slotMinTime).toBe('06:00:00');
    expect(config.slotMaxTime).toBe('17:00:00');
  });

  it('reads a wall time without offset as clinic time, like FullCalendar does', () => {
    const config = buildCalendarHours(week(), [{ start: '2026-11-16T19:00:00', end: '2026-11-16T19:30:00' }], MX);

    expect(config.slotMaxTime).toBe('20:00:00');
  });

  it('opens the grid to midnight for an appointment that crosses clinic midnight', () => {
    // 23:30 Nov 16 to 00:30 Nov 17 in Mexico City
    const config = buildCalendarHours(
      week(),
      [{ start: '2026-11-17T05:30:00.000Z', end: '2026-11-17T06:30:00.000Z' }],
      MX
    );

    expect(config.slotMaxTime).toBe('24:00:00');
  });
});
