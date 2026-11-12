/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /api/appointments/business-hours: read-only weekly schedule for the
 * calendar. Any authenticated staff member can read it (the settings
 * endpoint is admin-only), and it never writes.
 */
import { prismaMock } from '../../mocks/prisma';
import { GET } from '@/app/api/appointments/business-hours/route';

jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
  requirePermission: jest.fn(() => {
    throw new Error('Access denied');
  }),
}));

import { requireAuth } from '@/lib/auth';

const mockRequireAuth = requireAuth as jest.Mock;

const TENANT_ID = 'tenant-hours';

function mockSettingsFor(tenantId: string, settings: Record<string, unknown> | null) {
  prismaMock.tenantSettings.findUnique.mockImplementation((async (args: any) =>
    args?.where?.tenantId === tenantId ? settings : null) as any);
}

describe('GET /api/appointments/business-hours', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockRequireAuth.mockResolvedValue({
      user: { id: 'user-1' },
      tenant: { id: TENANT_ID, countryCode: 'CO' },
    });
  });

  it('returns the saved week and the clinic timezone to any authenticated staff member', async () => {
    mockSettingsFor(TENANT_ID, {
      timezone: 'UTC',
      defaultStartTime: '08:00',
      defaultEndTime: '18:00',
      defaultLunchStart: null,
      defaultLunchEnd: null,
      defaultSlotDuration: 30,
      businessHours: [
        { dayOfWeek: 1, isWorkingDay: true, startTime: '09:00', endTime: '21:00' },
        { dayOfWeek: 0, isWorkingDay: false, startTime: '08:00', endTime: '18:00' },
      ],
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    // 'UTC' is the signup placeholder: the country decides the zone
    expect(body.data.timeZone).toBe('America/Bogota');
    expect(body.data.days).toHaveLength(7);
    expect(body.data.days[1]).toEqual({ dayOfWeek: 1, isWorkingDay: true, startTime: '09:00', endTime: '21:00' });
    expect(body.data.days[0].isWorkingDay).toBe(false);
    // Days without a row get the tenant defaults
    expect(body.data.days[2]).toEqual({ dayOfWeek: 2, isWorkingDay: true, startTime: '08:00', endTime: '18:00' });
    expect(prismaMock.tenantSettings.upsert).not.toHaveBeenCalled();
    expect(prismaMock.tenantSettings.create).not.toHaveBeenCalled();
  });

  it('returns the default week for a tenant that never saved hours', async () => {
    mockSettingsFor(TENANT_ID, null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.days.filter((d: any) => d.isWorkingDay).map((d: any) => d.dayOfWeek)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(body.data.days[1]).toEqual(expect.objectContaining({ startTime: '08:00', endTime: '18:00' }));
  });

  it("does not leak another tenant's hours", async () => {
    mockSettingsFor('other-tenant', {
      timezone: 'America/Lima',
      businessHours: [{ dayOfWeek: 1, isWorkingDay: true, startTime: '05:00', endTime: '23:00' }],
    });

    const res = await GET();
    const body = await res.json();

    expect(body.data.days[1].startTime).toBe('08:00');
    expect(body.data.timeZone).toBe('America/Bogota');
  });

  it('answers 500 with a Spanish message when the read fails', async () => {
    prismaMock.tenantSettings.findUnique.mockRejectedValue(new Error('db down'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Error al cargar el horario de la clínica');
  });
});
