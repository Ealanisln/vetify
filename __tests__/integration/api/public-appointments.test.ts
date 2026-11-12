/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { createTestTenant, createTestCustomer } from '../../utils/test-utils';
import { POST, GET } from '@/app/api/public/appointments/route';
import { NextRequest } from 'next/server';

// Mock the tenant module
jest.mock('@/lib/tenant', () => ({
  getTenantBySlug: jest.fn(),
}));

// Mock the customer-identification module
jest.mock('@/lib/customer-identification', () => ({
  findOrCreateCustomer: jest.fn(),
  createPublicAppointmentRequest: jest.fn(),
}));

import { getTenantBySlug } from '@/lib/tenant';
import { findOrCreateCustomer, createPublicAppointmentRequest } from '@/lib/customer-identification';

const mockGetTenantBySlug = getTenantBySlug as jest.Mock;
const mockFindOrCreateCustomer = findOrCreateCustomer as jest.Mock;
const mockCreatePublicAppointmentRequest = createPublicAppointmentRequest as jest.Mock;

// Helper to create a mock NextRequest
function createMockRequest(body: Record<string, unknown>): NextRequest {
  return {
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
}

describe('Public Appointments API', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockCustomer: ReturnType<typeof createTestCustomer>;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for validation error tests
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create test data
    mockTenant = createTestTenant({
      id: 'tenant-appointments-test',
      slug: 'test-clinic',
      status: 'ACTIVE',
      publicPageEnabled: true,
      publicBookingEnabled: true,
    });

    mockCustomer = createTestCustomer({
      id: 'customer-appointments-test',
      tenantId: mockTenant.id,
      name: 'Juan García',
      phone: '+52 55 1234 5678',
      email: 'juan@example.com',
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('GET /api/public/appointments', () => {
    it('should return health check message', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Public appointments API is running');
    });
  });

  describe('POST /api/public/appointments', () => {
    it('should create appointment request with valid data', async () => {
      mockGetTenantBySlug.mockResolvedValue(mockTenant);
      mockFindOrCreateCustomer.mockResolvedValue({
        customer: mockCustomer,
        status: 'existing',
        existingPets: [],
        hasUserAccount: false,
        confidence: 'high',
      });
      mockCreatePublicAppointmentRequest.mockResolvedValue({
        id: 'appt-req-1',
        petName: 'Firulais',
        service: 'Consulta general',
        preferredDate: new Date('2025-02-01'),
        status: 'PENDING',
      });

      // No date/time provided, skips conflict check
      prismaMock.appointment.findMany.mockResolvedValue([]);
      prismaMock.appointmentRequest.findFirst.mockResolvedValue(null);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        customerName: 'Juan García',
        customerPhone: '+52 55 1234 5678',
        petName: 'Firulais',
        service: 'Consulta general',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Solicitud de cita recibida');
      expect(data.data.appointmentRequest.petName).toBe('Firulais');
    });

    it('should return 400 for missing required fields', async () => {
      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        // Missing customerName, customerPhone, petName
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Datos inválidos');
      expect(data.details).toBeDefined();
    });

    it('should return 404 for non-existent tenant', async () => {
      mockGetTenantBySlug.mockResolvedValue(null);

      const request = createMockRequest({
        tenantSlug: 'non-existent-clinic',
        customerName: 'Juan García',
        customerPhone: '+52 55 1234 5678',
        petName: 'Firulais',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('La reserva en línea no está disponible para esta clínica');
    });

    it('should return 404 when publicBookingEnabled is false', async () => {
      mockGetTenantBySlug.mockResolvedValue({
        ...mockTenant,
        publicBookingEnabled: false,
      });

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        customerName: 'Juan García',
        customerPhone: '+52 55 1234 5678',
        petName: 'Firulais',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('La reserva en línea no está disponible para esta clínica');
    });

    it('should return 409 for conflicting appointment time slot', async () => {
      mockGetTenantBySlug.mockResolvedValue(mockTenant);

      // Future date for appointment
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      // Create conflict: existing appointment at 10:00 clinic time
      // (America/Mexico_City is UTC-6, the default clinic timezone)
      const conflictDateTime = new Date(`${dateString}T16:00:00.000Z`);

      prismaMock.appointment.findMany.mockResolvedValue([
        {
          id: 'existing-appt',
          dateTime: conflictDateTime,
          duration: 30,
        },
      ] as any);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        customerName: 'Juan García',
        customerPhone: '+52 55 1234 5678',
        petName: 'Firulais',
        preferredDate: dateString,
        preferredTime: '10:00', // Conflicts with existing
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toContain('horario seleccionado ya no está disponible');
      expect(data.conflictType).toBe('appointment');
    });

    it('should return 409 for conflicting confirmed request', async () => {
      mockGetTenantBySlug.mockResolvedValue(mockTenant);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      // No appointment conflicts
      prismaMock.appointment.findMany.mockResolvedValue([]);

      // But there's a confirmed request at that time
      prismaMock.appointmentRequest.findFirst.mockResolvedValue({
        id: 'existing-req',
        preferredDate: new Date(`${dateString}T00:00:00.000Z`),
        preferredTime: '11:00',
        status: 'CONFIRMED',
      } as any);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        customerName: 'Juan García',
        customerPhone: '+52 55 1234 5678',
        petName: 'Firulais',
        preferredDate: dateString,
        preferredTime: '11:00', // Conflicts with confirmed request
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.conflictType).toBe('request');
    });

    it('should find existing customer by phone', async () => {
      mockGetTenantBySlug.mockResolvedValue(mockTenant);

      const existingPets = [
        { id: 'pet-1', name: 'Firulais', species: 'DOG' },
      ];

      mockFindOrCreateCustomer.mockResolvedValue({
        customer: mockCustomer,
        status: 'existing',
        existingPets,
        hasUserAccount: false,
        confidence: 'high',
      });

      mockCreatePublicAppointmentRequest.mockResolvedValue({
        id: 'appt-req-1',
        petName: 'Firulais',
        service: 'Consulta general',
        preferredDate: null,
        status: 'PENDING',
      });

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        customerName: 'Juan García',
        customerPhone: '+52 55 1234 5678',
        petName: 'Firulais',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Knowing a phone must not reveal that it belongs to a client, nor their pets
      expect(Object.keys(data.data)).toEqual(['appointmentRequest']);
      expect(JSON.stringify(data)).not.toContain('pet-1');
      expect(JSON.stringify(data)).not.toContain(mockCustomer.id);

      // Verify findOrCreateCustomer was called with correct params
      expect(mockFindOrCreateCustomer).toHaveBeenCalledWith({
        tenantId: mockTenant.id,
        phone: '+52 55 1234 5678',
        email: undefined,
        name: 'Juan García',
      });
    });

    it('should find existing customer by email', async () => {
      mockGetTenantBySlug.mockResolvedValue(mockTenant);
      mockFindOrCreateCustomer.mockResolvedValue({
        customer: { ...mockCustomer, email: 'juan@example.com' },
        status: 'existing',
        existingPets: [],
        hasUserAccount: true,
        confidence: 'high',
      });
      mockCreatePublicAppointmentRequest.mockResolvedValue({
        id: 'appt-req-1',
        petName: 'Luna',
        service: null,
        preferredDate: null,
        status: 'PENDING',
      });

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        customerName: 'Juan García',
        customerPhone: '+52 55 9999 9999', // Different phone
        customerEmail: 'juan@example.com', // But same email
        petName: 'Luna',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // No login prompt: it disclosed the account and its email to anyone
      expect(Object.keys(data.data)).toEqual(['appointmentRequest']);
      expect(JSON.stringify(data)).not.toContain('juan@example.com');
    });

    it('should create new customer when not found', async () => {
      mockGetTenantBySlug.mockResolvedValue(mockTenant);
      mockFindOrCreateCustomer.mockResolvedValue({
        customer: {
          id: 'new-customer-id',
          name: 'María López',
          phone: '+52 55 8888 7777',
          email: null,
        },
        status: 'new',
        existingPets: [],
        hasUserAccount: false,
        confidence: 'high',
      });
      mockCreatePublicAppointmentRequest.mockResolvedValue({
        id: 'appt-req-new',
        petName: 'Rocky',
        service: 'Vacunación',
        preferredDate: null,
        status: 'PENDING',
      });

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        customerName: 'María López',
        customerPhone: '+52 55 8888 7777',
        petName: 'Rocky',
        service: 'Vacunación',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual({
        appointmentRequest: {
          id: 'appt-req-new',
          petName: 'Rocky',
          service: 'Vacunación',
          preferredDate: null,
          status: 'PENDING',
        },
      });
    });

    it('should return needs_review status for ambiguous match', async () => {
      mockGetTenantBySlug.mockResolvedValue(mockTenant);

      const similarCustomers = [
        { id: 'similar-1', name: 'Juan Garcia', phone: '+52 55 1234 0000' },
        { id: 'similar-2', name: 'Juan Garza', phone: '+52 55 1234 1111' },
      ];

      mockFindOrCreateCustomer.mockResolvedValue({
        customer: {
          id: 'new-customer-ambiguous',
          name: 'Juan García',
          phone: '+52 55 2222 3333',
        },
        status: 'needs_review',
        existingPets: [],
        hasUserAccount: false,
        similarCustomers,
        confidence: 'low',
      });
      mockCreatePublicAppointmentRequest.mockResolvedValue({
        id: 'appt-req-review',
        petName: 'Max',
        service: null,
        preferredDate: null,
        status: 'PENDING',
      });

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        customerName: 'Juan García',
        customerPhone: '+52 55 2222 3333',
        petName: 'Max',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Other customers with a similar name are never returned
      expect(Object.keys(data.data)).toEqual(['appointmentRequest']);
      expect(JSON.stringify(data)).not.toContain('similar-1');
      expect(JSON.stringify(data)).not.toContain('Juan Garza');
    });

    it('should match pet by ID when provided', async () => {
      mockGetTenantBySlug.mockResolvedValue(mockTenant);

      const existingPets = [
        { id: 'pet-123', name: 'Firulais', species: 'DOG' },
        { id: 'pet-456', name: 'Luna', species: 'CAT' },
      ];

      mockFindOrCreateCustomer.mockResolvedValue({
        customer: mockCustomer,
        status: 'existing',
        existingPets,
        hasUserAccount: false,
        confidence: 'high',
      });
      mockCreatePublicAppointmentRequest.mockResolvedValue({
        id: 'appt-req-pet',
        petName: 'Firulais',
        service: 'Baño',
        preferredDate: null,
        status: 'PENDING',
      });

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        customerName: 'Juan García',
        customerPhone: '+52 55 1234 5678',
        petId: 'pet-123', // Explicit pet ID
        petName: 'Firulais',
        service: 'Baño',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify createPublicAppointmentRequest was called with petId
      expect(mockCreatePublicAppointmentRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentData: expect.objectContaining({
            petId: 'pet-123',
            petName: 'Firulais',
          }),
        })
      );
    });

    it('should accept optional notes field', async () => {
      mockGetTenantBySlug.mockResolvedValue(mockTenant);
      mockFindOrCreateCustomer.mockResolvedValue({
        customer: mockCustomer,
        status: 'existing',
        existingPets: [],
        hasUserAccount: false,
        confidence: 'high',
      });
      mockCreatePublicAppointmentRequest.mockResolvedValue({
        id: 'appt-req-notes',
        petName: 'Firulais',
        service: 'Consulta',
        preferredDate: null,
        status: 'PENDING',
      });

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        customerName: 'Juan García',
        customerPhone: '+52 55 1234 5678',
        petName: 'Firulais',
        notes: 'El perro tiene problemas de piel',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify notes were passed
      expect(mockCreatePublicAppointmentRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentData: expect.objectContaining({
            notes: 'El perro tiene problemas de piel',
          }),
        })
      );
    });

    it('should return 400 for past date appointment', async () => {
      mockGetTenantBySlug.mockResolvedValue(mockTenant);

      // Past date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const dateString = pastDate.toISOString().split('T')[0];

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        customerName: 'Juan García',
        customerPhone: '+52 55 1234 5678',
        petName: 'Firulais',
        preferredDate: dateString,
        preferredTime: '10:00',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('No se pueden agendar citas en el pasado');
    });

    it('should return 400 for invalid email format', async () => {
      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        customerName: 'Juan García',
        customerPhone: '+52 55 1234 5678',
        customerEmail: 'not-valid-email',
        petName: 'Firulais',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Datos inválidos');
    });

    it('should accept empty string for optional email', async () => {
      mockGetTenantBySlug.mockResolvedValue(mockTenant);
      mockFindOrCreateCustomer.mockResolvedValue({
        customer: mockCustomer,
        status: 'existing',
        existingPets: [],
        hasUserAccount: false,
        confidence: 'high',
      });
      mockCreatePublicAppointmentRequest.mockResolvedValue({
        id: 'appt-req-no-email',
        petName: 'Firulais',
        service: null,
        preferredDate: null,
        status: 'PENDING',
      });

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        customerName: 'Juan García',
        customerPhone: '+52 55 1234 5678',
        customerEmail: '', // Empty string should be allowed
        petName: 'Firulais',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should answer unexpected failures in Spanish', async () => {
      mockGetTenantBySlug.mockRejectedValue(new Error('db down'));

      const response = await POST(createMockRequest({
        tenantSlug: 'test-clinic',
        customerName: 'Juan García',
        customerPhone: '+52 55 1234 5678',
        petName: 'Firulais',
      }));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ success: false, error: 'Error interno del servidor' });
    });

    it('should create appointment request with date and time', async () => {
      mockGetTenantBySlug.mockResolvedValue(mockTenant);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      // No conflicts
      prismaMock.appointment.findMany.mockResolvedValue([]);
      prismaMock.appointmentRequest.findFirst.mockResolvedValue(null);

      mockFindOrCreateCustomer.mockResolvedValue({
        customer: mockCustomer,
        status: 'existing',
        existingPets: [],
        hasUserAccount: false,
        confidence: 'high',
      });
      mockCreatePublicAppointmentRequest.mockResolvedValue({
        id: 'appt-req-datetime',
        petName: 'Firulais',
        service: 'Consulta',
        preferredDate: new Date(dateString),
        status: 'PENDING',
      });

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        customerName: 'Juan García',
        customerPhone: '+52 55 1234 5678',
        petName: 'Firulais',
        preferredDate: dateString,
        preferredTime: '14:30',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify date and time were passed
      expect(mockCreatePublicAppointmentRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentData: expect.objectContaining({
            preferredDate: dateString,
            preferredTime: '14:30',
          }),
        })
      );
    });
  });

  /**
   * preferredDate + preferredTime are clinic-local labels. Production runs in
   * UTC, so they must be resolved in the clinic timezone before comparing
   * against stored instants. 2026-11-16 is a Monday; Mexico City is UTC-6.
   */
  describe('clinic timezone', () => {
    const MONDAY = '2026-11-16';

    function useClock(iso: string) {
      jest.useFakeTimers({
        now: new Date(iso),
        doNotFake: [
          'nextTick',
          'setImmediate',
          'clearImmediate',
          'setTimeout',
          'clearTimeout',
          'setInterval',
          'clearInterval',
          'queueMicrotask',
        ],
      });
    }

    function bookingRequest(preferredTime: string) {
      return createMockRequest({
        tenantSlug: 'test-clinic',
        customerName: 'Juan García',
        customerPhone: '+52 55 1234 5678',
        petName: 'Firulais',
        preferredDate: MONDAY,
        preferredTime,
      });
    }

    beforeEach(() => {
      useClock('2026-11-10T18:00:00.000Z');
      mockGetTenantBySlug.mockResolvedValue({ ...mockTenant, timeZone: 'America/Mexico_City' });
      prismaMock.appointment.findMany.mockResolvedValue([]);
      prismaMock.appointmentRequest.findFirst.mockResolvedValue(null);
      mockFindOrCreateCustomer.mockResolvedValue({
        customer: mockCustomer,
        status: 'existing',
        existingPets: [],
        hasUserAccount: false,
        confidence: 'high',
      });
      mockCreatePublicAppointmentRequest.mockResolvedValue({
        id: 'appt-req-tz',
        petName: 'Firulais',
        service: 'Consulta',
        preferredDate: new Date(MONDAY),
        status: 'PENDING',
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('rejects 09:00 clinic time when an appointment exists at 15:00Z', async () => {
      prismaMock.appointment.findMany.mockResolvedValue([
        { id: 'appt-1', dateTime: new Date('2026-11-16T15:00:00.000Z'), duration: 30 },
      ] as any);

      const response = await POST(bookingRequest('09:00'));
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.conflictType).toBe('appointment');
    });

    it('looks for conflicts over the clinic day', async () => {
      await POST(bookingRequest('09:00'));

      const where = prismaMock.appointment.findMany.mock.calls[0][0]!.where as any;
      expect(where.dateTime.gte.toISOString()).toBe('2026-11-16T06:00:00.000Z');
      expect(where.dateTime.lte.toISOString()).toBe('2026-11-17T05:59:59.999Z');
    });

    it('accepts 09:00 clinic time at 08:00 clinic time (14:00Z) as not in the past', async () => {
      useClock('2026-11-16T14:00:00.000Z');

      const response = await POST(bookingRequest('09:00'));

      expect(response.status).toBe(200);
    });

    it('rejects 09:00 clinic time at 09:30 clinic time (15:30Z) as in the past', async () => {
      useClock('2026-11-16T15:30:00.000Z');

      const response = await POST(bookingRequest('09:00'));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No se pueden agendar citas en el pasado');
    });
  });
});
