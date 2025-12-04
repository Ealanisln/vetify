/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useAppointments,
  useTodayAppointments,
  useAppointmentStats,
  AppointmentWithDetails,
} from '@/hooks/useAppointments';

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

describe('useAppointments', () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe('Initial State & Mount', () => {
    it('should initialize with empty appointments array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.appointments).toEqual([]);
    });

    it('should initialize with error as null', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });

    it('should call fetchAppointments on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      renderHook(() => useAppointments());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/appointments')
        );
      });
    });

    it('should accept and use initialQuery', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      renderHook(() =>
        useAppointments({
          start_date: '2025-12-01',
          end_date: '2025-12-31',
        })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('start_date=2025-12-01')
        );
      });
    });
  });

  describe('fetchAppointments()', () => {
    it('should fetch from /api/appointments with no filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/appointments?');
      });
    });

    it('should fetch with start_date and end_date query params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.fetchAppointments({
          start_date: '2025-12-01',
          end_date: '2025-12-31',
        });
      });

      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringMatching(/start_date=2025-12-01.*end_date=2025-12-31|end_date=2025-12-31.*start_date=2025-12-01/)
      );
    });

    it('should fetch with status filter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.fetchAppointments({ status: 'CONFIRMED' });
      });

      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('status=CONFIRMED')
      );
    });

    it('should set loading=true during fetch', async () => {
      let resolvePromise: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise);

      const { result } = renderHook(() => useAppointments());

      // Should be loading initially during mount fetch
      expect(result.current.loading).toBe(true);

      // Resolve the fetch
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should convert ISO date strings to Date objects', async () => {
      const mockAppointment = createMockAppointment();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockAppointment] }),
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.appointments[0].dateTime).toBeInstanceOf(Date);
      expect(result.current.appointments[0].createdAt).toBeInstanceOf(Date);
      expect(result.current.appointments[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should set error message on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Server error');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should merge new query with currentQueryRef', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() =>
        useAppointments({ status: 'SCHEDULED' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.fetchAppointments({ staffId: 'staff-1' });
      });

      // Should include both status and staffId
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0];
      expect(lastCall).toContain('status=SCHEDULED');
      expect(lastCall).toContain('staffId=staff-1');
    });
  });

  describe('createAppointment()', () => {
    it('should send POST to /api/appointments with correct body', async () => {
      const mockResponse = createMockAppointment({ id: 'new-appt' });
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockResponse }),
        });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const formData = {
        customerId: 'cust-1',
        petId: 'pet-1',
        dateTime: new Date('2025-12-15T14:00:00.000Z'),
        duration: 30,
        reason: 'Checkup',
        status: 'SCHEDULED' as const,
      };

      await act(async () => {
        await result.current.createAppointment(formData);
      });

      expect(mockFetch).toHaveBeenLastCalledWith('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"dateTime":"2025-12-15T14:00:00.000Z"'),
      });
    });

    it('should add new appointment to state (optimistic update)', async () => {
      const mockResponse = createMockAppointment({ id: 'new-appt' });
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockResponse }),
        });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const formData = {
        customerId: 'cust-1',
        petId: 'pet-1',
        dateTime: new Date('2025-12-15T14:00:00.000Z'),
        duration: 30,
        reason: 'Checkup',
        status: 'SCHEDULED' as const,
      };

      await act(async () => {
        await result.current.createAppointment(formData);
      });

      expect(result.current.appointments).toHaveLength(1);
      expect(result.current.appointments[0].id).toBe('new-appt');
    });

    it('should return created appointment', async () => {
      const mockResponse = createMockAppointment({ id: 'new-appt' });
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockResponse }),
        });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const formData = {
        customerId: 'cust-1',
        petId: 'pet-1',
        dateTime: new Date('2025-12-15T14:00:00.000Z'),
        duration: 30,
        reason: 'Checkup',
        status: 'SCHEDULED' as const,
      };

      let created: AppointmentWithDetails | null = null;
      await act(async () => {
        created = await result.current.createAppointment(formData);
      });

      expect(created?.id).toBe('new-appt');
      expect(created?.dateTime).toBeInstanceOf(Date);
    });

    it('should throw and set error on API failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Creation failed' }),
        });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const formData = {
        customerId: 'cust-1',
        petId: 'pet-1',
        dateTime: new Date('2025-12-15T14:00:00.000Z'),
        duration: 30,
        reason: 'Checkup',
        status: 'SCHEDULED' as const,
      };

      await act(async () => {
        await expect(result.current.createAppointment(formData)).rejects.toThrow(
          'Creation failed'
        );
      });

      expect(result.current.error).toBe('Creation failed');
    });
  });

  describe('updateAppointment()', () => {
    it('should send PUT to /api/appointments/{id}', async () => {
      const existingAppointment = createMockAppointment({ id: 'appt-1' });
      const updatedAppointment = createMockAppointment({
        id: 'appt-1',
        status: 'CONFIRMED' as const,
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: [existingAppointment] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: updatedAppointment }),
        });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateAppointment('appt-1', { status: 'CONFIRMED' });
      });

      expect(mockFetch).toHaveBeenLastCalledWith('/api/appointments/appt-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"status":"CONFIRMED"'),
      });
    });

    it('should convert dateTime to ISO if present', async () => {
      const existingAppointment = createMockAppointment({ id: 'appt-1' });
      const updatedAppointment = createMockAppointment({
        id: 'appt-1',
        dateTime: '2025-12-20T10:00:00.000Z',
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: [existingAppointment] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: updatedAppointment }),
        });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateAppointment('appt-1', {
          dateTime: new Date('2025-12-20T10:00:00.000Z'),
        });
      });

      expect(mockFetch).toHaveBeenLastCalledWith('/api/appointments/appt-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('2025-12-20T10:00:00.000Z'),
      });
    });

    it('should update appointment in state (optimistic update)', async () => {
      const existingAppointment = createMockAppointment({
        id: 'appt-1',
        status: 'SCHEDULED' as const,
      });
      const updatedAppointment = createMockAppointment({
        id: 'appt-1',
        status: 'CONFIRMED' as const,
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: [existingAppointment] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: updatedAppointment }),
        });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.appointments).toHaveLength(1);
      });

      await act(async () => {
        await result.current.updateAppointment('appt-1', { status: 'CONFIRMED' });
      });

      expect(result.current.appointments[0].status).toBe('CONFIRMED');
    });

    it('should throw and set error on API failure', async () => {
      const existingAppointment = createMockAppointment({ id: 'appt-1' });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: [existingAppointment] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Update failed' }),
        });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.updateAppointment('appt-1', { status: 'CONFIRMED' })
        ).rejects.toThrow('Update failed');
      });

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('deleteAppointment()', () => {
    it('should send DELETE to /api/appointments/{id}', async () => {
      const existingAppointment = createMockAppointment({ id: 'appt-1' });
      const cancelledAppointment = createMockAppointment({
        id: 'appt-1',
        status: 'CANCELLED_CLINIC' as const,
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: [existingAppointment] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: cancelledAppointment }),
        });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteAppointment('appt-1');
      });

      expect(mockFetch).toHaveBeenLastCalledWith('/api/appointments/appt-1', {
        method: 'DELETE',
      });
    });

    it('should update appointment status in state (soft delete)', async () => {
      const existingAppointment = createMockAppointment({
        id: 'appt-1',
        status: 'SCHEDULED' as const,
      });
      const cancelledAppointment = createMockAppointment({
        id: 'appt-1',
        status: 'CANCELLED_CLINIC' as const,
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: [existingAppointment] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: cancelledAppointment }),
        });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.appointments).toHaveLength(1);
      });

      await act(async () => {
        await result.current.deleteAppointment('appt-1');
      });

      expect(result.current.appointments[0].status).toBe('CANCELLED_CLINIC');
    });

    it('should throw and set error on API failure', async () => {
      const existingAppointment = createMockAppointment({ id: 'appt-1' });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: [existingAppointment] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Delete failed' }),
        });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.deleteAppointment('appt-1')).rejects.toThrow(
          'Delete failed'
        );
      });

      expect(result.current.error).toBe('Delete failed');
    });
  });

  describe('quickAction()', () => {
    const setupQuickActionTest = async () => {
      const existingAppointment = createMockAppointment({ id: 'appt-1' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: [existingAppointment] }),
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      return result;
    };

    it('should map confirm to CONFIRMED', async () => {
      const result = await setupQuickActionTest();
      const confirmedAppointment = createMockAppointment({
        id: 'appt-1',
        status: 'CONFIRMED' as const,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: confirmedAppointment }),
      });

      await act(async () => {
        await result.current.quickAction('appt-1', 'confirm');
      });

      expect(mockFetch).toHaveBeenLastCalledWith('/api/appointments/appt-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"status":"CONFIRMED"'),
      });
    });

    it('should map checkin to CHECKED_IN', async () => {
      const result = await setupQuickActionTest();
      const checkedInAppointment = createMockAppointment({
        id: 'appt-1',
        status: 'CHECKED_IN' as const,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: checkedInAppointment }),
      });

      await act(async () => {
        await result.current.quickAction('appt-1', 'checkin');
      });

      expect(mockFetch).toHaveBeenLastCalledWith('/api/appointments/appt-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"status":"CHECKED_IN"'),
      });
    });

    it('should map start to IN_PROGRESS', async () => {
      const result = await setupQuickActionTest();
      const inProgressAppointment = createMockAppointment({
        id: 'appt-1',
        status: 'IN_PROGRESS' as const,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: inProgressAppointment }),
      });

      await act(async () => {
        await result.current.quickAction('appt-1', 'start');
      });

      expect(mockFetch).toHaveBeenLastCalledWith('/api/appointments/appt-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"status":"IN_PROGRESS"'),
      });
    });

    it('should map complete to COMPLETED', async () => {
      const result = await setupQuickActionTest();
      const completedAppointment = createMockAppointment({
        id: 'appt-1',
        status: 'COMPLETED' as const,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: completedAppointment }),
      });

      await act(async () => {
        await result.current.quickAction('appt-1', 'complete');
      });

      expect(mockFetch).toHaveBeenLastCalledWith('/api/appointments/appt-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"status":"COMPLETED"'),
      });
    });

    it('should map cancel to CANCELLED_CLINIC', async () => {
      const result = await setupQuickActionTest();
      const cancelledAppointment = createMockAppointment({
        id: 'appt-1',
        status: 'CANCELLED_CLINIC' as const,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: cancelledAppointment }),
      });

      await act(async () => {
        await result.current.quickAction('appt-1', 'cancel');
      });

      expect(mockFetch).toHaveBeenLastCalledWith('/api/appointments/appt-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"status":"CANCELLED_CLINIC"'),
      });
    });

    it('should add optional notes to update', async () => {
      const result = await setupQuickActionTest();
      const confirmedAppointment = createMockAppointment({
        id: 'appt-1',
        status: 'CONFIRMED' as const,
        notes: 'Confirmed by phone',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: confirmedAppointment }),
      });

      await act(async () => {
        await result.current.quickAction('appt-1', 'confirm', 'Confirmed by phone');
      });

      expect(mockFetch).toHaveBeenLastCalledWith('/api/appointments/appt-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"notes":"Confirmed by phone"'),
      });
    });

    it('should throw error on invalid action', async () => {
      const result = await setupQuickActionTest();

      await act(async () => {
        await expect(
          result.current.quickAction('appt-1', 'invalid_action')
        ).rejects.toThrow('Acción no válida');
      });
    });
  });

  describe('refresh()', () => {
    it('should re-fetch with currentQueryRef', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() =>
        useAppointments({ status: 'SCHEDULED' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refresh();
      });

      // Should use the persisted query
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0];
      expect(lastCall).toContain('status=SCHEDULED');
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected properties and methods', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useAppointments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('appointments');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(typeof result.current.fetchAppointments).toBe('function');
      expect(typeof result.current.createAppointment).toBe('function');
      expect(typeof result.current.updateAppointment).toBe('function');
      expect(typeof result.current.deleteAppointment).toBe('function');
      expect(typeof result.current.quickAction).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
    });
  });
});

