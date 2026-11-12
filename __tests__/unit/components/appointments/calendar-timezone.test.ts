/**
 * @jest-environment ./__tests__/utils/jsdom-timezone-environment.cjs
 * @timezone Asia/Tokyo
 * @jest-environment-options {"customExportConditions": ["node", "require", "default"]}
 *
 * (FullCalendar's CJS build requires preact; the default "browser" condition
 * would resolve preact's ESM build, which Jest cannot load.)
 *
 * The appointments calendar must run in the clinic's timezone, whatever the
 * browser's is. These tests drive a real (headless) FullCalendar with the
 * same plugins the dashboard uses, from a browser in Tokyo, for a clinic in
 * Mexico City (UTC-6). Without a timezone plugin FullCalendar "UTC-coerces"
 * named zones, so a 10:00 clinic slot would come back as 10:00 UTC.
 */
import { Calendar, type DateSelectArg } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import { formatInTimeZone } from 'date-fns-tz';
import { calendarPlugins } from '@/components/appointments/calendar-plugins';

const CLINIC_TZ = 'America/Mexico_City';

// 2026-11-16 is a Monday; 10:00 in Mexico City is 16:00 UTC (01:00 next day in Tokyo)
const TEN_AM_CLINIC = '2026-11-16T16:00:00.000Z';

function makeCalendar(extra: Record<string, unknown> = {}) {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const calendar = new Calendar(el, {
    plugins: calendarPlugins,
    timeZone: CLINIC_TZ,
    initialView: 'timeGridWeek',
    initialDate: TEN_AM_CLINIC,
    selectable: true,
    editable: true,
    ...extra,
  });
  calendar.render();
  return calendar;
}

describe('appointments calendar timezone', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('runs in a browser zone different from the clinic', () => {
    expect(new Date(TEN_AM_CLINIC).getTimezoneOffset()).toBe(-540);
  });

  it('selecting the 10:00 clinic slot yields the 10:00 clinic instant', () => {
    const select = jest.fn<void, [DateSelectArg]>();
    const calendar = makeCalendar({ select });

    // Wall-clock strings are read in the calendar's (clinic) timezone
    calendar.select('2026-11-16T10:00:00', '2026-11-16T10:30:00');

    expect(select).toHaveBeenCalledTimes(1);
    expect(select.mock.calls[0][0].start.toISOString()).toBe(TEN_AM_CLINIC);
    expect(select.mock.calls[0][0].startStr).toBe('2026-11-16T10:00:00-06:00');
  });

  it('shows an absolute appointment instant at its clinic wall time', () => {
    const calendar = makeCalendar({
      events: [{ id: 'a', title: 'Firulais', start: TEN_AM_CLINIC, end: '2026-11-16T16:30:00.000Z' }],
    });

    const event = calendar.getEventById('a')!;
    expect(event.startStr).toBe('2026-11-16T10:00:00-06:00');
    expect(event.start!.toISOString()).toBe(TEN_AM_CLINIC);
  });

  it('moving an appointment to 11:00 clinic time persists 11:00 clinic time', () => {
    const calendar = makeCalendar({
      events: [{ id: 'a', title: 'Firulais', start: TEN_AM_CLINIC, end: '2026-11-16T16:30:00.000Z' }],
    });
    const event = calendar.getEventById('a')!;

    // Same date math FullCalendar runs on a drag: one day later, one hour later
    event.moveDates({ days: 1, hours: 1 });

    expect(event.start!.toISOString()).toBe('2026-11-17T17:00:00.000Z');
    expect(event.end!.toISOString()).toBe('2026-11-17T17:30:00.000Z');
  });

  it('day headers receive instants on the clinic day, to be formatted in the clinic zone', () => {
    const headerDates: Date[] = [];
    const calendar = makeCalendar({
      locale: esLocale,
      dayHeaderContent: (arg: { date: Date }) => {
        headerDates.push(arg.date);
        return '';
      },
    });

    // The week starts Monday 2026-11-16 00:00 in Mexico City
    expect(calendar.view.activeStart.toISOString()).toBe('2026-11-16T06:00:00.000Z');
    expect(headerDates.map((d) => formatInTimeZone(d, CLINIC_TZ, 'yyyy-MM-dd'))).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ]);
  });
});
