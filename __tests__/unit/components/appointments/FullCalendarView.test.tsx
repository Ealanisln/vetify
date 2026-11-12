/**
 * FullCalendarView drag & drop / resize.
 *
 * `canEdit` lives on the event's extendedProps, not on the appointment, so
 * the handlers used to revert every drop. These tests drive the real handlers
 * through the props FullCalendar receives.
 */
import React from 'react';
import { render, waitFor, act } from '@testing-library/react';

type CalendarProps = Record<string, unknown>;
let calendarProps: CalendarProps = {};

jest.mock('@fullcalendar/react', () => {
  const MockFullCalendar = (props: CalendarProps) => {
    calendarProps = props;
    return <div data-testid="full-calendar" />;
  };
  return { __esModule: true, default: MockFullCalendar };
});
jest.mock('@fullcalendar/daygrid', () => ({ __esModule: true, default: {} }));
jest.mock('@fullcalendar/timegrid', () => ({ __esModule: true, default: {} }));
jest.mock('@fullcalendar/interaction', () => ({ __esModule: true, default: {} }));
jest.mock('@fullcalendar/list', () => ({ __esModule: true, default: {} }));
jest.mock('@fullcalendar/core/locales/es', () => ({ __esModule: true, default: {} }));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mockUpdateAppointment = jest.fn();
const mockRefresh = jest.fn().mockResolvedValue(undefined);
let mockCalendarEvents: unknown[] = [];

jest.mock('@/components/providers/AppointmentsProvider', () => ({
  useSafeAppointmentsContext: () => ({
    calendarEvents: mockCalendarEvents,
    isLoading: false,
    error: null,
    currentDate: new Date('2026-11-16T12:00:00Z'),
    currentView: 'timeGridWeek',
    setCurrentDate: jest.fn(),
    setCurrentView: jest.fn(),
    refresh: mockRefresh,
    updateAppointment: mockUpdateAppointment,
    quickAction: jest.fn(),
  }),
}));

import { toast } from 'sonner';
import { FullCalendarView } from '@/components/appointments/FullCalendarView';

const appointment = {
  id: 'appt-1',
  dateTime: new Date('2026-11-16T16:00:00Z'),
  duration: 30,
  reason: 'Consulta',
  status: 'SCHEDULED',
  customer: { id: 'c1', name: 'Ana' },
  pet: { id: 'p1', name: 'Firulais', species: 'dog' },
};

function dropInfo({
  canEdit = true,
  start = new Date('2026-11-17T17:00:00Z'),
  end = new Date('2026-11-17T17:30:00Z'),
} = {}) {
  return {
    event: {
      start,
      end,
      extendedProps: { appointment, canEdit, canCancel: true, priority: 'medium' },
    },
    revert: jest.fn(),
  };
}

type Handler = (info: ReturnType<typeof dropInfo>) => Promise<void>;

describe('FullCalendarView drag and resize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    calendarProps = {};
    // Business hours are not under test here; the calendar uses the defaults
    global.fetch = jest.fn(async () => ({ ok: false, json: async () => ({}) }) as Response) as typeof fetch;
  });

  it('persists a drop on an editable appointment', async () => {
    mockUpdateAppointment.mockResolvedValue({ ...appointment });
    render(<FullCalendarView />);
    const info = dropInfo();

    await (calendarProps.eventDrop as Handler)(info);

    expect(mockUpdateAppointment).toHaveBeenCalledWith('appt-1', {
      dateTime: new Date('2026-11-17T17:00:00Z'),
    });
    expect(info.revert).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it('reverts a drop on a non-editable appointment without calling the API', async () => {
    render(<FullCalendarView />);
    const info = dropInfo({ canEdit: false });

    await (calendarProps.eventDrop as Handler)(info);

    expect(mockUpdateAppointment).not.toHaveBeenCalled();
    expect(info.revert).toHaveBeenCalled();
  });

  it('reverts a conflicting drop and shows the server message', async () => {
    mockUpdateAppointment.mockRejectedValue(new Error('Dra. López ya tiene una cita en este horario'));
    render(<FullCalendarView />);
    const info = dropInfo();

    await (calendarProps.eventDrop as Handler)(info);

    await waitFor(() => expect(info.revert).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Dra. López ya tiene una cita en este horario');
  });

  it('persists a resize with the new duration', async () => {
    mockUpdateAppointment.mockResolvedValue({ ...appointment });
    render(<FullCalendarView />);
    const info = dropInfo({
      start: new Date('2026-11-16T16:00:00Z'),
      end: new Date('2026-11-16T17:00:00Z'),
    });

    await (calendarProps.eventResize as Handler)(info);

    expect(mockUpdateAppointment).toHaveBeenCalledWith('appt-1', { duration: 60 });
    expect(info.revert).not.toHaveBeenCalled();
  });

  it('reverts a conflicting resize and shows the server message', async () => {
    mockUpdateAppointment.mockRejectedValue(new Error('Dra. López ya tiene una cita en este horario'));
    render(<FullCalendarView />);
    const info = dropInfo({
      start: new Date('2026-11-16T16:00:00Z'),
      end: new Date('2026-11-16T17:00:00Z'),
    });

    await (calendarProps.eventResize as Handler)(info);

    expect(info.revert).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Dra. López ya tiene una cita en este horario');
  });
});

describe('FullCalendarView visible hours', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    calendarProps = {};
    mockCalendarEvents = [];
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function mockHoursEndpoint(days: unknown[]) {
    global.fetch = jest.fn(async (url: RequestInfo | URL) => {
      if (String(url) === '/api/appointments/business-hours') {
        return { ok: true, json: async () => ({ success: true, data: { timeZone: 'America/Mexico_City', days } }) } as Response;
      }
      throw new Error(`unexpected fetch ${String(url)}`);
    }) as typeof fetch;
  }

  it("uses the clinic's saved hours for the time grid", async () => {
    mockHoursEndpoint(
      Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        isWorkingDay: dayOfWeek !== 0,
        startTime: '07:00',
        endTime: '21:00',
      }))
    );

    await act(async () => {
      render(<FullCalendarView />);
    });

    await waitFor(() => expect(calendarProps.slotMaxTime).toBe('21:00:00'));
    expect(calendarProps.slotMinTime).toBe('07:00:00');
    expect(global.fetch).toHaveBeenCalledWith('/api/appointments/business-hours');
  });

  it('shows an appointment after closing time instead of hiding it', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, json: async () => ({}) }) as Response) as typeof fetch;
    mockCalendarEvents = [
      {
        id: 'appt-late-SCHEDULED',
        title: 'Firulais - Ana',
        start: '2026-11-16T19:00:00',
        end: '2026-11-16T19:30:00',
        extendedProps: { appointment, canEdit: true, canCancel: true, priority: 'medium' },
      },
    ];

    await act(async () => {
      render(<FullCalendarView />);
    });

    expect(calendarProps.slotMaxTime).toBe('20:00:00');
  });
});
