/**
 * @jest-environment jsdom
 */

/**
 * Unit tests for useAppointmentsData SWR hook
 * Tests data fetching, caching, and derived data hooks
 */

import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import React from 'react';
import {
  useAppointmentsData,
  useTodayAppointments,
  useAppointmentStatsFromData,
  useCalendarEvents,
} from '@/hooks/appointments/useAppointmentsData';
import { AppointmentWithDetails } from '@/lib/appointments/fetchers';
import {
  addDays,
  subDays,
  startOfWeek,
  startOfMonth,
} from 'date-fns';

// Helper to create mock appointment
const createMockAppointment = (
  overrides: Partial<AppointmentWithDetails & { dateTime: Date }> = {}
): AppointmentWithDetails => ({
  id: 'appt-1',
  dateTime: new Date('2025-12-15T14:00:00Z'),
  duration: 30,
  reason: 'Checkup',
  notes: 'Regular visit',
  status: 'SCHEDULED',
  createdAt: new Date('2025-12-01T10:00:00Z'),
  updatedAt: new Date('2025-12-01T10:00:00Z'),
  customer: {
    id: 'cust-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
  },
  pet: {
    id: 'pet-1',
    name: 'Fluffy',
    species: 'cat',
    breed: 'Maine Coon',
  },
  staff: {
    id: 'staff-1',
    name: 'Dr. Smith',
    position: 'Veterinarian',
  },
  ...overrides,
});

// SWR wrapper to clear cache between tests
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
);

describe('useAppointmentsData', () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe('Initial State & Fetching', () => {
    it('should initialize with empty appointments array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const { result } = renderHook(() => useAppointmentsData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.appointments).toEqual([]);
    });

    it('should fetch appointments on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      renderHook(() => useAppointmentsData(), { wrapper });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/appointments')
        );
      });
    });

    it('should fetch with date filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const startDate = new Date('2025-12-01');
      const endDate = new Date('2025-12-31');

      renderHook(
        () => useAppointmentsData({ startDate, endDate }),
        { wrapper }
      );

      await waitFor(() => {
        const url = mockFetch.mock.calls[0][0];
        expect(url).toContain('start_date');
        expect(url).toContain('end_date');
      });
    });

    it('should not fetch when enabled is false', async () => {
      renderHook(() => useAppointmentsData({ enabled: false }), { wrapper });

      // Wait a tick to ensure no fetch is triggered
      await new Promise((r) => setTimeout(r, 100));

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Return Value', () => {
    it('should return all expected properties', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const { result } = renderHook(() => useAppointmentsData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('appointments');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isValidating');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refresh');
      expect(result.current).toHaveProperty('mutate');
    });

    it('should return appointments from API', async () => {
      const mockAppointment = {
        ...createMockAppointment(),
        dateTime: '2025-12-15T14:00:00Z',
        createdAt: '2025-12-01T10:00:00Z',
        updatedAt: '2025-12-01T10:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockAppointment] }),
      });

      const { result } = renderHook(() => useAppointmentsData(), { wrapper });

      await waitFor(() => {
        expect(result.current.appointments).toHaveLength(1);
      });

      expect(result.current.appointments[0].id).toBe('appt-1');
    });
  });

  describe('Error Handling', () => {
    it('should set error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useAppointmentsData(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error?.message).toBe('Server error');
    });

    it('should return empty appointments on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAppointmentsData(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.appointments).toEqual([]);
    });
  });

  describe('Refresh', () => {
    it('should provide refresh function', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const { result } = renderHook(() => useAppointmentsData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refresh).toBe('function');
    });
  });
});

describe('useTodayAppointments', () => {
  it('should return empty array when no appointments', () => {
    const { result } = renderHook(() => useTodayAppointments([]));

    expect(result.current).toEqual([]);
  });

  it('should filter appointments to today only', () => {
    const now = new Date();
    const todayMorning = new Date(now);
    todayMorning.setHours(9, 0, 0, 0);

    const todayAfternoon = new Date(now);
    todayAfternoon.setHours(14, 0, 0, 0);

    const yesterday = subDays(now, 1);
    const tomorrow = addDays(now, 1);

    const appointments = [
      createMockAppointment({ id: 'today-1', dateTime: todayMorning }),
      createMockAppointment({ id: 'today-2', dateTime: todayAfternoon }),
      createMockAppointment({ id: 'yesterday', dateTime: yesterday }),
      createMockAppointment({ id: 'tomorrow', dateTime: tomorrow }),
    ];

    const { result } = renderHook(() => useTodayAppointments(appointments));

    expect(result.current).toHaveLength(2);
    expect(result.current.map((a) => a.id)).toContain('today-1');
    expect(result.current.map((a) => a.id)).toContain('today-2');
  });

  it('should exclude appointments from yesterday', () => {
    const yesterday = subDays(new Date(), 1);
    const appointments = [
      createMockAppointment({ id: 'yesterday', dateTime: yesterday }),
    ];

    const { result } = renderHook(() => useTodayAppointments(appointments));

    expect(result.current).toHaveLength(0);
  });

  it('should exclude appointments from tomorrow', () => {
    const tomorrow = addDays(new Date(), 1);
    const appointments = [
      createMockAppointment({ id: 'tomorrow', dateTime: tomorrow }),
    ];

    const { result } = renderHook(() => useTodayAppointments(appointments));

    expect(result.current).toHaveLength(0);
  });

  it('should memoize result', () => {
    const now = new Date();
    const todayMorning = new Date(now);
    todayMorning.setHours(10, 0, 0, 0);

    const appointments = [
      createMockAppointment({ id: 'today', dateTime: todayMorning }),
    ];

    const { result, rerender } = renderHook(
      ({ appts }) => useTodayAppointments(appts),
      { initialProps: { appts: appointments } }
    );

    const firstResult = result.current;

    // Rerender with same appointments reference
    rerender({ appts: appointments });

    expect(result.current).toBe(firstResult);
  });
});

