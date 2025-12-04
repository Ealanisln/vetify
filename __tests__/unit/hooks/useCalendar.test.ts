/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useCalendar,
  useAvailability,
  useCalendarConfig,
  CalendarView,
} from '@/hooks/useCalendar';
import { AppointmentWithDetails } from '@/hooks/useAppointments';

// Helper to create mock appointment
const createMockAppointment = (
  overrides: Partial<AppointmentWithDetails & { dateTime: string; createdAt: string; updatedAt: string }> = {}
) => ({
  id: 'appt-1',
  dateTime: '2025-12-15T14:00:00.000Z',
  duration: 30,
  reason: 'Checkup',
  notes: 'Regular visit',
  status: 'SCHEDULED' as const,
  createdAt: '2025-12-01T10:00:00.000Z',
  updatedAt: '2025-12-01T10:00:00.000Z',
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

describe('useCalendar', () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe('Initial State', () => {
    it('should initialize with today date', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useCalendar());

      const today = new Date();
      expect(result.current.currentDate.toDateString()).toBe(today.toDateString());
    });

    it('should initialize with default view (timeGridWeek)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useCalendar());

      expect(result.current.currentView).toBe('timeGridWeek');
    });

    it('should accept custom initial view', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useCalendar('dayGridMonth'));

      expect(result.current.currentView).toBe('dayGridMonth');
    });

    it('should initialize with empty events array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events).toEqual([]);
    });

    it('should initialize with error as null', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Date Range Calculations', () => {
    it('should calculate month view range correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      renderHook(() => useCalendar('dayGridMonth'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const fetchUrl = mockFetch.mock.calls[0][0];
      // Should contain start_date and end_date params
      expect(fetchUrl).toContain('start_date=');
      expect(fetchUrl).toContain('end_date=');
    });

    it('should calculate week view range correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      renderHook(() => useCalendar('timeGridWeek'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain('start_date=');
      expect(fetchUrl).toContain('end_date=');
    });

    it('should calculate day view range correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      renderHook(() => useCalendar('timeGridDay'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain('start_date=');
      expect(fetchUrl).toContain('end_date=');
    });
  });

  describe('State Management', () => {
    it('should update currentDate with setCurrentDate', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newDate = new Date('2025-06-15');

      act(() => {
        result.current.setCurrentDate(newDate);
      });

      expect(result.current.currentDate.toDateString()).toBe(newDate.toDateString());
    });

    it('should update currentView with setCurrentView', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCurrentView('dayGridMonth');
      });

      expect(result.current.currentView).toBe('dayGridMonth');
    });
  });

  describe('fetchEvents()', () => {
    it('should set loading=true during fetch', async () => {
      let resolvePromise: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useCalendar());

      // Should be loading initially
      expect(result.current.loading).toBe(true);

      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should convert appointments to CalendarEvent[]', async () => {
      const mockAppointment = createMockAppointment();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockAppointment] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0]).toHaveProperty('id');
      expect(result.current.events[0]).toHaveProperty('title');
      expect(result.current.events[0]).toHaveProperty('start');
      expect(result.current.events[0]).toHaveProperty('end');
      expect(result.current.events[0]).toHaveProperty('backgroundColor');
      expect(result.current.events[0]).toHaveProperty('borderColor');
      expect(result.current.events[0]).toHaveProperty('textColor');
      expect(result.current.events[0]).toHaveProperty('extendedProps');
    });

    it('should set error on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Server error');
    });

    it('should allow custom start/end params to override calculated range', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const customStart = new Date('2025-01-01');
      const customEnd = new Date('2025-01-31');

      await act(async () => {
        await result.current.fetchEvents(customStart, customEnd);
      });

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0];
      expect(lastCall).toContain('start_date=2025-01-01');
      expect(lastCall).toContain('end_date=2025-01-31');
    });
  });

  describe('Event Conversion', () => {
    it('should format title as pet.name - customer.name', async () => {
      const mockAppointment = createMockAppointment({
        pet: { id: 'pet-1', name: 'Max', species: 'dog' },
        customer: { id: 'cust-1', name: 'Jane Smith' },
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockAppointment] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events[0].title).toBe('Max - Jane Smith');
    });

    it('should calculate end time from duration', async () => {
      const mockAppointment = createMockAppointment({
        dateTime: '2025-12-15T14:00:00.000Z',
        duration: 45, // 45 minutes
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockAppointment] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const event = result.current.events[0];
      const startTime = new Date(event.start);
      const endTime = new Date(event.end);
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMinutes = durationMs / (1000 * 60);

      expect(durationMinutes).toBe(45);
    });

    it('should output ISO strings for start/end', async () => {
      const mockAppointment = createMockAppointment();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockAppointment] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const event = result.current.events[0];
      // ISO strings have the format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(event.start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(event.end).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should set canEdit=true for SCHEDULED status', async () => {
      const mockAppointment = createMockAppointment({ status: 'SCHEDULED' as const });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockAppointment] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events[0].extendedProps.canEdit).toBe(true);
    });

    it('should set canEdit=true for CONFIRMED status', async () => {
      const mockAppointment = createMockAppointment({ status: 'CONFIRMED' as const });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockAppointment] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events[0].extendedProps.canEdit).toBe(true);
    });

    it('should set canEdit=false for IN_PROGRESS status', async () => {
      const mockAppointment = createMockAppointment({ status: 'IN_PROGRESS' as const });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockAppointment] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events[0].extendedProps.canEdit).toBe(false);
    });

    it('should set canCancel=false for COMPLETED status', async () => {
      const mockAppointment = createMockAppointment({ status: 'COMPLETED' as const });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockAppointment] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events[0].extendedProps.canCancel).toBe(false);
    });

    it('should set canCancel=false for CANCELLED_CLIENT status', async () => {
      const mockAppointment = createMockAppointment({ status: 'CANCELLED_CLIENT' as const });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockAppointment] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events[0].extendedProps.canCancel).toBe(false);
    });

    it('should set canCancel=true for SCHEDULED status', async () => {
      const mockAppointment = createMockAppointment({ status: 'SCHEDULED' as const });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockAppointment] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events[0].extendedProps.canCancel).toBe(true);
    });

    it('should populate extendedProps with appointment data', async () => {
      const mockAppointment = createMockAppointment({
        customer: { id: 'cust-1', name: 'Test', phone: '555-1234' },
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockAppointment] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const extendedProps = result.current.events[0].extendedProps;
      expect(extendedProps).toHaveProperty('appointment');
      expect(extendedProps).toHaveProperty('customerPhone');
      expect(extendedProps).toHaveProperty('priority');
      expect(extendedProps).toHaveProperty('canEdit');
      expect(extendedProps).toHaveProperty('canCancel');
      expect(extendedProps.customerPhone).toBe('555-1234');
    });
  });

  describe('Status Color Coding', () => {
    const testStatusColor = async (status: string, expectedBg: string) => {
      const mockAppointment = createMockAppointment({ status: status as AppointmentWithDetails['status'] });
      const mockFetchLocal = jest.spyOn(global, 'fetch');
      mockFetchLocal.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockAppointment] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events[0].backgroundColor).toBe(expectedBg);
      mockFetchLocal.mockRestore();
    };

    it('should apply light blue for SCHEDULED', async () => {
      await testStatusColor('SCHEDULED', '#dbeafe');
    });

    it('should apply light green for CONFIRMED', async () => {
      await testStatusColor('CONFIRMED', '#dcfce7');
    });

    it('should apply light amber for CHECKED_IN', async () => {
      await testStatusColor('CHECKED_IN', '#fef3c7');
    });

    it('should apply light purple for IN_PROGRESS', async () => {
      await testStatusColor('IN_PROGRESS', '#f3e8ff');
    });

    it('should apply light teal for COMPLETED', async () => {
      await testStatusColor('COMPLETED', '#ccfbf1');
    });

    it('should apply light red for CANCELLED_CLIENT', async () => {
      await testStatusColor('CANCELLED_CLIENT', '#fee2e2');
    });

    it('should apply light red for CANCELLED_CLINIC', async () => {
      await testStatusColor('CANCELLED_CLINIC', '#fee2e2');
    });

    it('should apply light gray for NO_SHOW', async () => {
      await testStatusColor('NO_SHOW', '#e5e7eb');
    });

    it('should return colors object with bg, border, and text properties', async () => {
      const mockAppointment = createMockAppointment();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockAppointment] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events[0]).toHaveProperty('backgroundColor');
      expect(result.current.events[0]).toHaveProperty('borderColor');
      expect(result.current.events[0]).toHaveProperty('textColor');
    });
  });

  describe('Priority Detection', () => {
    const testPriority = async (reason: string, expectedPriority: string) => {
      const mockAppointment = createMockAppointment({ reason });
      const mockFetchLocal = jest.spyOn(global, 'fetch');
      mockFetchLocal.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockAppointment] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events[0].extendedProps.priority).toBe(expectedPriority);
      mockFetchLocal.mockRestore();
    };

    it('should detect emergency for emergencia keyword', async () => {
      await testPriority('Emergencia médica', 'emergency');
    });

    it('should detect emergency for urgente keyword', async () => {
      await testPriority('Caso urgente', 'emergency');
    });

    it('should detect emergency for accidente keyword', async () => {
      await testPriority('Accidente vehicular', 'emergency');
    });

    it('should detect emergency for grave keyword', async () => {
      await testPriority('Condición grave', 'emergency');
    });

    it('should detect high priority for cirugía keyword', async () => {
      await testPriority('Cirugía programada', 'high');
    });

    it('should detect high priority for operación keyword', async () => {
      await testPriority('Operación dental', 'high');
    });

    it('should detect high priority for consulta especial', async () => {
      await testPriority('Consulta especial cardíaca', 'high');
    });

    it('should detect low priority for vacuna keyword', async () => {
      await testPriority('Vacuna anual', 'low');
    });

    it('should detect low priority for revisión keyword', async () => {
      await testPriority('Revisión general', 'low');
    });

    it('should detect low priority for control keyword', async () => {
      await testPriority('Control de peso', 'low');
    });

    it('should detect low priority for baño keyword', async () => {
      await testPriority('Baño y corte', 'low');
    });

    it('should default to medium for unmatched reasons', async () => {
      await testPriority('Consulta general', 'medium');
    });

    it('should be case-insensitive', async () => {
      await testPriority('EMERGENCIA', 'emergency');
    });
  });

  describe('refresh()', () => {
    it('should re-fetch events', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const callCountBefore = mockFetch.mock.calls.length;

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockFetch.mock.calls.length).toBeGreaterThan(callCountBefore);
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected properties and methods', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('events');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('currentDate');
      expect(result.current).toHaveProperty('currentView');
      expect(typeof result.current.setCurrentDate).toBe('function');
      expect(typeof result.current.setCurrentView).toBe('function');
      expect(typeof result.current.fetchEvents).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
    });
  });
});

