/**
 * @jest-environment ./__tests__/utils/jsdom-timezone-environment.cjs
 * @timezone America/Los_Angeles
 *
 * The dashboard calendar shows and edits appointments in the clinic's
 * timezone, not the browser's. The browser here is in Los Angeles (UTC-8)
 * and the clinic in Bogotá (UTC-5), so any browser-local formatting shows
 * up as a three-hour (or one-day) shift.
 */
import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';

type CalendarProps = Record<string, unknown>;
let calendarProps: CalendarProps = {};

jest.mock('@fullcalendar/react', () => {
  const MockFullCalendar = (props: CalendarProps) => {
    calendarProps = props;
    return <div data-testid="full-calendar" />;
  };
  return { __esModule: true, default: MockFullCalendar };
});
jest.mock('@fullcalendar/daygrid', () => ({ __esModule: true, default: { name: 'daygrid' } }));
jest.mock('@fullcalendar/timegrid', () => ({ __esModule: true, default: { name: 'timegrid' } }));
jest.mock('@fullcalendar/interaction', () => ({ __esModule: true, default: { name: 'interaction' } }));
jest.mock('@fullcalendar/list', () => ({ __esModule: true, default: { name: 'list' } }));
jest.mock('@fullcalendar/luxon3', () => ({ __esModule: true, default: { name: 'luxon3' } }));
jest.mock('@fullcalendar/core/locales/es', () => ({ __esModule: true, default: {} }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

let mockCalendarEvents: unknown[] = [];

jest.mock('@/components/providers/AppointmentsProvider', () => ({
  useSafeAppointmentsContext: () => ({
    calendarEvents: mockCalendarEvents,
    isLoading: false,
    error: null,
    currentDate: new Date('2026-11-16T15:00:00Z'),
    currentView: 'timeGridWeek',
    setCurrentDate: jest.fn(),
    setCurrentView: jest.fn(),
    refresh: jest.fn().mockResolvedValue(undefined),
    updateAppointment: jest.fn(),
    quickAction: jest.fn(),
  }),
}));

import { FullCalendarView } from '@/components/appointments/FullCalendarView';

const BOGOTA = 'America/Bogota';
// 10:00 in Bogotá; 07:00 in Los Angeles
const TEN_AM_CLINIC = new Date('2026-11-16T15:00:00Z');

const appointment = {
  id: 'appt-1',
  dateTime: TEN_AM_CLINIC,
  duration: 30,
  reason: 'Consulta',
  status: 'SCHEDULED',
  customer: { id: 'c1', name: 'Ana' },
  pet: { id: 'p1', name: 'Firulais', species: 'dog' },
};

const WEEK = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  isWorkingDay: dayOfWeek >= 1 && dayOfWeek <= 5,
  startTime: '09:00',
  endTime: '17:00',
}));

function mockHoursEndpoint(timeZone: string | null) {
  global.fetch = jest.fn(async () => {
    if (timeZone === null) return { ok: false, json: async () => ({}) } as Response;
    return { ok: true, json: async () => ({ success: true, data: { timeZone, days: WEEK } }) } as Response;
  }) as typeof fetch;
}

async function renderCalendar() {
  await act(async () => {
    render(<FullCalendarView />);
  });
}

type ContentFn = (arg: unknown) => React.ReactNode;

describe('FullCalendarView in the clinic timezone', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    calendarProps = {};
    mockCalendarEvents = [];
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('runs in a browser zone different from the clinic', () => {
    expect(TEN_AM_CLINIC.getTimezoneOffset()).toBe(480);
  });

  it("runs FullCalendar in the clinic's timezone with the timezone plugin", async () => {
    mockHoursEndpoint(BOGOTA);
    await renderCalendar();

    await waitFor(() => expect(calendarProps.timeZone).toBe(BOGOTA));
    expect(calendarProps.plugins).toEqual(expect.arrayContaining([{ name: 'luxon3' }]));
  });

  it('falls back to the default clinic zone, never the browser, if the hours fail to load', async () => {
    mockHoursEndpoint(null);
    await renderCalendar();

    expect(calendarProps.timeZone).toBe('America/Mexico_City');
  });

  it('labels events with their clinic time', async () => {
    mockHoursEndpoint(BOGOTA);
    await renderCalendar();
    await waitFor(() => expect(calendarProps.timeZone).toBe(BOGOTA));

    render(
      <>
        {(calendarProps.eventContent as ContentFn)({
          event: {
            start: TEN_AM_CLINIC,
            title: 'Firulais - Ana',
            textColor: '#000',
            extendedProps: { appointment, priority: 'medium' },
          },
        })}
      </>
    );

    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('labels day headers with the clinic day', async () => {
    mockHoursEndpoint(BOGOTA);
    await renderCalendar();
    await waitFor(() => expect(calendarProps.timeZone).toBe(BOGOTA));

    // Monday 2026-11-16 00:00 in Bogotá is Sunday 21:00 in Los Angeles
    render(<>{(calendarProps.dayHeaderContent as ContentFn)({ date: new Date('2026-11-16T05:00:00Z') })}</>);

    expect(screen.getByText('lun')).toBeInTheDocument();
    expect(screen.getByText('16 nov')).toBeInTheDocument();
  });

  it('shows the clinic time in the details modal opened from the calendar', async () => {
    mockHoursEndpoint(BOGOTA);
    await renderCalendar();
    await waitFor(() => expect(calendarProps.timeZone).toBe(BOGOTA));

    act(() => {
      (calendarProps.eventClick as (arg: unknown) => void)({
        event: {
          start: TEN_AM_CLINIC,
          extendedProps: { appointment, canEdit: true, canCancel: true, priority: 'medium' },
        },
      });
    });

    expect(await screen.findByText('Detalles de la Cita')).toBeInTheDocument();
    expect(screen.getByText('10:00 - 30 min')).toBeInTheDocument();
    expect(screen.getByText('16 de noviembre de 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Cerrar'));
  });

  it('sizes the time grid by clinic time', async () => {
    mockHoursEndpoint(BOGOTA);
    // 19:00-19:30 in Bogotá (16:00 in Los Angeles)
    mockCalendarEvents = [
      {
        id: 'appt-late-SCHEDULED',
        title: 'Firulais - Ana',
        start: '2026-11-17T00:00:00.000Z',
        end: '2026-11-17T00:30:00.000Z',
        extendedProps: { appointment, canEdit: true, canCancel: true, priority: 'medium' },
      },
    ];
    await renderCalendar();

    await waitFor(() => expect(calendarProps.timeZone).toBe(BOGOTA));
    expect(calendarProps.slotMaxTime).toBe('20:00:00');
  });
});
