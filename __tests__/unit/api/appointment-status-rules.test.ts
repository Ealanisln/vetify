/**
 * @jest-environment node
 *
 * Status changes through the dashboard routes (PUT and DELETE
 * /api/appointments/:id) must follow the allowed-transition map: a completed
 * appointment cannot be cancelled, and cancelling twice is a no-op that
 * sends no second email.
 */

const mockSendCancellation = jest.fn();

jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
  requirePermission: jest.fn(async () => ({ tenant: { id: 'tenant-1' } })),
}));

jest.mock('@/lib/enhanced-settings', () => ({
  shouldSendNotification: jest.fn(async () => true),
}));

jest.mock('@/lib/email/email-service', () => ({
  sendAppointmentCancellation: (...args: unknown[]) => mockSendCancellation(...args),
  sendAppointmentRescheduled: jest.fn(),
}));

jest.mock('@/lib/after-response', () => ({
  runAfterResponse: (task: () => Promise<unknown>) => {
    void task();
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    appointment: {
      findFirst: jest.fn(),
      findMany: jest.fn(async () => []),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { PUT, DELETE } from '@/app/api/appointments/[id]/route';

const mockAppointment = prisma.appointment as unknown as {
  findFirst: jest.Mock;
  findMany: jest.Mock;
  update: jest.Mock;
};

const DATE = new Date('2026-11-20T16:00:00.000Z');

function row(status: string, overrides: Record<string, unknown> = {}) {
  return {
    id: 'apt-1',
    tenantId: 'tenant-1',
    dateTime: DATE,
    duration: 30,
    status,
    reason: 'Consulta',
    notes: null,
    staffId: null,
    customerId: 'cust-1',
    customer: { id: 'cust-1', name: 'Ana', email: 'ana@example.test', phone: null },
    pet: { id: 'pet-1', name: 'Firulais', species: 'dog', breed: null },
    staff: null,
    location: null,
    tenant: { id: 'tenant-1', name: 'Clínica', publicPhone: null, publicAddress: null, countryCode: 'MX', tenantSettings: null },
    ...overrides,
  };
}

function notFoundError() {
  return Object.assign(new Error('No record was found for an update.'), { code: 'P2025' });
}

function putRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/appointments/apt-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const deleteRequest = () => new Request('http://localhost:3000/api/appointments/apt-1', { method: 'DELETE' });
const params = { params: Promise.resolve({ id: 'apt-1' }) };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  mockAppointment.update.mockImplementation(async (args: { data: { status?: string } }) =>
    row(args.data.status ?? 'SCHEDULED')
  );
});

describe('PUT /api/appointments/:id status rules', () => {
  it('rejects cancelling a completed appointment with 409 and a Spanish message', async () => {
    mockAppointment.findFirst.mockResolvedValue(row('COMPLETED'));

    const response = await PUT(putRequest({ status: 'CANCELLED_CLINIC' }), params);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      success: false,
      error: 'No se puede cancelar una cita con estado "Completada".',
    });
    expect(mockAppointment.update).not.toHaveBeenCalled();
    expect(mockSendCancellation).not.toHaveBeenCalled();
  });

  it('rejects moving a cancelled appointment back to scheduled', async () => {
    mockAppointment.findFirst.mockResolvedValue(row('CANCELLED_CLIENT'));

    const response = await PUT(putRequest({ status: 'SCHEDULED' }), params);

    expect(response.status).toBe(409);
    expect(mockAppointment.update).not.toHaveBeenCalled();
  });

  it('cancels a scheduled appointment once, guarding the update on the status it read', async () => {
    mockAppointment.findFirst.mockResolvedValue(row('SCHEDULED'));

    const response = await PUT(putRequest({ status: 'CANCELLED_CLINIC' }), params);

    expect(response.status).toBe(200);
    expect(mockAppointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'apt-1', tenantId: 'tenant-1', status: 'SCHEDULED' },
        data: expect.objectContaining({ status: 'CANCELLED_CLINIC' }),
      })
    );
    expect(mockSendCancellation).toHaveBeenCalledTimes(1);
  });

  it('treats re-cancelling as a no-op: keeps the status and sends no email', async () => {
    mockAppointment.findFirst.mockResolvedValue(row('CANCELLED_CLIENT'));
    mockAppointment.update.mockResolvedValue(row('CANCELLED_CLIENT'));

    const response = await PUT(putRequest({ status: 'CANCELLED_CLINIC' }), params);

    expect(response.status).toBe(200);
    const updateArgs = mockAppointment.update.mock.calls[0]?.[0];
    expect(updateArgs?.data?.status).toBeUndefined();
    expect(mockSendCancellation).not.toHaveBeenCalled();
  });

  it('returns 409 without email when the status changed concurrently', async () => {
    mockAppointment.findFirst.mockResolvedValue(row('SCHEDULED'));
    mockAppointment.update.mockRejectedValue(notFoundError());

    const response = await PUT(putRequest({ status: 'CANCELLED_CLINIC' }), params);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/recarga/i);
    expect(mockSendCancellation).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/appointments/:id status rules', () => {
  it('rejects cancelling a completed appointment with 409', async () => {
    mockAppointment.findFirst.mockResolvedValue(row('COMPLETED'));

    const response = await DELETE(deleteRequest(), params);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('No se puede cancelar una cita con estado "Completada".');
    expect(mockAppointment.update).not.toHaveBeenCalled();
    expect(mockSendCancellation).not.toHaveBeenCalled();
  });

  it('rejects cancelling a no-show appointment with 409', async () => {
    mockAppointment.findFirst.mockResolvedValue(row('NO_SHOW'));

    const response = await DELETE(deleteRequest(), params);

    expect(response.status).toBe(409);
    expect(mockAppointment.update).not.toHaveBeenCalled();
  });

  it('is idempotent for an already cancelled appointment: 200, no update, no email', async () => {
    mockAppointment.findFirst.mockResolvedValue(row('CANCELLED_CLINIC'));

    const response = await DELETE(deleteRequest(), params);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('La cita ya estaba cancelada');
    expect(mockAppointment.update).not.toHaveBeenCalled();
    expect(mockSendCancellation).not.toHaveBeenCalled();
  });

  it('cancels a scheduled appointment once, guarding the update on the status it read', async () => {
    mockAppointment.findFirst.mockResolvedValue(row('SCHEDULED'));

    const response = await DELETE(deleteRequest(), params);

    expect(response.status).toBe(200);
    expect(mockAppointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'apt-1', tenantId: 'tenant-1', status: 'SCHEDULED' },
      })
    );
    expect(mockSendCancellation).toHaveBeenCalledTimes(1);
  });

  it('answers a concurrent double cancel idempotently, without a second email', async () => {
    // First read sees SCHEDULED; the guarded update loses the race; the re-read sees it cancelled
    mockAppointment.findFirst
      .mockResolvedValueOnce(row('SCHEDULED'))
      .mockResolvedValueOnce(row('CANCELLED_CLINIC'));
    mockAppointment.update.mockRejectedValue(notFoundError());

    const response = await DELETE(deleteRequest(), params);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('La cita ya estaba cancelada');
    expect(mockSendCancellation).not.toHaveBeenCalled();
  });
});