describe('useTodayAppointments', () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  it('should filter to today date range', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    renderHook(() => useTodayAppointments());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).toContain('start_date=');
    expect(fetchUrl).toContain('end_date=');
  });

  it('should return all useAppointments functions', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    const { result } = renderHook(() => useTodayAppointments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.fetchAppointments).toBe('function');
    expect(typeof result.current.createAppointment).toBe('function');
    expect(typeof result.current.updateAppointment).toBe('function');
    expect(typeof result.current.deleteAppointment).toBe('function');
    expect(typeof result.current.quickAction).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
  });
});

describe('useAppointmentStats', () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  it('should initialize with loading=true', () => {
    // Don't resolve the promises yet
    mockFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAppointmentStats());

    expect(result.current.loading).toBe(true);
  });

  it('should fetch stats for today, week, and month in parallel', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    renderHook(() => useAppointmentStats());

    await waitFor(() => {
      // Should have 3 parallel fetches
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  it('should count appointments correctly for each period', async () => {
    const todayAppointments = [createMockAppointment({ id: 'today-1' })];
    const weekAppointments = [
      createMockAppointment({ id: 'week-1' }),
      createMockAppointment({ id: 'week-2' }),
    ];
    const monthAppointments = [
      createMockAppointment({ id: 'month-1' }),
      createMockAppointment({ id: 'month-2' }),
      createMockAppointment({ id: 'month-3' }),
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: todayAppointments }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: weekAppointments }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: monthAppointments }),
      });

    const { result } = renderHook(() => useAppointmentStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.today).toBe(1);
    expect(result.current.thisWeek).toBe(2);
    expect(result.current.thisMonth).toBe(3);
  });

  it('should calculate completion rate as percentage', async () => {
    const monthAppointments = [
      createMockAppointment({ id: '1', status: 'COMPLETED' as const }),
      createMockAppointment({ id: '2', status: 'COMPLETED' as const }),
      createMockAppointment({ id: '3', status: 'SCHEDULED' as const }),
      createMockAppointment({ id: '4', status: 'CANCELLED_CLINIC' as const }),
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: monthAppointments }),
      });

    const { result } = renderHook(() => useAppointmentStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 2 completed out of 4 = 50%
    expect(result.current.completionRate).toBe(50);
  });

  it('should return 0 completion rate when no appointments', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    const { result } = renderHook(() => useAppointmentStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.completionRate).toBe(0);
  });

  it('should provide refresh function to recalculate stats', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    const { result } = renderHook(() => useAppointmentStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refresh).toBe('function');

    await act(async () => {
      await result.current.refresh();
    });

    // Should have fetched again (3 more times)
    expect(mockFetch).toHaveBeenCalledTimes(6);
  });

  it('should handle API errors', async () => {
    mockFetch.mockRejectedValue(new Error('Stats fetch failed'));

    const { result } = renderHook(() => useAppointmentStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Stats fetch failed');
  });

  it('should return all expected properties', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    const { result } = renderHook(() => useAppointmentStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toHaveProperty('today');
    expect(result.current).toHaveProperty('thisWeek');
    expect(result.current).toHaveProperty('thisMonth');
    expect(result.current).toHaveProperty('completionRate');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('refresh');
  });
});
