/**
 * The Today list and the stats must describe the current day/week/month no
 * matter which range the calendar is showing. They used to be derived from the
 * calendar's own range, so navigating the calendar to another month emptied
 * "Citas de hoy" and zeroed the stats.
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import { addMonths, isWithinInterval } from 'date-fns';
import {
  AppointmentsProvider,
  useAppointmentsContext,
} from '@/components/providers/AppointmentsProvider';
import type { AppointmentWithDetails } from '@/lib/appointments/fetchers';
import type { UseAppointmentsDataOptions } from '@/hooks/appointments/useAppointmentsData';

// Only the network hook is replaced; the derived hooks (today, stats,
// calendar events) are the real ones.
jest.mock('@/hooks/appointments/useAppointmentsData', () => {
  const actual = jest.requireActual('@/hooks/appointments/useAppointmentsData');
  return { ...actual, useAppointmentsData: jest.fn() };
});

jest.mock('@/hooks/appointments/useAppointmentMutations', () => ({
  useAppointmentMutations: () => ({
    createAppointment: jest.fn(),
    updateAppointment: jest.fn(),
    deleteAppointment: jest.fn(),
    quickAction: jest.fn(),
    invalidateAll: jest.fn(),
  }),
}));

// "Today" here is built from the process's local clock, so the clinic runs in
// the process zone. Clinic-zone behavior: AppointmentsProvider.clinic-today.test.tsx
jest.mock('@/hooks/useCalendar', () => ({
  useClinicCalendarSettings: () => ({
    days: null,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }),
}));

import { useAppointmentsData } from '@/hooks/appointments/useAppointmentsData';

const mockedUseAppointmentsData = useAppointmentsData as jest.MockedFunction<typeof useAppointmentsData>;

function appointmentAt(id: string, dateTime: Date): AppointmentWithDetails {
  return {
    id,
    dateTime,
    duration: 30,
    reason: 'Consulta',
    status: 'SCHEDULED',
    createdAt: dateTime,
    updatedAt: dateTime,
    customer: { id: 'c1', name: 'Ana' },
    pet: { id: 'p1', name: 'Firulais', species: 'dog' },
  };
}

const todayAtNoon = new Date();
todayAtNoon.setHours(12, 0, 0, 0);
const farAway = addMonths(todayAtNoon, -6);

// A fake "server": each call gets the appointments inside its own range.
const db = [appointmentAt('today', todayAtNoon), appointmentAt('far', farAway)];

let captured: ReturnType<typeof useAppointmentsContext> | null = null;
function Probe() {
  captured = useAppointmentsContext();
  return null;
}

describe('AppointmentsProvider today list and stats', () => {
  beforeEach(() => {
    captured = null;
    mockedUseAppointmentsData.mockImplementation((options: UseAppointmentsDataOptions = {}) => {
      const { startDate, endDate } = options;
      const appointments =
        startDate && endDate
          ? db.filter((a) => isWithinInterval(a.dateTime, { start: startDate, end: endDate }))
          : db;
      return {
        appointments,
        isLoading: false,
        isValidating: false,
        error: null,
        refresh: jest.fn(),
        mutate: jest.fn() as never,
      };
    });
  });

  it('keeps today and stats when the calendar shows another month', () => {
    render(
      <AppointmentsProvider initialView="dayGridMonth" initialDate={new Date(farAway)}>
        <Probe />
      </AppointmentsProvider>
    );

    // The calendar shows the far-away month...
    expect(captured!.appointments.map((a) => a.id)).toEqual(['far']);
    // ...but today's list and stats still describe today.
    expect(captured!.todayAppointments.map((a) => a.id)).toEqual(['today']);
    expect(captured!.stats.today).toBe(1);
  });

  it('keeps today when the user navigates the calendar away from today', () => {
    render(
      <AppointmentsProvider initialView="timeGridWeek" initialDate={new Date()}>
        <Probe />
      </AppointmentsProvider>
    );
    expect(captured!.todayAppointments.map((a) => a.id)).toEqual(['today']);

    act(() => {
      captured!.setCurrentDate(new Date(farAway));
    });

    expect(captured!.todayAppointments.map((a) => a.id)).toEqual(['today']);
    expect(captured!.stats.today).toBe(1);
  });
});
