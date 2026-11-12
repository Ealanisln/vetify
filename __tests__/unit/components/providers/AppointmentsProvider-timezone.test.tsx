/**
 * @jest-environment ./__tests__/utils/jsdom-timezone-environment.cjs
 * @timezone Asia/Tokyo
 *
 * The calendar shows the clinic's week, but the provider only knows the
 * browser's. The fetched range must still cover every appointment of the
 * clinic week the calendar displays, whatever the browser's zone is.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { AppointmentsProvider } from '@/components/providers/AppointmentsProvider';
import * as useAppointmentsDataModule from '@/hooks/appointments/useAppointmentsData';

jest.mock('@/hooks/appointments/useAppointmentsData', () => ({
  useAppointmentsData: jest.fn(() => ({
    appointments: [],
    isLoading: false,
    isValidating: false,
    error: null,
    refresh: jest.fn(),
    mutate: jest.fn(),
  })),
  useTodayAppointments: jest.fn(() => []),
  useAppointmentStatsFromData: jest.fn(() => ({ today: 0, thisWeek: 0, thisMonth: 0, completionRate: 0 })),
  useCalendarEvents: jest.fn(() => []),
  getStatsDateRange: jest.requireActual('@/hooks/appointments/useAppointmentsData').getStatsDateRange,
}));

jest.mock('@/hooks/appointments/useAppointmentMutations', () => ({
  useAppointmentMutations: jest.fn(() => ({
    createAppointment: jest.fn(),
    updateAppointment: jest.fn(),
    deleteAppointment: jest.fn(),
    quickAction: jest.fn(),
  })),
}));

const mockedUseAppointmentsData = useAppointmentsDataModule.useAppointmentsData as jest.Mock;

function calendarRange(view: 'timeGridWeek' | 'timeGridDay', initialDate: Date) {
  mockedUseAppointmentsData.mockClear();
  render(
    <AppointmentsProvider initialView={view} initialDate={initialDate}>
      <div />
    </AppointmentsProvider>
  );
  // First call is the calendar's range; the second is today/stats
  const { startDate, endDate } = mockedUseAppointmentsData.mock.calls[0][0];
  return { startDate: startDate as Date, endDate: endDate as Date };
}

const covers = (range: { startDate: Date; endDate: Date }, instant: string) => {
  const t = new Date(instant).getTime();
  return range.startDate.getTime() <= t && t <= range.endDate.getTime();
};

describe('AppointmentsProvider range for a clinic in another timezone', () => {
  it('runs in a browser zone different from the clinic', () => {
    expect(new Date('2026-11-16T16:00:00Z').getTimezoneOffset()).toBe(-540);
  });

  it("covers the whole clinic week (Mexico City), including Sunday evening", () => {
    // Wednesday 2026-11-18 at noon, clinic time
    const range = calendarRange('timeGridWeek', new Date('2026-11-18T18:00:00Z'));

    // Monday 2026-11-16 00:30 in Mexico City
    expect(covers(range, '2026-11-16T06:30:00Z')).toBe(true);
    // Sunday 2026-11-22 20:00 in Mexico City (Monday 11:00 in Tokyo)
    expect(covers(range, '2026-11-23T02:00:00Z')).toBe(true);
  });

  it('covers the whole clinic day in day view', () => {
    // Monday 2026-11-16 at noon, clinic time
    const range = calendarRange('timeGridDay', new Date('2026-11-16T18:00:00Z'));

    // 08:00 and 19:00 on Monday 2026-11-16 in Mexico City
    expect(covers(range, '2026-11-16T14:00:00Z')).toBe(true);
    expect(covers(range, '2026-11-17T01:00:00Z')).toBe(true);
  });
});
