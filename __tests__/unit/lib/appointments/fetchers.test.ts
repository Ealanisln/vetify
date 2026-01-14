/**
 * Unit tests for appointments fetcher functions
 * Tests API calls, date transformations, and error handling
 */

import {
  fetchAppointments,
  fetchAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  quickActionAppointment,
  checkAvailability,
  checkSpecificSlot,
} from '@/lib/appointments/fetchers';

// Helper to create mock appointment API response
const createMockApiAppointment = (overrides: Partial<{
  id: string;
  dateTime: string;
  duration: number;
  reason: string;
  notes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}> = {}) => ({
  id: 'appt-1',
  dateTime: '2025-12-15T14:00:00.000Z',
  duration: 30,
  reason: 'Checkup',
  notes: 'Regular visit',
  status: 'SCHEDULED',
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

describe('fetchAppointments', () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  it('should fetch appointments without query params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await fetchAppointments();

    expect(mockFetch).toHaveBeenCalledWith('/api/appointments');
  });

  it('should fetch appointments with query params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await fetchAppointments({
      start_date: '2025-12-01',
      end_date: '2025-12-31',
      status: 'SCHEDULED',
    });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('/api/appointments?');
    expect(calledUrl).toContain('start_date=2025-12-01');
    expect(calledUrl).toContain('end_date=2025-12-31');
    expect(calledUrl).toContain('status=SCHEDULED');
  });

  it('should ignore undefined and empty query params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await fetchAppointments({
      start_date: '2025-12-01',
      status: undefined,
      locationId: '',
    });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('start_date=2025-12-01');
    expect(calledUrl).not.toContain('status');
    expect(calledUrl).not.toContain('locationId');
  });

  it('should transform date strings to Date objects', async () => {
    const mockAppointment = createMockApiAppointment();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [mockAppointment] }),
    });

    const result = await fetchAppointments();

    expect(result).toHaveLength(1);
    expect(result[0].dateTime).toBeInstanceOf(Date);
    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[0].updatedAt).toBeInstanceOf(Date);
  });

  it('should throw error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    await expect(fetchAppointments()).rejects.toThrow('Server error');
  });

  it('should throw default error message when no error provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    await expect(fetchAppointments()).rejects.toThrow('Error al cargar las citas');
  });
});

describe('fetchAppointmentById', () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  it('should fetch single appointment by ID', async () => {
    const mockAppointment = createMockApiAppointment({ id: 'appt-123' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockAppointment }),
    });

    const result = await fetchAppointmentById('appt-123');

    expect(mockFetch).toHaveBeenCalledWith('/api/appointments/appt-123');
    expect(result.id).toBe('appt-123');
  });

  it('should transform date strings to Date objects', async () => {
    const mockAppointment = createMockApiAppointment();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockAppointment }),
    });

    const result = await fetchAppointmentById('appt-1');

    expect(result.dateTime).toBeInstanceOf(Date);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should throw error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Not found' }),
    });

    await expect(fetchAppointmentById('invalid-id')).rejects.toThrow('Not found');
  });
});

describe('createAppointment', () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  it('should POST to /api/appointments with correct body', async () => {
    const mockAppointment = createMockApiAppointment({ id: 'new-appt' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockAppointment }),
    });

    const formData = {
      customerId: 'cust-1',
      petId: 'pet-1',
      dateTime: new Date('2025-12-15T14:00:00Z'),
      duration: 30,
      reason: 'Checkup',
      status: 'SCHEDULED' as const,
    };

    await createAppointment(formData);

    expect(mockFetch).toHaveBeenCalledWith('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('"dateTime":"2025-12-15T14:00:00.000Z"'),
    });
  });

  it('should convert dateTime to ISO string', async () => {
    const mockAppointment = createMockApiAppointment();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockAppointment }),
    });

    const formData = {
      customerId: 'cust-1',
      petId: 'pet-1',
      dateTime: new Date('2025-12-15T14:00:00Z'),
      duration: 30,
      reason: 'Checkup',
      status: 'SCHEDULED' as const,
    };

    await createAppointment(formData);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.dateTime).toBe('2025-12-15T14:00:00.000Z');
  });

  it('should return created appointment with Date objects', async () => {
    const mockAppointment = createMockApiAppointment({ id: 'new-appt' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockAppointment }),
    });

    const formData = {
      customerId: 'cust-1',
      petId: 'pet-1',
      dateTime: new Date('2025-12-15T14:00:00Z'),
      duration: 30,
      reason: 'Checkup',
      status: 'SCHEDULED' as const,
    };

    const result = await createAppointment(formData);

    expect(result.id).toBe('new-appt');
    expect(result.dateTime).toBeInstanceOf(Date);
  });

  it('should throw error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Creation failed' }),
    });

    const formData = {
      customerId: 'cust-1',
      petId: 'pet-1',
      dateTime: new Date(),
      duration: 30,
      reason: 'Checkup',
      status: 'SCHEDULED' as const,
    };

    await expect(createAppointment(formData)).rejects.toThrow('Creation failed');
  });
});