describe('useAppointmentStatsFromData', () => {
  it('should return zeros when no appointments', () => {
    const { result } = renderHook(() => useAppointmentStatsFromData([]));

    expect(result.current).toEqual({
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      completionRate: 0,
    });
  });

  it('should count today appointments', () => {
    const now = new Date();
    const todayMorning = new Date(now);
    todayMorning.setHours(10, 0, 0, 0);

    const todayAfternoon = new Date(now);
    todayAfternoon.setHours(15, 0, 0, 0);

    const appointments = [
      createMockAppointment({ id: '1', dateTime: todayMorning }),
      createMockAppointment({ id: '2', dateTime: todayAfternoon }),
    ];

    const { result } = renderHook(() => useAppointmentStatsFromData(appointments));

    expect(result.current.today).toBe(2);
  });

  it('should count this week appointments', () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Create appointment 1 day after week start
    const thisWeekDate = addDays(weekStart, 1);
    thisWeekDate.setHours(10, 0, 0, 0);

    // Create appointment before this week
    const lastWeekDate = subDays(weekStart, 1);

    const appointments = [
      createMockAppointment({ id: 'this-week', dateTime: thisWeekDate }),
      createMockAppointment({ id: 'last-week', dateTime: lastWeekDate }),
    ];

    const { result } = renderHook(() => useAppointmentStatsFromData(appointments));

    expect(result.current.thisWeek).toBe(1);
  });

  it('should count this month appointments', () => {
    const now = new Date();
    const monthStart = startOfMonth(now);

    // Create appointment in middle of month
    const thisMonthDate = addDays(monthStart, 10);
    thisMonthDate.setHours(10, 0, 0, 0);

    // Create appointment before this month
    const lastMonthDate = subDays(monthStart, 5);

    const appointments = [
      createMockAppointment({ id: 'this-month', dateTime: thisMonthDate }),
      createMockAppointment({ id: 'last-month', dateTime: lastMonthDate }),
    ];

    const { result } = renderHook(() => useAppointmentStatsFromData(appointments));

    expect(result.current.thisMonth).toBe(1);
  });

  it('should calculate completion rate correctly', () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const thisMonthDate = addDays(monthStart, 5);
    thisMonthDate.setHours(10, 0, 0, 0);

    const appointments = [
      createMockAppointment({ id: '1', dateTime: thisMonthDate, status: 'COMPLETED' }),
      createMockAppointment({ id: '2', dateTime: thisMonthDate, status: 'COMPLETED' }),
      createMockAppointment({ id: '3', dateTime: thisMonthDate, status: 'SCHEDULED' }),
      createMockAppointment({ id: '4', dateTime: thisMonthDate, status: 'CANCELLED_CLINIC' }),
    ];

    const { result } = renderHook(() => useAppointmentStatsFromData(appointments));

    // 2 completed out of 4 = 50%
    expect(result.current.completionRate).toBe(50);
  });

  it('should return 0 completion rate when no month appointments', () => {
    const lastMonth = subDays(startOfMonth(new Date()), 5);

    const appointments = [
      createMockAppointment({ id: '1', dateTime: lastMonth, status: 'COMPLETED' }),
    ];

    const { result } = renderHook(() => useAppointmentStatsFromData(appointments));

    expect(result.current.completionRate).toBe(0);
  });
});

