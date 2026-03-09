/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-function-type */
/**
 * Integration tests for V1 Appointments API routes
 *
 * Routes tested:
 * - GET/POST /api/v1/appointments
 * - GET/PUT/DELETE /api/v1/appointments/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { prismaMock } from '../../mocks/prisma';

// --- Mock API key auth ---
const mockApiKeyAuth = {
  apiKey: {
    id: 'key-1',
    key: 'vfy_test_key',
    tenantId: 'tenant-1',
    locationId: null,
    scopes: ['read:appointments', 'write:appointments'],
    rateLimit: 1000,
    isActive: true,
    tenant: { id: 'tenant-1', name: 'Test Clinic' },
    location: null,
  },
  locationId: null as string | null,
};

jest.mock('@/lib/api/api-key-auth', () => ({
  withApiAuth: (handler: Function, _options?: any) => {
    return async (request: any, context?: any) => {
      const params = context?.params ? await context.params : undefined;
      return handler(request, { ...mockApiKeyAuth, params });
    };
  },
  apiError: (error: string, code: string, status: number, details?: string) => {
    return NextResponse.json({ error, code, ...(details && { details }) }, { status });
  },
  parsePaginationParams: (request: any) => {
    const url = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '50')), 100);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));
    return { limit, offset };
  },
  paginatedResponse: (data: any[], total: number, pagination: { limit: number; offset: number }) => ({
    data,
    meta: { total, limit: pagination.limit, offset: pagination.offset, hasMore: pagination.offset + data.length < total },
  }),
  buildWhereClause: (apiKey: any, locationId: string | null, additionalWhere: any = {}) => ({
    tenantId: apiKey.tenantId,
    ...(locationId && { locationId }),
    ...additionalWhere,
  }),
}));

jest.mock('@/app/api/v1/_shared/serializers', () => ({
  serializeAppointmentWithRelations: (appt: any) => ({
    id: appt.id,
    dateTime: appt.dateTime?.toISOString?.() ?? appt.dateTime,
    duration: appt.duration,
    reason: appt.reason,
    notes: appt.notes,
    status: appt.status,
    petId: appt.petId,
    customerId: appt.customerId,
    staffId: appt.staffId,
    locationId: appt.locationId,
    pet: appt.pet || null,
    customer: appt.customer || null,
    staff: appt.staff || null,
    location: appt.location || null,
    createdAt: appt.createdAt?.toISOString?.() ?? appt.createdAt,
    updatedAt: appt.updatedAt?.toISOString?.() ?? appt.updatedAt,
  }),
}));

jest.mock('@/lib/webhooks', () => ({
  triggerWebhookEvent: jest.fn(),
}));

// Import route handlers AFTER mocks
import { GET as getAppointments, POST as createAppointment } from '@/app/api/v1/appointments/route';
import { GET as getAppointment, PUT as updateAppointment, DELETE as deleteAppointment } from '@/app/api/v1/appointments/[id]/route';

// --- Helpers ---
function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

const now = new Date();
const futureDate = new Date('2026-06-15T10:00:00Z');

const PET_UUID = '00000000-0000-0000-0000-000000000001';
const CUST_UUID = '00000000-0000-0000-0000-000000000002';
const STAFF_UUID = '00000000-0000-0000-0000-000000000003';
const LOC_UUID = '00000000-0000-0000-0000-000000000004';

const mockAppointment = {
  id: 'appt-1',
  tenantId: 'tenant-1',
  petId: PET_UUID,
  customerId: CUST_UUID,
  staffId: STAFF_UUID,
  locationId: LOC_UUID,
  dateTime: futureDate,
  duration: 30,
  reason: 'Checkup',
  notes: null,
  status: 'SCHEDULED',
  createdAt: now,
  updatedAt: now,
  pet: { id: PET_UUID, name: 'Luna', species: 'Dog', breed: 'Labrador' },
  customer: { id: CUST_UUID, name: 'John Doe', email: 'john@test.com', phone: '555-1234' },
  staff: { id: STAFF_UUID, name: 'Dr. Smith', position: 'Veterinarian' },
  location: { id: LOC_UUID, name: 'Main', slug: 'main' },
};

let consoleSpy: jest.SpyInstance;

beforeEach(() => {
  consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  mockApiKeyAuth.locationId = null;
});

afterEach(() => {
  consoleSpy.mockRestore();
});

// =============================================================================
// GET /api/v1/appointments
// =============================================================================
describe('GET /api/v1/appointments', () => {
  it('should return appointments with relations', async () => {
    (prismaMock.appointment.findMany as jest.Mock).mockResolvedValue([mockAppointment]);
    (prismaMock.appointment.count as jest.Mock).mockResolvedValue(1);

    const req = makeRequest('http://localhost:3000/api/v1/appointments');
    const res = await getAppointments(req, {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('appt-1');
    expect(body.data[0].pet).toBeDefined();
    expect(body.data[0].customer).toBeDefined();
    expect(body.meta.total).toBe(1);
  });

  it('should filter by date range', async () => {
    (prismaMock.appointment.findMany as jest.Mock).mockResolvedValue([mockAppointment]);
    (prismaMock.appointment.count as jest.Mock).mockResolvedValue(1);

    const req = makeRequest(
      'http://localhost:3000/api/v1/appointments?start_date=2026-06-01T00:00:00Z&end_date=2026-06-30T23:59:59Z'
    );
    const res = await getAppointments(req, {});

    expect(res.status).toBe(200);
    expect(prismaMock.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dateTime: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    );
  });

  it('should filter by status', async () => {
    (prismaMock.appointment.findMany as jest.Mock).mockResolvedValue([]);
    (prismaMock.appointment.count as jest.Mock).mockResolvedValue(0);

    const req = makeRequest('http://localhost:3000/api/v1/appointments?status=COMPLETED');
    const res = await getAppointments(req, {});

    expect(res.status).toBe(200);
    expect(prismaMock.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'COMPLETED' }),
      })
    );
  });
});

// =============================================================================
// POST /api/v1/appointments
// =============================================================================
describe('POST /api/v1/appointments', () => {
  const createPayload = {
    dateTime: '2026-06-20T14:00:00Z',
    reason: 'Vaccination',
    petId: PET_UUID,
  };

  it('should create appointment', async () => {
    (prismaMock.pet.findFirst as jest.Mock).mockResolvedValue({
      id: PET_UUID,
      tenantId: 'tenant-1',
      isDeceased: false,
      locationId: null,
      customer: { id: CUST_UUID },
    });
    const created = {
      ...mockAppointment,
      id: 'appt-new',
      reason: 'Vaccination',
      dateTime: new Date('2026-06-20T14:00:00Z'),
    };
    (prismaMock.appointment.create as jest.Mock).mockResolvedValue(created);

    const req = makeRequest('http://localhost:3000/api/v1/appointments', {
      method: 'POST',
      body: JSON.stringify(createPayload),
    });
    const res = await createAppointment(req, {});
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.id).toBe('appt-new');
  });

  it('should require dateTime, reason, petId', async () => {
    const req = makeRequest('http://localhost:3000/api/v1/appointments', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await createAppointment(req, {});
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('should detect scheduling conflicts', async () => {
    (prismaMock.pet.findFirst as jest.Mock).mockResolvedValue({
      id: PET_UUID,
      tenantId: 'tenant-1',
      isDeceased: false,
      locationId: null,
      customer: { id: CUST_UUID },
    });
    (prismaMock.staff.findFirst as jest.Mock).mockResolvedValue({
      id: STAFF_UUID,
      tenantId: 'tenant-1',
      isActive: true,
    });
    // Return an existing conflicting appointment
    (prismaMock.appointment.findFirst as jest.Mock).mockResolvedValue({
      id: 'appt-existing',
      dateTime: new Date('2026-06-20T14:00:00Z'),
      duration: 30,
    });

    const req = makeRequest('http://localhost:3000/api/v1/appointments', {
      method: 'POST',
      body: JSON.stringify({
        ...createPayload,
        staffId: STAFF_UUID,
      }),
    });
    const res = await createAppointment(req, {});
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.code).toBe('CONFLICT');
  });
});

// =============================================================================
// GET /api/v1/appointments/[id]
// =============================================================================
describe('GET /api/v1/appointments/[id]', () => {
  it('should return single appointment', async () => {
    (prismaMock.appointment.findFirst as jest.Mock).mockResolvedValue(mockAppointment);

    const req = makeRequest('http://localhost:3000/api/v1/appointments/appt-1');
    const res = await getAppointment(req, { params: Promise.resolve({ id: 'appt-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.id).toBe('appt-1');
    expect(body.data.reason).toBe('Checkup');
  });
});

// =============================================================================
// PUT /api/v1/appointments/[id]
// =============================================================================
describe('PUT /api/v1/appointments/[id]', () => {
  it('should update appointment', async () => {
    const existing = { ...mockAppointment, status: 'SCHEDULED' };
    const updated = { ...mockAppointment, reason: 'Updated reason' };
    (prismaMock.appointment.findFirst as jest.Mock).mockResolvedValue(existing);
    (prismaMock.appointment.update as jest.Mock).mockResolvedValue(updated);

    const req = makeRequest('http://localhost:3000/api/v1/appointments/appt-1', {
      method: 'PUT',
      body: JSON.stringify({ reason: 'Updated reason' }),
    });
    const res = await updateAppointment(req, { params: Promise.resolve({ id: 'appt-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.reason).toBe('Updated reason');
  });

  it('should reject update on cancelled appointment', async () => {
    const cancelled = { ...mockAppointment, status: 'CANCELLED_CLIENT' };
    (prismaMock.appointment.findFirst as jest.Mock).mockResolvedValue(cancelled);

    const req = makeRequest('http://localhost:3000/api/v1/appointments/appt-1', {
      method: 'PUT',
      body: JSON.stringify({ reason: 'Try to update' }),
    });
    const res = await updateAppointment(req, { params: Promise.resolve({ id: 'appt-1' }) });
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.code).toBe('CONFLICT');
  });
});

// =============================================================================
// DELETE /api/v1/appointments/[id]
// =============================================================================
describe('DELETE /api/v1/appointments/[id]', () => {
  it('should cancel appointment', async () => {
    const existing = { ...mockAppointment, status: 'SCHEDULED' };
    const cancelled = { ...mockAppointment, status: 'CANCELLED_CLINIC' };
    (prismaMock.appointment.findFirst as jest.Mock).mockResolvedValue(existing);
    (prismaMock.appointment.update as jest.Mock).mockResolvedValue(cancelled);

    const req = makeRequest('http://localhost:3000/api/v1/appointments/appt-1', { method: 'DELETE' });
    const res = await deleteAppointment(req, { params: Promise.resolve({ id: 'appt-1' }) });

    expect(res.status).toBe(204);
    expect(prismaMock.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'CANCELLED_CLINIC' },
      })
    );
  });
});
