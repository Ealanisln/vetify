/**
 * @jest-environment node
 *
 * Double-booking checks in the dashboard routes: they must use the existing
 * appointment's real duration and still validate when no staff is assigned.
 */

jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(async () => ({ tenant: { id: 'tenant-1', countryCode: 'MX' } })),
  requirePermission: jest.fn(async () => ({ tenant: { id: 'tenant-1' } })),
}));

jest.mock('@/lib/enhanced-settings', () => ({
  shouldSendNotification: jest.fn(async () => false),
}));

jest.mock('@/lib/email/email-service', () => ({
  sendAppointmentConfirmation: jest.fn(),
  sendAppointmentStaffNotification: jest.fn(),
  sendAppointmentCancellation: jest.fn(),
  sendAppointmentRescheduled: jest.fn(),
}));

jest.mock('@/lib/after-response', () => ({
  runAfterResponse: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    customer: { findFirst: jest.fn(async () => ({ id: 'cust-1' })) },
    pet: { findFirst: jest.fn(async () => ({ id: 'pet-1' })) },
    staff: { findFirst: jest.fn(async () => ({ id: 'staff-1' })) },
    tenantSettings: { findUnique: jest.fn(async () => null) },
    appointment: {
      findFirst: jest.fn(async () => null),
      findMany: jest.fn(async () => []),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { POST as createAppointment } from '@/app/api/appointments/route';
import { PUT as updateAppointment } from '@/app/api/appointments/[id]/route';
import { POST as checkSlot } from '@/app/api/appointments/availability/route';

const mockAppointment = prisma.appointment as unknown as {
  findFirst: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
};

// Friday Nov 20 2026, Mexico City is UTC-6: 10:00 local = 16:00 UTC
const TEN_AM = new Date('2026-11-20T16:00:00.000Z');
const NINE_AM = new Date('2026-11-20T15:00:00.000Z');

function existingRow(dateTime: Date, duration: number, overrides: Record<string, unknown> = {}) {
  return {
    id: 'apt-existing',
    tenantId: 'tenant-1',
    dateTime,
    duration,
    status: 'SCHEDULED',
    staffId: null,
    locationId: null,
    staff: null,
    customer: { name: 'Ana' },
    pet: { name: 'Firulais' },
    ...overrides,
  };
}

function jsonRequest(method: string, body: unknown): Request {
  return new Request('http://localhost:3000/api/appointments', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const createBody = (overrides: Record<string, unknown> = {}) => ({
  dateTime: TEN_AM.toISOString(),
  duration: 30,
  customerId: 'cust-1',
  petId: 'pet-1',
  reason: 'Consulta',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  mockAppointment.findMany.mockResolvedValue([]);
  mockAppointment.findFirst.mockResolvedValue(null);
});

describe('POST /api/appointments double-booking', () => {
  it('rejects a slot taken by a long appointment that started earlier', async () => {
    // 09:00 for 90 min is still running at 10:00
    mockAppointment.findMany.mockResolvedValue([
      existingRow(NINE_AM, 90, { staffId: 'staff-1', staff: { name: 'Dra. López' } }),
    ]);

    const response = await createAppointment(jsonRequest('POST', createBody({ staffId: 'staff-1' })));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('Dra. López ya tiene una cita en este horario');
    expect(mockAppointment.create).not.toHaveBeenCalled();
  });

  it('rejects an unassigned appointment that overlaps another one in the clinic', async () => {
    mockAppointment.findMany.mockResolvedValue([existingRow(TEN_AM, 30)]);

    const response = await createAppointment(jsonRequest('POST', createBody()));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe(
      'Ya hay una cita en este horario. Asigna un veterinario para agendar citas al mismo tiempo.'
    );
    expect(mockAppointment.create).not.toHaveBeenCalled();
  });
});

describe('PUT /api/appointments/:id double-booking', () => {
  const params = { params: Promise.resolve({ id: 'apt-1' }) };

  it('rejects rescheduling an unassigned appointment onto an occupied slot', async () => {
    mockAppointment.findFirst.mockResolvedValue({
      ...existingRow(NINE_AM, 30),
      id: 'apt-1',
      customerId: 'cust-1',
      notes: null,
    });
    mockAppointment.findMany.mockResolvedValue([existingRow(TEN_AM, 30)]);

    const response = await updateAppointment(
      jsonRequest('PUT', { dateTime: TEN_AM.toISOString() }),
      params
    );

    expect(response.status).toBe(409);
    expect(mockAppointment.update).not.toHaveBeenCalled();
    // The appointment being edited never conflicts with itself
    expect(mockAppointment.findMany.mock.calls[0][0].where.id).toEqual({ not: 'apt-1' });
  });
});

describe('POST /api/appointments/availability slot check', () => {
  it('reports a slot as taken when a long appointment that started earlier is still running', async () => {
    mockAppointment.findMany.mockResolvedValue([existingRow(NINE_AM, 90)]);

    const response = await checkSlot(jsonRequest('POST', { dateTime: TEN_AM.toISOString(), duration: 30 }));
    const body = await response.json();

    expect(body.available).toBe(false);
    expect(body.conflict.appointmentId).toBe('apt-existing');
  });
});
