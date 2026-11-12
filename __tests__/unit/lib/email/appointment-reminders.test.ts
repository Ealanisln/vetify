/**
 * @jest-environment node
 *
 * Appointment reminders run from a daily cron at 07:00 UTC. They must pick
 * the appointments on the NEXT clinic-local calendar day, at most once per
 * appointment ever, with times shown in the clinic timezone.
 *
 * Prisma is replaced by a small in-memory fake that applies the `where`
 * filters the code sends (and throws on filters it does not understand), so
 * a query that cannot match a real row fails here too. Sent reminders are
 * recorded through the real notification logger, so the dedupe query is
 * checked against the EmailLog rows the app actually writes.
 *
 * Run with TZ=UTC to mirror the server; the assertions also hold in any
 * machine timezone because the code must not depend on it.
 */

type Filter = Record<string, unknown>;

interface FakeAppointment {
  id: string;
  tenantId: string;
  dateTime: Date;
  status: string;
  reason: string;
  customer: { id: string; name: string; email: string | null };
  pet: { id: string; name: string };
  staff: { id: string; name: string } | null;
  tenant: Record<string, unknown>;
}

interface FakeEmailLog {
  tenantId: string;
  recipientEmail: string;
  template: string;
  status: string;
  metadata: { data?: Record<string, unknown> };
  createdAt: Date;
}

const db = {
  appointments: [] as FakeAppointment[],
  emailLogs: [] as FakeEmailLog[],
  notificationPreferences: new Map<string, Record<string, unknown>>(),
};

function compare(value: unknown, condition: unknown): boolean {
  if (condition === null || typeof condition !== 'object' || condition instanceof Date) {
    const a = value instanceof Date ? value.getTime() : value;
    const b = condition instanceof Date ? condition.getTime() : condition;
    return a === b;
  }
  for (const [op, operand] of Object.entries(condition as Filter)) {
    const v = value instanceof Date ? value.getTime() : value;
    const o = operand instanceof Date ? operand.getTime() : operand;
    switch (op) {
      case 'gte': if (!((v as number) >= (o as number))) return false; break;
      case 'gt': if (!((v as number) > (o as number))) return false; break;
      case 'lte': if (!((v as number) <= (o as number))) return false; break;
      case 'lt': if (!((v as number) < (o as number))) return false; break;
      case 'in': if (!(o as unknown[]).includes(v)) return false; break;
      case 'notIn': if ((o as unknown[]).includes(v)) return false; break;
      case 'not': if (v === o) return false; break;
      case 'equals': if (v !== o) return false; break;
      default: throw new Error(`Fake prisma: unsupported operator ${op}`);
    }
  }
  return true;
}

function matches(row: Record<string, unknown>, where: Filter = {}): boolean {
  for (const [key, condition] of Object.entries(where)) {
    if (key === 'metadata') {
      const { path, equals } = condition as { path: string[]; equals: unknown };
      let value: unknown = row.metadata;
      for (const segment of path) {
        value = (value as Record<string, unknown> | undefined)?.[segment];
      }
      if (value !== equals) return false;
      continue;
    }
    if (!(key in row)) throw new Error(`Fake prisma: unsupported filter ${key}`);
    if (!compare(row[key], condition)) return false;
  }
  return true;
}

function pickTenant(tenant: Record<string, unknown>, select: Filter): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(select)) {
    if (select[key] && key in tenant) out[key] = tenant[key];
  }
  return out;
}

jest.mock('@/lib/prisma', () => ({
  prisma: {
    appointment: {
      findMany: jest.fn(async (args: { where?: Filter; include?: { tenant?: { select: Filter } } }) =>
        db.appointments
          .filter((row) => matches(row as unknown as Record<string, unknown>, args.where))
          .map((row) => ({
            ...row,
            tenant: args.include?.tenant
              ? pickTenant(row.tenant, args.include.tenant.select)
              : undefined,
          }))
      ),
    },
    emailLog: {
      findFirst: jest.fn(async (args: { where?: Filter }) =>
        db.emailLogs.find((row) => matches(row as unknown as Record<string, unknown>, args.where)) ?? null
      ),
      create: jest.fn(async (args: { data: Omit<FakeEmailLog, 'createdAt'> }) => {
        const row = { ...args.data, createdAt: new Date() } as FakeEmailLog;
        db.emailLogs.push(row);
        return row;
      }),
    },
    tenantSettings: {
      findUnique: jest.fn(async (args: { where: { tenantId: string } }) => {
        const prefs = db.notificationPreferences.get(args.where.tenantId);
        return prefs ? { notificationPreferences: prefs } : null;
      }),
    },
  },
}));

// The global setup stubs @prisma/client without the EmailTemplate enum the
// logger needs; the real module only defines enums until a client is created.
jest.mock('@prisma/client', () => jest.requireActual('@prisma/client'));

jest.mock('@/lib/email/email-service', () => {
  const { logEmailSend } = jest.requireActual('@/lib/notifications/notification-logger');
  return {
    sendTreatmentReminder: jest.fn(),
    sendAppointmentReminder: jest.fn(async (data: unknown) => {
      const result = { success: true, messageId: `msg-${Math.random()}` };
      await logEmailSend(data, result);
      return result;
    }),
  };
});

import { processAppointmentReminders } from '@/lib/email/reminder-alerts';
import { sendAppointmentReminder } from '@/lib/email/email-service';

const mockSend = sendAppointmentReminder as jest.Mock;

