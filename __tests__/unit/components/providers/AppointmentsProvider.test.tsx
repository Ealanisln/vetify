/**
 * Unit tests for AppointmentsProvider context
 * Tests provider functionality, context hooks, and state management
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import {
  AppointmentsProvider,
  useAppointmentsContext,
  useIsInAppointmentsProvider,
  useSafeAppointmentsContext,
} from '@/components/providers/AppointmentsProvider';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
} from 'date-fns';

// Mock the hooks used by the provider
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
  useAppointmentStatsFromData: jest.fn(() => ({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    inProgress: 0,
  })),
  useCalendarEvents: jest.fn(() => []),
}));

jest.mock('@/hooks/appointments/useAppointmentMutations', () => ({
  useAppointmentMutations: jest.fn(() => ({
    createAppointment: jest.fn(),
    updateAppointment: jest.fn(),
    deleteAppointment: jest.fn(),
    quickAction: jest.fn(),
    invalidateAll: jest.fn(),
  })),
}));

// Import mocked modules to set up return values
import * as useAppointmentsDataModule from '@/hooks/appointments/useAppointmentsData';
import * as useAppointmentMutationsModule from '@/hooks/appointments/useAppointmentMutations';

const mockedUseAppointmentsData = useAppointmentsDataModule.useAppointmentsData as jest.MockedFunction<
  typeof useAppointmentsDataModule.useAppointmentsData
>;
const mockedUseTodayAppointments = useAppointmentsDataModule.useTodayAppointments as jest.MockedFunction<
  typeof useAppointmentsDataModule.useTodayAppointments
>;
const mockedUseAppointmentStatsFromData = useAppointmentsDataModule.useAppointmentStatsFromData as jest.MockedFunction<
  typeof useAppointmentsDataModule.useAppointmentStatsFromData
>;
const mockedUseCalendarEvents = useAppointmentsDataModule.useCalendarEvents as jest.MockedFunction<
  typeof useAppointmentsDataModule.useCalendarEvents
>;
const mockedUseAppointmentMutations = useAppointmentMutationsModule.useAppointmentMutations as jest.MockedFunction<
  typeof useAppointmentMutationsModule.useAppointmentMutations
>;

// Mock appointment for testing
const mockAppointment = {
  id: 'appt-1',
  dateTime: new Date('2025-12-15T10:00:00Z'),
  duration: 30,
  reason: 'Consulta general',
  status: 'SCHEDULED' as const,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  tenantId: 'tenant-1',
  petId: 'pet-1',
  customerId: 'customer-1',
  staffId: 'staff-1',
  locationId: null,
  pet: {
    id: 'pet-1',
    name: 'Luna',
    species: 'Perro',
    breed: 'Labrador',
    internalId: null,
    microchipNumber: null,
  },
  customer: {
    id: 'customer-1',
    name: 'Juan García',
    email: 'juan@example.com',
    phone: '555-1234',
  },
  staff: {
    id: 'staff-1',
    name: 'Dr. Veterinario',
  },
};

describe('AppointmentsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset default mock implementations
    mockedUseAppointmentsData.mockReturnValue({
      appointments: [],
      isLoading: false,
      isValidating: false,
      error: null,
      refresh: jest.fn().mockResolvedValue(undefined),
      mutate: jest.fn(),
    });

    mockedUseTodayAppointments.mockReturnValue([]);
    mockedUseAppointmentStatsFromData.mockReturnValue({
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      scheduled: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      inProgress: 0,
    });
    mockedUseCalendarEvents.mockReturnValue([]);
    mockedUseAppointmentMutations.mockReturnValue({
      createAppointment: jest.fn(),
      updateAppointment: jest.fn(),
      deleteAppointment: jest.fn(),
      quickAction: jest.fn(),
      invalidateAll: jest.fn(),
    });
  });

  describe('rendering', () => {
    it('should render children', () => {
      render(
        <AppointmentsProvider>
          <div data-testid="child">Child content</div>
        </AppointmentsProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should accept initialView prop', () => {
      const TestComponent = () => {
        const { currentView } = useAppointmentsContext();
        return <div data-testid="view">{currentView}</div>;
      };

      render(
        <AppointmentsProvider initialView="dayGridMonth">
          <TestComponent />
        </AppointmentsProvider>
      );

      expect(screen.getByTestId('view')).toHaveTextContent('dayGridMonth');
    });

    it('should accept initialDate prop', () => {
      const testDate = new Date('2025-06-15T00:00:00Z');

      const TestComponent = () => {
        const { currentDate } = useAppointmentsContext();
        return <div data-testid="date">{currentDate.toISOString()}</div>;
      };

      render(
        <AppointmentsProvider initialDate={testDate}>
          <TestComponent />
        </AppointmentsProvider>
      );

      expect(screen.getByTestId('date')).toHaveTextContent('2025-06-15');
    });

    it('should use default values when props not provided', () => {
      const TestComponent = () => {
        const { currentView } = useAppointmentsContext();
        return <div data-testid="view">{currentView}</div>;
      };

      render(
        <AppointmentsProvider>
          <TestComponent />
        </AppointmentsProvider>
      );

      expect(screen.getByTestId('view')).toHaveTextContent('timeGridWeek');
    });
  });

  describe('context data', () => {
    it('should provide appointments from useAppointmentsData', () => {
      mockedUseAppointmentsData.mockReturnValue({
        appointments: [mockAppointment],
        isLoading: false,
        isValidating: false,
        error: null,
        refresh: jest.fn(),
        mutate: jest.fn(),
      });

      const TestComponent = () => {
        const { appointments } = useAppointmentsContext();
        return <div data-testid="count">{appointments.length}</div>;
      };

      render(
        <AppointmentsProvider>
          <TestComponent />
        </AppointmentsProvider>
      );

      expect(screen.getByTestId('count')).toHaveTextContent('1');
    });

    it('should provide todayAppointments', () => {
      mockedUseTodayAppointments.mockReturnValue([mockAppointment]);

      const TestComponent = () => {
        const { todayAppointments } = useAppointmentsContext();
        return <div data-testid="today-count">{todayAppointments.length}</div>;
      };

      render(
        <AppointmentsProvider>
          <TestComponent />
        </AppointmentsProvider>
      );

      expect(screen.getByTestId('today-count')).toHaveTextContent('1');
    });

    it('should provide stats', () => {
      mockedUseAppointmentStatsFromData.mockReturnValue({
        today: 5,
        thisWeek: 20,
        thisMonth: 80,
        scheduled: 10,
        confirmed: 5,
        completed: 3,
        cancelled: 1,
        noShow: 1,
        inProgress: 0,
      });

      const TestComponent = () => {
        const { stats } = useAppointmentsContext();
        return (
          <>
            <div data-testid="today">{stats.today}</div>
            <div data-testid="week">{stats.thisWeek}</div>
            <div data-testid="month">{stats.thisMonth}</div>
          </>
        );
      };

      render(
        <AppointmentsProvider>
          <TestComponent />
        </AppointmentsProvider>
      );

      expect(screen.getByTestId('today')).toHaveTextContent('5');
      expect(screen.getByTestId('week')).toHaveTextContent('20');
      expect(screen.getByTestId('month')).toHaveTextContent('80');
    });

    it('should provide calendarEvents', () => {
      const mockEvent = {
        id: 'appt-1',
        title: 'Luna - Consulta',
        start: '2025-12-15T10:00:00Z',
        end: '2025-12-15T10:30:00Z',
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        textColor: '#FFFFFF',
        extendedProps: {
          appointment: mockAppointment,
          customerPhone: '555-1234',
          priority: 'medium' as const,
          canEdit: true,
          canCancel: true,
        },
      };
      mockedUseCalendarEvents.mockReturnValue([mockEvent]);

      const TestComponent = () => {
        const { calendarEvents } = useAppointmentsContext();
        return <div data-testid="events">{calendarEvents.length}</div>;
      };

      render(
        <AppointmentsProvider>
          <TestComponent />
        </AppointmentsProvider>
      );

      expect(screen.getByTestId('events')).toHaveTextContent('1');
    });

    it('should provide loading states', () => {
      mockedUseAppointmentsData.mockReturnValue({
        appointments: [],
        isLoading: true,
        isValidating: true,
        error: null,
        refresh: jest.fn(),
        mutate: jest.fn(),
      });

      const TestComponent = () => {
        const { isLoading, isValidating } = useAppointmentsContext();
        return (
          <>
            <div data-testid="loading">{isLoading.toString()}</div>
            <div data-testid="validating">{isValidating.toString()}</div>
          </>
        );
      };

      render(
        <AppointmentsProvider>
          <TestComponent />
        </AppointmentsProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('true');
      expect(screen.getByTestId('validating')).toHaveTextContent('true');
    });

    it('should provide error state', () => {
      const error = new Error('Failed to fetch');
      mockedUseAppointmentsData.mockReturnValue({
        appointments: [],
        isLoading: false,
        isValidating: false,
        error,
        refresh: jest.fn(),
        mutate: jest.fn(),
      });

      const TestComponent = () => {
        const { error } = useAppointmentsContext();
        return <div data-testid="error">{error?.message ?? 'no error'}</div>;
      };

      render(
        <AppointmentsProvider>
          <TestComponent />
        </AppointmentsProvider>
      );

      expect(screen.getByTestId('error')).toHaveTextContent('Failed to fetch');
    });
  });

  describe('date range calculation', () => {
    it('should calculate month view date range with buffer', () => {
      const testDate = new Date('2025-06-15');

      render(
        <AppointmentsProvider initialView="dayGridMonth" initialDate={testDate}>
          <div>Test</div>
        </AppointmentsProvider>
      );

      // Verify useAppointmentsData was called with extended date range
      expect(mockedUseAppointmentsData).toHaveBeenCalled();
      const callArgs = mockedUseAppointmentsData.mock.calls[0][0];

      // Should include previous and next month for calendar navigation
      expect(callArgs.startDate).toEqual(startOfMonth(subMonths(testDate, 1)));
      expect(callArgs.endDate).toEqual(endOfMonth(addMonths(testDate, 1)));
    });

    it('should calculate week view date range', () => {
      const testDate = new Date('2025-06-15'); // A Sunday

      render(
        <AppointmentsProvider initialView="timeGridWeek" initialDate={testDate}>
          <div>Test</div>
        </AppointmentsProvider>
      );

      expect(mockedUseAppointmentsData).toHaveBeenCalled();
      const callArgs = mockedUseAppointmentsData.mock.calls[0][0];

      expect(callArgs.startDate).toEqual(startOfWeek(testDate, { weekStartsOn: 1 }));
      expect(callArgs.endDate).toEqual(endOfWeek(testDate, { weekStartsOn: 1 }));
    });
  });

  describe('mutations', () => {
    it('should provide createAppointment function', async () => {
      const mockCreate = jest.fn().mockResolvedValue(mockAppointment);
      mockedUseAppointmentMutations.mockReturnValue({
        createAppointment: mockCreate,
        updateAppointment: jest.fn(),
        deleteAppointment: jest.fn(),
        quickAction: jest.fn(),
        invalidateAll: jest.fn(),
      });

      const TestComponent = () => {
        const { createAppointment } = useAppointmentsContext();
        return (
          <button
            data-testid="create-btn"
            onClick={() => createAppointment({} as Parameters<typeof createAppointment>[0])}
          >
            Create
          </button>
        );
      };

      render(
        <AppointmentsProvider>
          <TestComponent />
        </AppointmentsProvider>
      );

      await act(async () => {
        screen.getByTestId('create-btn').click();
      });

      expect(mockCreate).toHaveBeenCalled();
    });

    it('should provide quickAction function', async () => {
      const mockQuickAction = jest.fn().mockResolvedValue(mockAppointment);
      mockedUseAppointmentMutations.mockReturnValue({
        createAppointment: jest.fn(),
        updateAppointment: jest.fn(),
        deleteAppointment: jest.fn(),
        quickAction: mockQuickAction,
        invalidateAll: jest.fn(),
      });

      const TestComponent = () => {
        const { quickAction } = useAppointmentsContext();
        return (
          <button
            data-testid="action-btn"
            onClick={() => quickAction('appt-1', 'confirm')}
          >
            Confirm
          </button>
        );
      };

      render(
        <AppointmentsProvider>
          <TestComponent />
        </AppointmentsProvider>
      );

      await act(async () => {
        screen.getByTestId('action-btn').click();
      });

      expect(mockQuickAction).toHaveBeenCalledWith('appt-1', 'confirm');
    });
  });

  describe('view state management', () => {
    it('should update currentView when setCurrentView is called', async () => {
      const TestComponent = () => {
        const { currentView, setCurrentView } = useAppointmentsContext();
        return (
          <>
            <div data-testid="view">{currentView}</div>
            <button
              data-testid="change-view"
              onClick={() => setCurrentView('dayGridMonth')}
            >
              Change View
            </button>
          </>
        );
      };

      render(
        <AppointmentsProvider initialView="timeGridWeek">
          <TestComponent />
        </AppointmentsProvider>
      );

      expect(screen.getByTestId('view')).toHaveTextContent('timeGridWeek');

      await act(async () => {
        screen.getByTestId('change-view').click();
      });

      expect(screen.getByTestId('view')).toHaveTextContent('dayGridMonth');
    });

    it('should update currentDate when setCurrentDate is called', async () => {
      // Use explicit local dates to avoid timezone issues
      const initialDate = new Date(2025, 5, 15); // June 15 (month is 0-indexed)
      const newDate = new Date(2025, 7, 1); // August 1

      const TestComponent = () => {
        const { currentDate, setCurrentDate } = useAppointmentsContext();
        return (
          <>
            <div data-testid="date">{currentDate.getMonth()}</div>
            <button
              data-testid="change-date"
              onClick={() => setCurrentDate(newDate)}
            >
              Change Date
            </button>
          </>
        );
      };

      render(
        <AppointmentsProvider initialDate={initialDate}>
          <TestComponent />
        </AppointmentsProvider>
      );

      expect(screen.getByTestId('date')).toHaveTextContent('5'); // June (0-indexed)

      await act(async () => {
        screen.getByTestId('change-date').click();
      });

      expect(screen.getByTestId('date')).toHaveTextContent('7'); // August (0-indexed)
    });
  });

  describe('refresh functionality', () => {
    it('should provide refresh function', async () => {
      const mockRefresh = jest.fn().mockResolvedValue(undefined);
      mockedUseAppointmentsData.mockReturnValue({
        appointments: [],
        isLoading: false,
        isValidating: false,
        error: null,
        refresh: mockRefresh,
        mutate: jest.fn(),
      });

      const TestComponent = () => {
        const { refresh } = useAppointmentsContext();
        return (
          <button data-testid="refresh-btn" onClick={() => refresh()}>
            Refresh
          </button>
        );
      };

      render(
        <AppointmentsProvider>
          <TestComponent />
        </AppointmentsProvider>
      );

      await act(async () => {
        screen.getByTestId('refresh-btn').click();
      });

      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});

describe('useAppointmentsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAppointmentsData.mockReturnValue({
      appointments: [],
      isLoading: false,
      isValidating: false,
      error: null,
      refresh: jest.fn(),
      mutate: jest.fn(),
    });
    mockedUseTodayAppointments.mockReturnValue([]);
    mockedUseAppointmentStatsFromData.mockReturnValue({
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      scheduled: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      inProgress: 0,
    });
    mockedUseCalendarEvents.mockReturnValue([]);
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAppointmentsContext());
    }).toThrow('useAppointmentsContext must be used within an AppointmentsProvider');

    consoleSpy.mockRestore();
  });

  it('should return context value when inside provider', () => {
    const { result } = renderHook(() => useAppointmentsContext(), {
      wrapper: ({ children }) => (
        <AppointmentsProvider>{children}</AppointmentsProvider>
      ),
    });

    expect(result.current).toHaveProperty('appointments');
    expect(result.current).toHaveProperty('stats');
    expect(result.current).toHaveProperty('quickAction');
    expect(result.current).toHaveProperty('createAppointment');
  });
});

describe('useIsInAppointmentsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAppointmentsData.mockReturnValue({
      appointments: [],
      isLoading: false,
      isValidating: false,
      error: null,
      refresh: jest.fn(),
      mutate: jest.fn(),
    });
  });

  it('should return false when outside provider', () => {
    const { result } = renderHook(() => useIsInAppointmentsProvider());
    expect(result.current).toBe(false);
  });

  it('should return true when inside provider', () => {
    const { result } = renderHook(() => useIsInAppointmentsProvider(), {
      wrapper: ({ children }) => (
        <AppointmentsProvider>{children}</AppointmentsProvider>
      ),
    });

    expect(result.current).toBe(true);
  });
});

describe('useSafeAppointmentsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAppointmentsData.mockReturnValue({
      appointments: [],
      isLoading: false,
      isValidating: false,
      error: null,
      refresh: jest.fn(),
      mutate: jest.fn(),
    });
  });

  it('should return null when outside provider', () => {
    const { result } = renderHook(() => useSafeAppointmentsContext());
    expect(result.current).toBeNull();
  });

  it('should return context value when inside provider', () => {
    const { result } = renderHook(() => useSafeAppointmentsContext(), {
      wrapper: ({ children }) => (
        <AppointmentsProvider>{children}</AppointmentsProvider>
      ),
    });

    expect(result.current).not.toBeNull();
    expect(result.current).toHaveProperty('appointments');
  });

  it('should not throw when outside provider', () => {
    expect(() => {
      renderHook(() => useSafeAppointmentsContext());
    }).not.toThrow();
  });
});

describe('SWR configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAppointmentsData.mockReturnValue({
      appointments: [],
      isLoading: false,
      isValidating: false,
      error: null,
      refresh: jest.fn(),
      mutate: jest.fn(),
    });
  });

  it('should pass correct options to useAppointmentsData', () => {
    render(
      <AppointmentsProvider>
        <div>Test</div>
      </AppointmentsProvider>
    );

    expect(mockedUseAppointmentsData).toHaveBeenCalledWith(
      expect.objectContaining({
        revalidateOnFocus: false,
        keepPreviousData: true,
      })
    );
  });
});
