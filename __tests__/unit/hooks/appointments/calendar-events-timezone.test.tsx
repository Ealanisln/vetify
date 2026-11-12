/**
 * @jest-environment ./__tests__/utils/jsdom-timezone-environment.cjs
 * @timezone Asia/Tokyo
 *
 * The calendar runs in the clinic's timezone, so events must reach it as
 * absolute instants. A browser-local wall time without offset (the old
 * format) would be read as clinic wall time and shift the appointment by
 * the difference between the two zones.
 */
import { renderHook } from '@testing-library/react';
import { useCalendarEvents } from '@/hooks/appointments/useAppointmentsData';
import type { AppointmentWithDetails } from '@/lib/appointments/fetchers';

// 10:00 in Mexico City; 01:00 the next day in Tokyo
const TEN_AM_CLINIC = '2026-11-16T16:00:00.000Z';

const appointment = {
  id: 'appt-1',
  dateTime: new Date(TEN_AM_CLINIC),
  duration: 30,
  reason: 'Consulta',
  status: 'SCHEDULED',
  customer: { id: 'c1', name: 'Ana', phone: '5551234567' },
  pet: { id: 'p1', name: 'Firulais', species: 'dog' },
} as unknown as AppointmentWithDetails;

describe('useCalendarEvents in a browser outside the clinic timezone', () => {
  it('runs in a browser zone different from the clinic', () => {
    expect(new Date(TEN_AM_CLINIC).getTimezoneOffset()).toBe(-540);
  });

  it('emits the absolute start and end instants', () => {
    const { result } = renderHook(() => useCalendarEvents([appointment]));

    expect(result.current[0].start).toBe(TEN_AM_CLINIC);
    expect(result.current[0].end).toBe('2026-11-16T16:30:00.000Z');
  });
});