// 2026-11-12 07:00 UTC = 01:00 in Mexico City (UTC-6, no DST)
const CRON_RUN = new Date('2026-11-12T07:00:00.000Z');

const MX_TENANT = {
  id: 'tenant-mx',
  name: 'Clínica Norte',
  publicPhone: '5550000000',
  publicAddress: 'Av. Siempre Viva 1',
  countryCode: 'MX',
  tenantSettings: { timezone: 'UTC' }, // signup placeholder: zone comes from country
};

let seq = 0;
function appointment(dateTime: string, overrides: Partial<FakeAppointment> = {}): FakeAppointment {
  seq += 1;
  return {
    id: `apt-${seq}`,
    tenantId: MX_TENANT.id,
    dateTime: new Date(dateTime),
    status: 'SCHEDULED',
    reason: 'Consulta general',
    customer: { id: `cust-${seq}`, name: 'Ana Pérez', email: `ana${seq}@example.test` },
    pet: { id: `pet-${seq}`, name: 'Firulais' },
    staff: { id: 'staff-1', name: 'Dra. López' },
    tenant: MX_TENANT,
    ...overrides,
  };
}

beforeEach(() => {
  jest.useFakeTimers({ now: CRON_RUN, doNotFake: ['nextTick', 'setImmediate'] });
  db.appointments = [];
  db.emailLogs = [];
  db.notificationPreferences.clear();
  mockSend.mockClear();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('processAppointmentReminders', () => {
  it('reminds an appointment tomorrow at 10:00 clinic time exactly once', async () => {
    // Tomorrow (Nov 13) 10:00 in Mexico City = 16:00 UTC
    db.appointments = [appointment('2026-11-13T16:00:00.000Z')];

    const first = await processAppointmentReminders();

    expect(first.success).toBe(true);
    expect(first.emailsSent).toBe(1);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const email = mockSend.mock.calls[0][0];
    expect(email.data.appointmentTime).toBe('10:00');
    expect(email.timeZone).toBe('America/Mexico_City');

    const second = await processAppointmentReminders();

    expect(second.emailsSent).toBe(0);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('includes evening appointments of the next clinic day (next UTC day)', async () => {
    // Nov 13 19:30 in Mexico City = Nov 14 01:30 UTC
    db.appointments = [appointment('2026-11-14T01:30:00.000Z')];

    const result = await processAppointmentReminders();

    expect(result.emailsSent).toBe(1);
    expect(mockSend.mock.calls[0][0].data.appointmentTime).toBe('19:30');
  });

  it('skips appointments later today and the day after tomorrow', async () => {
    db.appointments = [
      appointment('2026-11-12T22:00:00.000Z'), // today 16:00 local
      appointment('2026-11-14T16:00:00.000Z'), // Nov 14 10:00 local
    ];

    const result = await processAppointmentReminders();

    expect(result.emailsSent).toBe(0);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('skips cancelled and no-show appointments', async () => {
    db.appointments = [
      appointment('2026-11-13T16:00:00.000Z', { status: 'CANCELLED_CLIENT' }),
      appointment('2026-11-13T17:00:00.000Z', { status: 'CANCELLED_CLINIC' }),
      appointment('2026-11-13T18:00:00.000Z', { status: 'NO_SHOW' }),
      appointment('2026-11-13T19:00:00.000Z', { status: 'CONFIRMED' }),
    ];

    const result = await processAppointmentReminders();

    expect(result.emailsSent).toBe(1);
    expect(mockSend.mock.calls[0][0].data.appointmentTime).toBe('13:00');
  });

  it('skips customers without email', async () => {
    db.appointments = [
      appointment('2026-11-13T16:00:00.000Z', {
        customer: { id: 'cust-x', name: 'Sin Correo', email: null },
      }),
    ];

    const result = await processAppointmentReminders();

    expect(result.emailsSent).toBe(0);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('honors the tenant appointmentReminder preference', async () => {
    db.notificationPreferences.set(MX_TENANT.id, { appointmentReminder: false });
    db.appointments = [appointment('2026-11-13T16:00:00.000Z')];

    const result = await processAppointmentReminders();

    expect(result.emailsSent).toBe(0);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('uses each clinic\'s own calendar day', async () => {
    const chileTenant = {
      ...MX_TENANT,
      id: 'tenant-cl',
      countryCode: 'CL',
      tenantSettings: null,
    };
    // 07:00 UTC = 04:00 in Santiago (UTC-3 in November), so "tomorrow" is Nov 13 there too.
    // Nov 13 22:00 Santiago = Nov 14 01:00 UTC
    db.appointments = [
      appointment('2026-11-14T01:00:00.000Z', { tenantId: chileTenant.id, tenant: chileTenant }),
    ];

    const result = await processAppointmentReminders();

    expect(result.emailsSent).toBe(1);
    const email = mockSend.mock.calls[0][0];
    expect(email.timeZone).toBe('America/Santiago');
    expect(email.data.appointmentTime).toBe('22:00');
  });

  it('retries an appointment whose previous reminder failed', async () => {
    const apt = appointment('2026-11-13T16:00:00.000Z');
    db.appointments = [apt];
    db.emailLogs = [
      {
        tenantId: apt.tenantId,
        recipientEmail: apt.customer.email as string,
        template: 'APPOINTMENT_REMINDER',
        status: 'FAILED',
        metadata: { data: { appointmentId: apt.id } },
        createdAt: new Date(),
      },
    ];

    const result = await processAppointmentReminders();

    expect(result.emailsSent).toBe(1);
  });
});
