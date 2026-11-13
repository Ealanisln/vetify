/**
 * @jest-environment ./__tests__/utils/jsdom-timezone-environment.cjs
 * @timezone Asia/Tokyo
 *
 * The provider loads the clinic's timezone (the same source the calendar
 * uses) and computes "Citas de hoy" and the stats in it.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { isWithinInterval } from 'date-fns';
import {
  AppointmentsProvider,
  useAppointmentsContext,
} from '@/components/providers/AppointmentsProvider';
import type { AppointmentWithDetails } from '@/lib/appointments/fetchers';
import type { UseAppointmentsDataOptions } from '@/hooks/appointments/useAppointmentsData';
import type { ClinicCalendarSettings } from '@/hooks/useCalendar';

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

jest.mock('@/hooks/useCalendar', () => ({
  useClinicCalendarSettings: jest.fn(),
}));

import { useAppointmentsData } from '@/hooks/appointments/useAppointmentsData';
import { useClinicCalendarSettings } from '@/hooks/useCalendar';

const mockedUseAppointmentsData = useAppointmentsData as jest.MockedFunction<typeof useAppointmentsData>;
const mockedClinicSettings = useClinicCalendarSettings as jest.MockedFunction<
  typeof useClinicCalendarSettings
>;

function appointmentAt(id: string, iso: string): AppointmentWithDetails {
  const dateTime = new Date(iso);
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

// Now: Sunday 2026-11-15 21:00 in Mexico City, 22:00 in Lima, Monday in Tokyo.
const NOW = new Date('2026-11-16T03:00:00Z');
// Sunday 23:30 in Mexico City, but already Monday 00:30 in Lima
const lateSunday = appointmentAt('late-sunday', '2026-11-16T05:30:00Z');
// Sunday 08:00 in Mexico City, 09:00 in Lima
const sundayMorning = appointmentAt('sunday-morning', '2026-11-15T14:00:00Z');
const db = [lateSunday, sundayMorning];

let captured: ReturnType<typeof useAppointmentsContext> | null = null;
function Probe() {
  captured = useAppointmentsContext();
  return null;
}

function renderWithClinic(settings: ClinicCalendarSettings) {
  mockedClinicSettings.mockReturnValue(settings);
  render(
    <AppointmentsProvider initialView="timeGridWeek" initialDate={NOW}>
      <Probe />
    </AppointmentsProvider>
  );
  return captured!;
}

describe('AppointmentsProvider today list in the clinic timezone', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
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

  afterEach(() => {
    jest.useRealTimers();
  });

  it("uses the clinic's zone once it loads", () => {
    const ctx = renderWithClinic({ days: null, timeZone: 'America/Lima' });
    expect(ctx.todayAppointments.map((a) => a.id)).toEqual(['sunday-morning']);
    expect(ctx.stats.today).toBe(1);
  });

  it('uses Mexico City until the zone loads', () => {
    const ctx = renderWithClinic({ days: null, timeZone: null });
    expect(ctx.todayAppointments.map((a) => a.id).sort()).toEqual(['late-sunday', 'sunday-morning']);
    expect(ctx.stats.today).toBe(2);
  });

  it('shares the loaded clinic settings with the page', () => {
    const settings = { days: null, timeZone: 'America/Lima' };
    const ctx = renderWithClinic(settings);
    expect(ctx.clinicSettings).toEqual(settings);
  });
});
