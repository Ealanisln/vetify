/**
 * @jest-environment node
 *
 * Appointment emails sent from the API routes must show times in the
 * clinic's timezone, never the server's (UTC on Vercel). The tenant here is
 * in Chile (UTC-3 in November) so the assertions fail whether the machine
 * runs in UTC or in Mexico City.
 */

const mockSendConfirmation = jest.fn();
const mockSendStaffNotification = jest.fn();
const mockSendCancellation = jest.fn();
const mockSendRescheduled = jest.fn();

jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
  requirePermission: jest.fn(async () => ({ tenant: { id: 'tenant-cl' } })),
}));

jest.mock('@/lib/enhanced-settings', () => ({
  shouldSendNotification: jest.fn(async () => true),
}));

jest.mock('@/lib/email/email-service', () => ({
  sendAppointmentConfirmation: (...args: unknown[]) => mockSendConfirmation(...args),
  sendAppointmentStaffNotification: (...args: unknown[]) => mockSendStaffNotification(...args),
  sendAppointmentCancellation: (...args: unknown[]) => mockSendCancellation(...args),
  sendAppointmentRescheduled: (...args: unknown[]) => mockSendRescheduled(...args),
}));

jest.mock('@/lib/after-response', () => ({
  runAfterResponse: (task: () => Promise<unknown>) => {
    void task();
  },
}));

const TENANT_ROW: Record<string, unknown> = {
  id: 'tenant-cl',
  name: 'Clínica Sur',
  publicPhone: null,
  publicAddress: null,
  countryCode: 'CL',
  tenantSettings: { timezone: 'UTC' }, // signup placeholder: zone comes from country
};

/** Return only the tenant fields the route selected, like Prisma does */
function selectTenant(args: { include?: { tenant?: { select: Record<string, unknown> } } }) {
  const select = args.include?.tenant?.select ?? {};
  return Object.fromEntries(
    Object.keys(select)
      .filter((key) => select[key] && key in TENANT_ROW)
      .map((key) => [key, TENANT_ROW[key]])
  );
}

function appointmentRow(dateTime: Date, args: Parameters<typeof selectTenant>[0], status = 'SCHEDULED') {
  return {
    id: 'apt-1',
    tenantId: 'tenant-cl',
    dateTime,
    duration: 30,
    status,
    reason: 'Consulta',
    notes: null,
    staffId: 'staff-1',
    customerId: 'cust-1',
    customer: { id: 'cust-1', name: 'Ana', email: 'ana@example.test', phone: null },
    pet: { id: 'pet-1', name: 'Firulais', species: 'dog', breed: null },
    staff: { id: 'staff-1', name: 'Dra. López', position: 'VETERINARIAN' },
    location: null,
    tenant: selectTenant(args),
  };
}

// Nov 13 2026 10:00 in Santiago = 13:00 UTC (07:00 in Mexico City)
const TEN_AM_SANTIAGO = new Date('2026-11-13T13:00:00.000Z');
// Nov 13 2026 20:00 in Santiago = Nov 13 23:00 UTC
const EIGHT_PM_SANTIAGO = new Date('2026-11-13T23:00:00.000Z');

jest.mock('@/lib/prisma', () => ({
  prisma: {
    customer: { findFirst: jest.fn(async () => ({ id: 'cust-1' })) },
    pet: { findFirst: jest.fn(async () => ({ id: 'pet-1' })) },
    staff: {
      findFirst: jest.fn(async () => ({ id: 'staff-1' })),
      findUnique: jest.fn(async () => ({ email: 'vet@example.test', name: 'Dra. López' })),
    },
    appointment: {
      findFirst: jest.fn(),
      // The overlap check: no conflicts
      findMany: jest.fn(async () => []),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/appointments/route';
import { PUT, DELETE } from '@/app/api/appointments/[id]/route';

const mockAppointment = prisma.appointment as unknown as {
  findFirst: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
};

function jsonRequest(method: string, body?: unknown): Request {
  return new Request('http://localhost:3000/api/appointments', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const params = { params: Promise.resolve({ id: 'apt-1' }) };

beforeEach(() => {
  jest.clearAllMocks();
  mockAppointment.findFirst.mockImplementation(async () => appointmentRow(EIGHT_PM_SANTIAGO, {}));
  mockAppointment.create.mockImplementation(async (args) => appointmentRow(TEN_AM_SANTIAGO, args));
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('appointment emails use the clinic timezone', () => {
  it('POST: confirmation and staff notification show 10:00 Santiago time', async () => {
    const response = await POST(
      jsonRequest('POST', {
        dateTime: TEN_AM_SANTIAGO.toISOString(),
        customerId: 'cust-1',
        petId: 'pet-1',
        reason: 'Consulta',
        staffId: 'staff-1',
      })
    );

    expect(response.status).toBe(201);
    const confirmation = mockSendConfirmation.mock.calls[0][0];
    expect(confirmation.data.appointmentTime).toBe('10:00');
    expect(confirmation.timeZone).toBe('America/Santiago');
    const staffEmail = mockSendStaffNotification.mock.calls[0][0];
    expect(staffEmail.data.appointmentTime).toBe('10:00');
    expect(staffEmail.timeZone).toBe('America/Santiago');
  });

  it('PUT reschedule: both times in clinic time', async () => {
    mockAppointment.update.mockImplementation(async (args) => appointmentRow(TEN_AM_SANTIAGO, args));

    const response = await PUT(
      jsonRequest('PUT', { dateTime: TEN_AM_SANTIAGO.toISOString() }),
      params
    );

    expect(response.status).toBe(200);
    const email = mockSendRescheduled.mock.calls[0][0];
    expect(email.data.previousTime).toBe('20:00');
    expect(email.data.newTime).toBe('10:00');
    expect(email.timeZone).toBe('America/Santiago');
  });

  it('PUT cancel: cancellation shows clinic time', async () => {
    mockAppointment.update.mockImplementation(async (args) =>
      appointmentRow(EIGHT_PM_SANTIAGO, args, 'CANCELLED_CLINIC')
    );

    const response = await PUT(jsonRequest('PUT', { status: 'CANCELLED_CLINIC' }), params);

    expect(response.status).toBe(200);
    const email = mockSendCancellation.mock.calls[0][0];
    expect(email.data.appointmentTime).toBe('20:00');
    expect(email.timeZone).toBe('America/Santiago');
  });

  it('DELETE: cancellation shows clinic time', async () => {
    mockAppointment.update.mockImplementation(async (args) =>
      appointmentRow(EIGHT_PM_SANTIAGO, args, 'CANCELLED_CLINIC')
    );

    const response = await DELETE(jsonRequest('DELETE'), params);

    expect(response.status).toBe(200);
    const email = mockSendCancellation.mock.calls[0][0];
    expect(email.data.appointmentTime).toBe('20:00');
    expect(email.timeZone).toBe('America/Santiago');
  });
});
