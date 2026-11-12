import { buildCalendarHours, type CalendarDayHours } from '@/lib/appointments/calendar-hours';

function week(overrides: Partial<Record<number, Partial<CalendarDayHours>>> = {}): CalendarDayHours[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isWorkingDay: dayOfWeek >= 1 && dayOfWeek <= 5,
    startTime: '09:00',
    endTime: '17:00',
    ...overrides[dayOfWeek],
  }));
}

// Local wall-clock times: the calendar renders in the browser's zone.
const at = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m - 1, d, h, min);

describe('buildCalendarHours', () => {
  it('uses the saved hours for the grid and the shaded business hours', () => {
    const config = buildCalendarHours(week({ 6: { isWorkingDay: true, startTime: '07:30', endTime: '20:00' } }), []);

    expect(config.slotMinTime).toBe('07:00:00');
    expect(config.slotMaxTime).toBe('20:00:00');
    expect(config.businessHours).toEqual(
      expect.arrayContaining([
        { daysOfWeek: [1], startTime: '09:00', endTime: '17:00' },
        { daysOfWeek: [6], startTime: '07:30', endTime: '20:00' },
      ])
    );
    expect(config.businessHours.find((h) => h.daysOfWeek[0] === 0)).toBeUndefined();
  });

  it('falls back to Mon-Sat 08:00-18:00 when hours are unknown', () => {
    const config = buildCalendarHours(null, []);

    expect(config.slotMinTime).toBe('08:00:00');
    expect(config.slotMaxTime).toBe('18:00:00');
    expect(config.businessHours.map((h) => h.daysOfWeek[0])).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('widens the window to show an appointment after closing time', () => {
    const config = buildCalendarHours(week(), [
      { start: at(2026, 11, 16, 19, 30), end: at(2026, 11, 16, 20, 15) },
    ]);

    expect(config.slotMinTime).toBe('09:00:00');
    expect(config.slotMaxTime).toBe('21:00:00');
  });

  it('widens the window to show an appointment before opening time', () => {
    const config = buildCalendarHours(week(), [
      { start: at(2026, 11, 16, 6, 15), end: at(2026, 11, 16, 6, 45) },
    ]);

    expect(config.slotMinTime).toBe('06:00:00');
  });

  it('accepts the local date strings FullCalendar events use', () => {
    const config = buildCalendarHours(week(), [
      { start: '2026-11-16T21:00:00', end: '2026-11-16T21:30:00' },
    ]);

    expect(config.slotMaxTime).toBe('22:00:00');
  });

  it('extends to midnight for an appointment that ends the next day', () => {
    const config = buildCalendarHours(week(), [
      { start: at(2026, 11, 16, 23, 30), end: at(2026, 11, 17, 0, 30) },
    ]);

    expect(config.slotMaxTime).toBe('24:00:00');
  });

  it('keeps a sane window when no day is open', () => {
    const closed = week({ 1: { isWorkingDay: false }, 2: { isWorkingDay: false }, 3: { isWorkingDay: false }, 4: { isWorkingDay: false }, 5: { isWorkingDay: false } });
    const config = buildCalendarHours(closed, []);

    expect(config.businessHours).toEqual([]);
    expect(config.slotMinTime).toBe('08:00:00');
    expect(config.slotMaxTime).toBe('18:00:00');
  });
});
