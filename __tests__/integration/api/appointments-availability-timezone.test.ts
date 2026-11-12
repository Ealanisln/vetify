/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Clinic-timezone regression tests for /api/appointments/availability.
 *
 * Production runs in UTC. Slots used to be built with server-local
 * `new Date(y, m, d, h, min)` and serialized without an offset, so a clinic
 * in America/Mexico_City saw its "09:00" slot saved at 15:00Z. These tests
 * pin every expectation to explicit instants so they hold in any process TZ.
 */
import { prismaMock } from '../../mocks/prisma';
import { GET, POST } from '@/app/api/appointments/availability/route';

jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

import { requireAuth } from '@/lib/auth';

const mockRequireAuth = requireAuth as jest.Mock;

const TENANT_ID = 'tenant-tz';
// 2026-11-16 is a Monday. Mexico City is UTC-6 all year (no DST since 2022).
const MONDAY = '2026-11-16';

interface DayRow {
  dayOfWeek: number;
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  lunchStart: string | null;
  lunchEnd: string | null;
  slotDuration: number;
}

function mondayOnly(overrides: Partial<DayRow> = {}): DayRow[] {
  return [
    {
      dayOfWeek: 1,
      isWorkingDay: true,
      startTime: '09:00',
      endTime: '18:00',
      lunchStart: null,
      lunchEnd: null,
      slotDuration: 30,
      ...overrides,
    },
  ];
}

/**
 * Settings mock that honours the `businessHours.where.dayOfWeek` filter, so a
 * route that asks for the wrong weekday gets no hours back.
 */
function mockSettings(rows: DayRow[], timezone = 'UTC') {
  prismaMock.tenantSettings.findUnique.mockImplementation((async (args: any) => {
    const dayOfWeek = args?.include?.businessHours?.where?.dayOfWeek;
    return {
      id: 'settings-tz',
      tenantId: TENANT_ID,
      timezone,
      defaultSlotDuration: 30,
      businessHours:
        dayOfWeek === undefined ? rows : rows.filter((r) => r.dayOfWeek === dayOfWeek),
    };
  }) as any);
}

function getRequest(params: Record<string, string>): Request {
  const url = new URL('http://localhost:3000/api/appointments/availability');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

function postRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/appointments/availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

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

describe('Appointments availability API in the clinic timezone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      user: { id: 'user-1' },
      tenant: { id: TENANT_ID, countryCode: 'MX' },
    });
    prismaMock.appointment.findMany.mockResolvedValue([]);
    prismaMock.appointment.findFirst.mockResolvedValue(null);
    useClock('2026-11-10T18:00:00.000Z');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('GET', () => {
    it('serializes the 09:00 clinic slot as the absolute instant 15:00Z', async () => {
      mockSettings(mondayOnly());

      const res = await GET(getRequest({ date: MONDAY }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.timeZone).toBe('America/Mexico_City');
      expect(body.data.availableSlots[0]).toEqual(
        expect.objectContaining({
          dateTime: '2026-11-16T15:00:00.000Z',
          time: '09:00',
          period: 'morning',
        })
      );
      const last = body.data.availableSlots[body.data.availableSlots.length - 1];
      expect(last.dateTime).toBe('2026-11-16T23:30:00.000Z');
      expect(last.time).toBe('17:30');
    });

    it('blocks the 09:00 clinic slot when an appointment exists at 15:00Z', async () => {
      mockSettings(mondayOnly());
      prismaMock.appointment.findMany.mockResolvedValue([
        { id: 'appt-1', dateTime: new Date('2026-11-16T15:00:00.000Z'), duration: 30, staffId: null },
      ] as any);

      const res = await GET(getRequest({ date: MONDAY }));
      const body = await res.json();
      const times = body.data.availableSlots.map((s: { time: string }) => s.time);

      expect(times).not.toContain('09:00');
      // The slot that starts when the appointment ends is free (half-open overlap)
      expect(times).toContain('09:30');
      // 15:00 clinic time (21:00Z) has nothing booked
      expect(times).toContain('15:00');
    });

    it('queries existing appointments over the clinic day, not the UTC day', async () => {
      mockSettings(mondayOnly());

      await GET(getRequest({ date: MONDAY }));

      const where = prismaMock.appointment.findMany.mock.calls[0][0]!.where as any;
      expect(where.dateTime.gte.toISOString()).toBe('2026-11-16T06:00:00.000Z');
      expect(where.dateTime.lte.toISOString()).toBe('2026-11-17T05:59:59.999Z');
    });

    it('only hides slots that are past in clinic time for today', async () => {
      // 09:50 in Mexico City
      useClock('2026-11-16T15:50:00.000Z');
      mockSettings(mondayOnly());

      const res = await GET(getRequest({ date: MONDAY }));
      const body = await res.json();
      const times = body.data.availableSlots.map((s: { time: string }) => s.time);

      expect(times).not.toContain('09:30');
      expect(times[0]).toBe('10:00');
    });

    it('treats a clinic Monday evening as Monday even when UTC is already Tuesday', async () => {
      // 21:00 Monday in Mexico City = 03:00Z Tuesday
      useClock('2026-11-17T03:00:00.000Z');
      mockSettings(mondayOnly());

      const res = await GET(getRequest({ date: MONDAY }));
      const body = await res.json();

      expect(body.data.workingDay).toBe(true);
      // All of Monday's slots are in the past for the clinic
      expect(body.data.availableSlots).toEqual([]);
    });

    it('prefers a non-UTC TenantSettings.timezone over the country default', async () => {
      mockSettings(mondayOnly(), 'America/Bogota'); // UTC-5

      const res = await GET(getRequest({ date: MONDAY }));
      const body = await res.json();

      expect(body.data.timeZone).toBe('America/Bogota');
      expect(body.data.availableSlots[0].dateTime).toBe('2026-11-16T14:00:00.000Z');
    });
  });

  describe('POST', () => {
    it('accepts 17:30 clinic time (23:30Z) as within business hours', async () => {
      mockSettings(mondayOnly());

      const res = await POST(postRequest({ dateTime: '2026-11-16T23:30:00.000Z', duration: 30 }));
      const body = await res.json();

      expect(body.available).toBe(true);
      expect(body.dateTime).toBe('2026-11-16T23:30:00.000Z');
    });

    it('rejects 08:30 clinic time (14:30Z) as outside business hours', async () => {
      mockSettings(mondayOnly());

      const res = await POST(postRequest({ dateTime: '2026-11-16T14:30:00.000Z', duration: 30 }));
      const body = await res.json();

      expect(body.available).toBe(false);
      expect(body.error).toBe('Fuera del horario laboral');
    });

    it('honours the opening minute (09:30 start rejects 09:00)', async () => {
      mockSettings(mondayOnly({ startTime: '09:30' }));

      const res = await POST(postRequest({ dateTime: '2026-11-16T15:00:00.000Z', duration: 30 }));
      const body = await res.json();

      expect(body.available).toBe(false);
      expect(body.error).toBe('Fuera del horario laboral');
    });

    it('uses the clinic weekday (Monday 19:00 local is not Tuesday)', async () => {
      mockSettings(mondayOnly({ endTime: '20:00' }));

      // 19:00 Monday in Mexico City = 01:00Z Tuesday
      const res = await POST(postRequest({ dateTime: '2026-11-17T01:00:00.000Z', duration: 30 }));
      const body = await res.json();

      expect(body.available).toBe(true);
    });
  });
});
