/**
 * @jest-environment ./__tests__/utils/jsdom-timezone-environment.cjs
 * @timezone Asia/Tokyo
 *
 * "Today", "this week" and "this month" on the appointments dashboard are the
 * clinic's, not the browser's. The browser here runs in Tokyo while the
 * clinic is in Mexico City, 15 hours behind, so the two calendars disagree on
 * which day it is.
 */
import { renderHook } from '@testing-library/react';
import {
  getStatsDateRange,
  useAppointmentStatsFromData,
  useTodayAppointments,
} from '@/hooks/appointments/useAppointmentsData';
import type { AppointmentWithDetails } from '@/lib/appointments/fetchers';

const CLINIC = 'America/Mexico_City';

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

const ids = (list: AppointmentWithDetails[]) => list.map((a) => a.id);

afterEach(() => {
  jest.useRealTimers();
});

describe('dashboard periods in the clinic timezone', () => {
  it('runs in a browser zone different from the clinic', () => {
    expect(new Date('2026-11-16T03:00:00Z').getTimezoneOffset()).toBe(-540);
  });

  describe('on Sunday 2026-11-15 21:00 in the clinic (Monday 12:00 in Tokyo)', () => {
    beforeEach(() => {
      jest.useFakeTimers({ now: new Date('2026-11-16T03:00:00Z') });
    });

    // Sunday 08:00 in the clinic, Sunday 23:00 in Tokyo
    const sundayMorning = appointmentAt('sunday-morning', '2026-11-15T14:00:00Z');
    // Monday 01:00 in the clinic (tomorrow), Monday 16:00 in Tokyo
    const mondayEarly = appointmentAt('monday-early', '2026-11-16T07:00:00Z');
    // Tuesday 2026-11-10 12:00 in the clinic: same clinic week
    const tuesday = appointmentAt('tuesday', '2026-11-10T18:00:00Z');
    const all = [sundayMorning, mondayEarly, tuesday];

    it("lists the clinic's today, not the browser's", () => {
      const { result } = renderHook(() => useTodayAppointments(all, CLINIC));
      expect(ids(result.current)).toEqual(['sunday-morning']);
    });

    it("counts today and this week in the clinic's calendar", () => {
      const { result } = renderHook(() => useAppointmentStatsFromData(all, CLINIC));
      expect(result.current.today).toBe(1);
      // Clinic week: Monday 2026-11-09 to Sunday 2026-11-15
      expect(result.current.thisWeek).toBe(2);
    });

    it('falls back to Mexico City when no zone is given', () => {
      const { result } = renderHook(() => useTodayAppointments(all));
      expect(ids(result.current)).toEqual(['sunday-morning']);
    });

    it('uses the zone it is given', () => {
      // 23:30 Sunday in Mexico City, but 00:30 Monday in Lima
      const lateSunday = appointmentAt('late-sunday', '2026-11-16T05:30:00Z');
      const { result } = renderHook(() => useTodayAppointments([lateSunday], 'America/Lima'));
      expect(ids(result.current)).toEqual([]);
    });
  });

  describe('on 2026-11-30 21:00 in the clinic (already December in Tokyo)', () => {
    const now = new Date('2026-12-01T03:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers({ now });
    });

    it("counts the clinic's month", () => {
      // 2026-11-20 12:00 in the clinic
      const november = appointmentAt('november', '2026-11-20T18:00:00Z');
      const { result } = renderHook(() => useAppointmentStatsFromData([november], CLINIC));
      expect(result.current.thisMonth).toBe(1);
    });

    it("fetches a range that covers the clinic's whole month", () => {
      const range = getStatsDateRange(now, CLINIC);
      // 2026-11-01 00:00 and 2026-11-30 23:59 in the clinic
      expect(range.start.getTime()).toBeLessThanOrEqual(new Date('2026-11-01T06:00:00Z').getTime());
      expect(range.end.getTime()).toBeGreaterThanOrEqual(new Date('2026-12-01T05:59:00Z').getTime());
    });
  });
});
