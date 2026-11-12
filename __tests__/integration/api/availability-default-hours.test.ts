/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tenants created before signup seeded BusinessHours have no rows until the
 * owner opens the Horarios tab. Availability must fall back to the default
 * week (Mon-Sat open) instead of reporting every day as closed.
 */
import { prismaMock } from '../../mocks/prisma';
import { createTestTenant } from '../../utils/test-utils';
import { GET as getPublicAvailability } from '@/app/api/public/availability/route';
import { GET as getAppointmentsAvailability } from '@/app/api/appointments/availability/route';

jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
  requirePermission: jest.fn(),
}));

import { requireAuth } from '@/lib/auth';

// A Wednesday two weeks out: never in the past, and its neighbours are also
// default working days, so the assertion does not depend on timezone handling.
function upcomingWednesday(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  while (date.getDay() !== 3) date.setDate(date.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const settingsWithoutRows = {
  id: 'settings-1',
  tenantId: 'tenant-default-hours',
  defaultStartTime: '08:00',
  defaultEndTime: '18:00',
  defaultLunchStart: '13:00',
  defaultLunchEnd: '14:00',
  defaultSlotDuration: 15,
  businessHours: [],
};

describe('availability without BusinessHours rows', () => {
  const tenant = createTestTenant({
    id: 'tenant-default-hours',
    slug: 'default-hours',
    status: 'ACTIVE',
    publicPageEnabled: true,
    publicBookingEnabled: true,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue({ tenant: { id: tenant.id }, user: { id: 'user-1' } });
    prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);
    prismaMock.appointment.findMany.mockResolvedValue([]);
    prismaMock.appointmentRequest.findMany.mockResolvedValue([]);
  });

  describe.each([
    ['settings exist but have no rows', settingsWithoutRows],
    ['settings do not exist', null],
  ])('when %s', (_label, settings) => {
    beforeEach(() => {
      prismaMock.tenantSettings.findUnique.mockResolvedValue(settings as any);
    });

    it('public booking treats a weekday as a working day', async () => {
      const url = new URL('http://localhost:3000/api/public/availability');
      url.searchParams.set('tenantSlug', 'default-hours');
      url.searchParams.set('date', upcomingWednesday());

      const data = await (await getPublicAvailability(new Request(url.toString()))).json();

      expect(data.success).toBe(true);
      expect(data.data.workingDay).not.toBe(false);
      expect(data.data.availableSlots.length).toBeGreaterThan(0);
    });

    it('the appointment form treats a weekday as a working day', async () => {
      const url = new URL('http://localhost:3000/api/appointments/availability');
      url.searchParams.set('date', upcomingWednesday());

      const data = await (await getAppointmentsAvailability(new Request(url.toString()))).json();

      expect(data.success).toBe(true);
      expect(data.data.workingDay).not.toBe(false);
      expect(data.data.availableSlots.length).toBeGreaterThan(0);
    });
  });
});