describe('useAvailability', () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe('Initial State', () => {
    it('should initialize with availability as null', () => {
      const { result } = renderHook(() => useAvailability());

      expect(result.current.availability).toBeNull();
    });

    it('should initialize with loading as false', () => {
      const { result } = renderHook(() => useAvailability());

      expect(result.current.loading).toBe(false);
    });

    it('should initialize with error as null', () => {
      const { result } = renderHook(() => useAvailability());

      expect(result.current.error).toBeNull();
    });
  });

  describe('checkAvailability()', () => {
    it('should send GET request with correct params', async () => {
      const mockAvailability = {
        date: '2025-12-15',
        duration: 30,
        availableSlots: [],
        totalSlots: 20,
        availableCount: 15,
        occupiedCount: 5,
        businessHours: {
          start: 8,
          end: 18,
          lunchStart: 13,
          lunchEnd: 14,
          slotDuration: 30,
          workingDays: [1, 2, 3, 4, 5, 6],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockAvailability }),
      });

      const { result } = renderHook(() => useAvailability());

      await act(async () => {
        await result.current.checkAvailability('2025-12-15', 30);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/appointments/availability')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('date=2025-12-15')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('duration=30')
      );
    });

    it('should return AvailabilityData', async () => {
      const mockAvailability = {
        date: '2025-12-15',
        duration: 30,
        availableSlots: [
          { dateTime: '2025-12-15T09:00:00Z', time: '09:00', displayTime: '9:00 AM', period: 'morning' },
        ],
        totalSlots: 20,
        availableCount: 15,
        occupiedCount: 5,
        businessHours: {
          start: 8,
          end: 18,
          lunchStart: 13,
          lunchEnd: 14,
          slotDuration: 30,
          workingDays: [1, 2, 3, 4, 5, 6],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockAvailability }),
      });

      const { result } = renderHook(() => useAvailability());
      let returnedData;

      await act(async () => {
        returnedData = await result.current.checkAvailability('2025-12-15');
      });

      expect(returnedData).toEqual(mockAvailability);
      expect(result.current.availability).toEqual(mockAvailability);
    });

    it('should include staffId when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      const { result } = renderHook(() => useAvailability());

      await act(async () => {
        await result.current.checkAvailability('2025-12-15', 30, 'staff-1');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('staffId=staff-1')
      );
    });

    it('should include excludeAppointmentId when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      const { result } = renderHook(() => useAvailability());

      await act(async () => {
        await result.current.checkAvailability('2025-12-15', 30, undefined, 'appt-123');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('excludeAppointmentId=appt-123')
      );
    });

    it('should set loading state correctly', async () => {
      let resolvePromise: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise);

      const { result } = renderHook(() => useAvailability());

      let checkPromise: Promise<unknown>;
      act(() => {
        checkPromise = result.current.checkAvailability('2025-12-15');
      });

      expect(result.current.loading).toBe(true);

      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await act(async () => {
        await checkPromise;
      });

      expect(result.current.loading).toBe(false);
    });

    it('should set error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Availability check failed' }),
      });

      const { result } = renderHook(() => useAvailability());

      await act(async () => {
        await expect(result.current.checkAvailability('2025-12-15')).rejects.toThrow(
          'Availability check failed'
        );
      });

      expect(result.current.error).toBe('Availability check failed');
    });
  });

  describe('checkSpecificSlot()', () => {
    it('should send POST request with correct body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, available: true }),
      });

      const { result } = renderHook(() => useAvailability());

      await act(async () => {
        await result.current.checkSpecificSlot('2025-12-15T10:00:00Z', 30);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/appointments/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"dateTime":"2025-12-15T10:00:00Z"'),
      });
    });

    it('should include staffId in POST body when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, available: true }),
      });

      const { result } = renderHook(() => useAvailability());

      await act(async () => {
        await result.current.checkSpecificSlot('2025-12-15T10:00:00Z', 30, 'staff-1');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/appointments/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"staffId":"staff-1"'),
      });
    });

    it('should include excludeAppointmentId in POST body when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, available: true }),
      });

      const { result } = renderHook(() => useAvailability());

      await act(async () => {
        await result.current.checkSpecificSlot('2025-12-15T10:00:00Z', 30, undefined, 'appt-123');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/appointments/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"excludeAppointmentId":"appt-123"'),
      });
    });

    it('should set error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Slot check failed' }),
      });

      const { result } = renderHook(() => useAvailability());

      await act(async () => {
        await expect(
          result.current.checkSpecificSlot('2025-12-15T10:00:00Z')
        ).rejects.toThrow('Slot check failed');
      });

      expect(result.current.error).toBe('Slot check failed');
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected properties and methods', () => {
      const { result } = renderHook(() => useAvailability());

      expect(result.current).toHaveProperty('availability');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(typeof result.current.checkAvailability).toBe('function');
      expect(typeof result.current.checkSpecificSlot).toBe('function');
    });
  });
});

