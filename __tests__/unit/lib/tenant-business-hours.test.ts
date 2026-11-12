/**
 * New tenants must be bookable from day one. Without BusinessHours rows the
 * appointment form and public booking treated every day as closed until the
 * owner happened to open the Horarios tab.
 */

jest.mock('@/lib/prisma', () => {
  const tx = {
    tenant: { create: jest.fn().mockResolvedValue({ id: 'tenant-1' }) },
    tenantSubscription: { create: jest.fn().mockResolvedValue({}) },
    tenantSettings: { create: jest.fn().mockResolvedValue({ id: 'settings-1' }) },
    businessHours: { createMany: jest.fn().mockResolvedValue({ count: 7 }) },
    tenantUsageStats: { create: jest.fn().mockResolvedValue({}) },
    role: { create: jest.fn().mockResolvedValue({ id: 'role-1' }) },
    user: {
      findUnique: jest.fn().mockResolvedValue({
        name: 'Ana Ruiz',
        email: 'ana@clinica.test',
        firstName: 'Ana',
        lastName: 'Ruiz',
      }),
      update: jest.fn().mockResolvedValue({ id: 'user-1', tenant: {} }),
    },
    userRole: { create: jest.fn().mockResolvedValue({}) },
    staff: { create: jest.fn().mockResolvedValue({}) },
  };

  return {
    prisma: {
      plan: { findFirst: jest.fn().mockResolvedValue({ id: 'plan-1', key: 'BASICO' }) },
      $transaction: jest.fn(async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
      __tx: tx,
    },
  };
});

import { prisma } from '@/lib/prisma';
import { createTenantWithDefaults } from '@/lib/tenant';

const txMock = (prisma as unknown as {
  __tx: { businessHours: { createMany: jest.Mock } };
}).__tx;

describe('createTenantWithDefaults business hours', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await createTenantWithDefaults({
      name: 'Clínica Test',
      slug: 'clinica-test',
      userId: 'user-1',
      planKey: 'BASICO',
      billingInterval: 'monthly',
    });
  });

  it('seeds one tenant-level row per day inside the signup transaction', () => {
    expect(txMock.businessHours.createMany).toHaveBeenCalledTimes(1);
    const rows = txMock.businessHours.createMany.mock.calls[0][0].data;

    expect(rows).toHaveLength(7);
    for (const row of rows) {
      expect(row).toEqual(expect.objectContaining({
        tenantId: 'tenant-1',
        tenantSettingsId: 'settings-1',
        startTime: '08:00',
        endTime: '18:00',
        lunchStart: '13:00',
        lunchEnd: '14:00',
        slotDuration: 15,
      }));
      expect(row.locationId).toBeUndefined();
    }
  });

  it('opens Monday to Saturday and closes Sunday', () => {
    const rows = txMock.businessHours.createMany.mock.calls[0][0].data;
    const open = rows.filter((row: { isWorkingDay: boolean }) => row.isWorkingDay)
      .map((row: { dayOfWeek: number }) => row.dayOfWeek);

    expect(open).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