describe('updateAppointment', () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  it('should PUT to /api/appointments/{id}', async () => {
    const mockAppointment = createMockApiAppointment({ status: 'CONFIRMED' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockAppointment }),
    });

    await updateAppointment('appt-1', { status: 'CONFIRMED' });

    expect(mockFetch).toHaveBeenCalledWith('/api/appointments/appt-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('"status":"CONFIRMED"'),
    });
  });

  it('should convert dateTime to ISO string when present', async () => {
    const mockAppointment = createMockApiAppointment();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockAppointment }),
    });

    await updateAppointment('appt-1', {
      dateTime: new Date('2025-12-20T10:00:00Z'),
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.dateTime).toBe('2025-12-20T10:00:00.000Z');
  });

  it('should allow partial updates', async () => {
    const mockAppointment = createMockApiAppointment({ notes: 'Updated notes' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockAppointment }),
    });

    await updateAppointment('appt-1', { notes: 'Updated notes' });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.notes).toBe('Updated notes');
    expect(body.status).toBeUndefined();
  });

  it('should throw error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Update failed' }),
    });

    await expect(updateAppointment('appt-1', { status: 'CONFIRMED' })).rejects.toThrow(
      'Update failed'
    );
  });
});

describe('deleteAppointment', () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  it('should DELETE to /api/appointments/{id}', async () => {
    const mockAppointment = createMockApiAppointment({ status: 'CANCELLED_CLINIC' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockAppointment }),
    });

    await deleteAppointment('appt-1');

    expect(mockFetch).toHaveBeenCalledWith('/api/appointments/appt-1', {
      method: 'DELETE',
    });
  });

  it('should return cancelled appointment', async () => {
    const mockAppointment = createMockApiAppointment({ status: 'CANCELLED_CLINIC' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockAppointment }),
    });

    const result = await deleteAppointment('appt-1');

    expect(result.status).toBe('CANCELLED_CLINIC');
    expect(result.dateTime).toBeInstanceOf(Date);
  });

  it('should throw error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Delete failed' }),
    });

    await expect(deleteAppointment('appt-1')).rejects.toThrow('Delete failed');
  });
});

describe('quickActionAppointment', () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe('action mappings', () => {
    const testCases = [
      { action: 'confirm', expectedStatus: 'CONFIRMED' },
      { action: 'checkin', expectedStatus: 'CHECKED_IN' },
      { action: 'start', expectedStatus: 'IN_PROGRESS' },
      { action: 'complete', expectedStatus: 'COMPLETED' },
      { action: 'cancel', expectedStatus: 'CANCELLED_CLINIC' },
    ];

    testCases.forEach(({ action, expectedStatus }) => {
      it(`should map "${action}" to "${expectedStatus}"`, async () => {
        const mockAppointment = createMockApiAppointment({ status: expectedStatus });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockAppointment }),
        });

        await quickActionAppointment('appt-1', action);

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.status).toBe(expectedStatus);
      });
    });
  });

  it('should include notes when provided', async () => {
    const mockAppointment = createMockApiAppointment({ status: 'CONFIRMED' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockAppointment }),
    });

    await quickActionAppointment('appt-1', 'confirm', 'Confirmed by phone');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.notes).toBe('Confirmed by phone');
  });

  it('should throw error for invalid action', async () => {
    await expect(quickActionAppointment('appt-1', 'invalid_action')).rejects.toThrow(
      'Accion no valida'
    );
  });

  it('should not call API for invalid action', async () => {
    try {
      await quickActionAppointment('appt-1', 'invalid_action');
    } catch {
      // Expected to throw
    }

    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('checkAvailability', () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  it('should GET availability with date and default duration', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { available: true, slots: [] } }),
    });

    await checkAvailability('2025-12-15');

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('/api/appointments/availability?');
    expect(calledUrl).toContain('date=2025-12-15');
    expect(calledUrl).toContain('duration=30');
  });

  it('should include custom duration', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { available: true } }),
    });

    await checkAvailability('2025-12-15', 60);

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('duration=60');
  });

  it('should include staffId when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { available: true } }),
    });

    await checkAvailability('2025-12-15', 30, 'staff-1');

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('staffId=staff-1');
  });

  it('should include excludeAppointmentId when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { available: true } }),
    });

    await checkAvailability('2025-12-15', 30, undefined, 'appt-to-exclude');

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('excludeAppointmentId=appt-to-exclude');
  });

  it('should return availability data', async () => {
    const mockData = { available: true, slots: ['09:00', '10:00', '11:00'] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockData }),
    });

    const result = await checkAvailability('2025-12-15');

    expect(result).toEqual(mockData);
  });

  it('should throw error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Availability check failed' }),
    });

    await expect(checkAvailability('2025-12-15')).rejects.toThrow('Availability check failed');
  });
});

describe('checkSpecificSlot', () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  it('should POST to /api/appointments/availability', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ available: true }),
    });

    await checkSpecificSlot('2025-12-15T14:00:00Z');

    expect(mockFetch).toHaveBeenCalledWith('/api/appointments/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });
  });

  it('should send correct body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ available: true }),
    });

    await checkSpecificSlot('2025-12-15T14:00:00Z', 45, 'staff-1', 'exclude-appt');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({
      dateTime: '2025-12-15T14:00:00Z',
      duration: 45,
      staffId: 'staff-1',
      excludeAppointmentId: 'exclude-appt',
    });
  });

  it('should use default duration of 30', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ available: true }),
    });

    await checkSpecificSlot('2025-12-15T14:00:00Z');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.duration).toBe(30);
  });

  it('should return availability result', async () => {
    const mockResult = { available: true, conflicts: [] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    const result = await checkSpecificSlot('2025-12-15T14:00:00Z');

    expect(result).toEqual(mockResult);
  });

  it('should throw error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Slot check failed' }),
    });

    await expect(checkSpecificSlot('2025-12-15T14:00:00Z')).rejects.toThrow('Slot check failed');
  });
});