describe('useCalendarConfig', () => {
  it('should return Spanish locale', () => {
    const { result } = renderHook(() => useCalendarConfig());

    expect(result.current.locale).toBe('es');
  });

  it('should return business hours Mon-Sat (1-6)', () => {
    const { result } = renderHook(() => useCalendarConfig());

    expect(result.current.businessHours.daysOfWeek).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should return business hours 08:00-18:00', () => {
    const { result } = renderHook(() => useCalendarConfig());

    expect(result.current.businessHours.startTime).toBe('08:00');
    expect(result.current.businessHours.endTime).toBe('18:00');
  });

  it('should return 15-minute slot duration', () => {
    const { result } = renderHook(() => useCalendarConfig());

    expect(result.current.slotDuration).toBe('00:15:00');
  });

  it('should return correct slot time range', () => {
    const { result } = renderHook(() => useCalendarConfig());

    expect(result.current.slotMinTime).toBe('08:00:00');
    expect(result.current.slotMaxTime).toBe('18:00:00');
  });

  it('should return toolbar configuration', () => {
    const { result } = renderHook(() => useCalendarConfig());

    expect(result.current.headerToolbar).toEqual({
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    });
  });

  it('should return event time format with 24-hour clock', () => {
    const { result } = renderHook(() => useCalendarConfig());

    expect(result.current.eventTimeFormat.hour12).toBe(false);
  });

  it('should return all expected configuration properties', () => {
    const { result } = renderHook(() => useCalendarConfig());

    expect(result.current).toHaveProperty('locale');
    expect(result.current).toHaveProperty('businessHours');
    expect(result.current).toHaveProperty('slotDuration');
    expect(result.current).toHaveProperty('slotMinTime');
    expect(result.current).toHaveProperty('slotMaxTime');
    expect(result.current).toHaveProperty('headerToolbar');
    expect(result.current).toHaveProperty('height');
    expect(result.current).toHaveProperty('expandRows');
    expect(result.current).toHaveProperty('eventDisplay');
    expect(result.current).toHaveProperty('dayMaxEvents');
    expect(result.current).toHaveProperty('moreLinkClick');
    expect(result.current).toHaveProperty('eventTimeFormat');
    expect(result.current).toHaveProperty('slotLabelFormat');
  });
});