describe('useCalendarEvents', () => {
  it('should return empty array when no appointments', () => {
    const { result } = renderHook(() => useCalendarEvents([]));

    expect(result.current).toEqual([]);
  });

  it('should transform appointments to calendar events', () => {
    const appointments = [
      createMockAppointment({
        id: 'appt-1',
        dateTime: new Date('2025-12-15T14:00:00'),
        duration: 30,
      }),
    ];

    const { result } = renderHook(() => useCalendarEvents(appointments));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toHaveProperty('id', 'appt-1');
    expect(result.current[0]).toHaveProperty('title');
    expect(result.current[0]).toHaveProperty('start');
    expect(result.current[0]).toHaveProperty('end');
  });

  it('should create title from pet and customer names', () => {
    const appointments = [
      createMockAppointment({
        customer: { id: 'c1', name: 'Jane Doe' },
        pet: { id: 'p1', name: 'Max', species: 'dog' },
      }),
    ];

    const { result } = renderHook(() => useCalendarEvents(appointments));

    expect(result.current[0].title).toBe('Max - Jane Doe');
  });

  it('should calculate end time from duration', () => {
    const startTime = new Date('2025-12-15T14:00:00');
    const appointments = [
      createMockAppointment({
        dateTime: startTime,
        duration: 45, // 45 minutes
      }),
    ];

    const { result } = renderHook(() => useCalendarEvents(appointments));

    // End should be 45 minutes after start
    expect(result.current[0].start).toContain('14:00');
    expect(result.current[0].end).toContain('14:45');
  });

  it('should set colors based on status', () => {
    const appointments = [
      createMockAppointment({ id: '1', status: 'SCHEDULED' }),
      createMockAppointment({ id: '2', status: 'CONFIRMED' }),
      createMockAppointment({ id: '3', status: 'COMPLETED' }),
    ];

    const { result } = renderHook(() => useCalendarEvents(appointments));

    // Each status should have different colors
    const colors = result.current.map((e) => e.backgroundColor);
    expect(new Set(colors).size).toBe(3);
  });

  it('should include extended props', () => {
    const appointment = createMockAppointment({
      customer: { id: 'c1', name: 'Jane', phone: '555-1234' },
    });

    const { result } = renderHook(() => useCalendarEvents([appointment]));

    expect(result.current[0].extendedProps).toHaveProperty('appointment');
    expect(result.current[0].extendedProps).toHaveProperty('customerPhone', '555-1234');
    expect(result.current[0].extendedProps).toHaveProperty('priority');
    expect(result.current[0].extendedProps).toHaveProperty('canEdit');
    expect(result.current[0].extendedProps).toHaveProperty('canCancel');
  });

  describe('canEdit flag', () => {
    it('should allow edit for SCHEDULED', () => {
      const appointments = [createMockAppointment({ status: 'SCHEDULED' })];
      const { result } = renderHook(() => useCalendarEvents(appointments));
      expect(result.current[0].extendedProps.canEdit).toBe(true);
    });

    it('should allow edit for CONFIRMED', () => {
      const appointments = [createMockAppointment({ status: 'CONFIRMED' })];
      const { result } = renderHook(() => useCalendarEvents(appointments));
      expect(result.current[0].extendedProps.canEdit).toBe(true);
    });

    it('should not allow edit for COMPLETED', () => {
      const appointments = [createMockAppointment({ status: 'COMPLETED' })];
      const { result } = renderHook(() => useCalendarEvents(appointments));
      expect(result.current[0].extendedProps.canEdit).toBe(false);
    });

    it('should not allow edit for CANCELLED_CLINIC', () => {
      const appointments = [createMockAppointment({ status: 'CANCELLED_CLINIC' })];
      const { result } = renderHook(() => useCalendarEvents(appointments));
      expect(result.current[0].extendedProps.canEdit).toBe(false);
    });
  });

  describe('canCancel flag', () => {
    it('should allow cancel for SCHEDULED', () => {
      const appointments = [createMockAppointment({ status: 'SCHEDULED' })];
      const { result } = renderHook(() => useCalendarEvents(appointments));
      expect(result.current[0].extendedProps.canCancel).toBe(true);
    });

    it('should not allow cancel for COMPLETED', () => {
      const appointments = [createMockAppointment({ status: 'COMPLETED' })];
      const { result } = renderHook(() => useCalendarEvents(appointments));
      expect(result.current[0].extendedProps.canCancel).toBe(false);
    });

    it('should not allow cancel for CANCELLED_CLIENT', () => {
      const appointments = [createMockAppointment({ status: 'CANCELLED_CLIENT' })];
      const { result } = renderHook(() => useCalendarEvents(appointments));
      expect(result.current[0].extendedProps.canCancel).toBe(false);
    });

    it('should not allow cancel for NO_SHOW', () => {
      const appointments = [createMockAppointment({ status: 'NO_SHOW' })];
      const { result } = renderHook(() => useCalendarEvents(appointments));
      expect(result.current[0].extendedProps.canCancel).toBe(false);
    });
  });

  describe('priority detection', () => {
    it('should detect emergency priority', () => {
      const appointments = [createMockAppointment({ reason: 'Emergencia - accidente' })];
      const { result } = renderHook(() => useCalendarEvents(appointments));
      expect(result.current[0].extendedProps.priority).toBe('emergency');
    });

    it('should detect high priority', () => {
      const appointments = [createMockAppointment({ reason: 'Cirugia programada' })];
      const { result } = renderHook(() => useCalendarEvents(appointments));
      expect(result.current[0].extendedProps.priority).toBe('high');
    });

    it('should detect low priority', () => {
      const appointments = [createMockAppointment({ reason: 'Vacuna anual' })];
      const { result } = renderHook(() => useCalendarEvents(appointments));
      expect(result.current[0].extendedProps.priority).toBe('low');
    });

    it('should default to medium priority', () => {
      const appointments = [createMockAppointment({ reason: 'Consulta general' })];
      const { result } = renderHook(() => useCalendarEvents(appointments));
      expect(result.current[0].extendedProps.priority).toBe('medium');
    });
  });
});
