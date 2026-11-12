/**
 * @jest-environment node
 *
 * Double-booking detection must use each existing appointment's own
 * duration, and still protect the agenda when no staff member is assigned.
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    appointment: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { findConflictingAppointment } from '@/lib/appointments/conflicts';

const findMany = prisma.appointment.findMany as unknown as jest.Mock;

const at = (time: string) => new Date(`2026-11-20T${time}:00.000Z`);

function existing(time: string, duration: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `apt-${time}`,
    dateTime: at(time),
    duration,
    staffId: 'staff-1',
    staff: { name: 'Dra. López' },
    customer: { name: 'Ana' },
    pet: { name: 'Firulais' },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findConflictingAppointment', () => {
  it('flags a long appointment that started earlier and is still running', async () => {
    // 09:00 for 90 min runs until 10:30, so a 10:00 slot is taken
    findMany.mockResolvedValue([existing('09:00', 90)]);

    const conflict = await findConflictingAppointment({
      tenantId: 'tenant-1',
      start: at('10:00'),
      durationMinutes: 30,
      staffId: 'staff-1',
    });

    expect(conflict?.id).toBe('apt-09:00');
  });

  it('does not flag an earlier appointment that already ended, even if the new one is long', async () => {
    // 09:15 for 30 min ends at 09:45; a 60-minute appointment at 10:00 is free
    findMany.mockResolvedValue([existing('09:15', 30)]);

    const conflict = await findConflictingAppointment({
      tenantId: 'tenant-1',
      start: at('10:00'),
      durationMinutes: 60,
      staffId: 'staff-1',
    });

    expect(conflict).toBeNull();
  });

  it('allows back-to-back appointments', async () => {
    findMany.mockResolvedValue([existing('09:00', 60), existing('10:30', 30)]);

    const conflict = await findConflictingAppointment({
      tenantId: 'tenant-1',
      start: at('10:00'),
      durationMinutes: 30,
      staffId: 'staff-1',
    });

    expect(conflict).toBeNull();
  });

  it('flags an appointment that starts inside the new one', async () => {
    findMany.mockResolvedValue([existing('10:15', 15)]);

    const conflict = await findConflictingAppointment({
      tenantId: 'tenant-1',
      start: at('10:00'),
      durationMinutes: 30,
      staffId: 'staff-1',
    });

    expect(conflict?.id).toBe('apt-10:15');
  });

  it('with a staff member, only looks at that staff member’s active appointments in the tenant', async () => {
    findMany.mockResolvedValue([]);

    await findConflictingAppointment({
      tenantId: 'tenant-1',
      start: at('10:00'),
      durationMinutes: 30,
      staffId: 'staff-1',
      locationId: 'loc-1',
      excludeAppointmentId: 'apt-self',
    });

    const where = findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({
      tenantId: 'tenant-1',
      staffId: 'staff-1',
      id: { not: 'apt-self' },
      status: { notIn: ['CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'] },
      dateTime: { lt: at('10:30') },
    });
    // A vet cannot be in two places, so the location does not narrow the check
    expect(where.OR).toBeUndefined();
    expect(where.locationId).toBeUndefined();
  });

  it('without a staff member, checks every active appointment in the tenant', async () => {
    findMany.mockResolvedValue([existing('10:00', 30, { staffId: 'staff-2', staff: { name: 'Dr. Ruiz' } })]);

    const conflict = await findConflictingAppointment({
      tenantId: 'tenant-1',
      start: at('10:00'),
      durationMinutes: 30,
      staffId: null,
    });

    const where = findMany.mock.calls[0][0].where;
    expect(where.tenantId).toBe('tenant-1');
    expect(where.staffId).toBeUndefined();
    expect(conflict?.id).toBe('apt-10:00');
  });

  it('without a staff member but with a location, checks that location and unlocated appointments', async () => {
    findMany.mockResolvedValue([]);

    await findConflictingAppointment({
      tenantId: 'tenant-1',
      start: at('10:00'),
      durationMinutes: 30,
      staffId: null,
      locationId: 'loc-1',
    });

    const where = findMany.mock.calls[0][0].where;
    expect(where.OR).toEqual([{ locationId: 'loc-1' }, { locationId: null }]);
  });
});
