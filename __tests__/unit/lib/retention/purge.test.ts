jest.mock('@/lib/prisma', () => {
  const tx = {
    tenant: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    customer: { count: jest.fn().mockResolvedValue(0) },
    pet: { count: jest.fn().mockResolvedValue(0) },
    medicalHistory: { count: jest.fn().mockResolvedValue(0) },
    appointment: { count: jest.fn().mockResolvedValue(0) },
    sale: { count: jest.fn().mockResolvedValue(0) },
    user: { count: jest.fn().mockResolvedValue(0) },
    securityAuditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  };

  return {
    prisma: {
      tenant: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
      __tx: tx, // expose for tests
    },
  };
});

import { prisma } from '@/lib/prisma';
import { purgeExpiredTenants } from '@/lib/retention/purge';

const findMany = prisma.tenant.findMany as jest.Mock;
const txMock = (prisma as unknown as { __tx: {
  tenant: { findUnique: jest.Mock; delete: jest.Mock };
  securityAuditLog: { create: jest.Mock };
  customer: { count: jest.Mock };
  pet: { count: jest.Mock };
  medicalHistory: { count: jest.Mock };
  appointment: { count: jest.Mock };
  sale: { count: jest.Mock };
  user: { count: jest.Mock };
} }).__tx;

const NOW = new Date('2026-04-28T12:00:00.000Z');
const PAST = new Date('2026-04-27T12:00:00.000Z');

describe('purgeExpiredTenants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty result when no candidates', async () => {
    findMany.mockResolvedValue([]);

    const result = await purgeExpiredTenants(10, NOW);

    expect(result.scanned).toBe(0);
    expect(result.purged).toEqual([]);
    expect(result.remaining).toBe(false);
    expect(txMock.tenant.delete).not.toHaveBeenCalled();
  });

  it('purges tenant when re-check confirms still eligible', async () => {
    findMany.mockResolvedValue([{ id: 't-1', slug: 'clinic' }]);
    txMock.tenant.findUnique.mockResolvedValue({
      id: 't-1',
      subscriptionStatus: 'CANCELED',
      dataRetentionEndsAt: PAST,
    });

    const result = await purgeExpiredTenants(10, NOW);

    expect(result.purged).toEqual(['t-1']);
    expect(result.skippedReactivated).toEqual([]);
    expect(txMock.securityAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'data_delete',
          tenantId: 't-1',
          riskLevel: 'critical',
          success: true,
          resource: 'Tenant',
        }),
      }),
    );
    expect(txMock.tenant.delete).toHaveBeenCalledWith({ where: { id: 't-1' } });
  });

  it('skips when re-check finds tenant reactivated (status flipped)', async () => {
    findMany.mockResolvedValue([{ id: 't-1', slug: 'clinic' }]);
    txMock.tenant.findUnique.mockResolvedValue({
      id: 't-1',
      subscriptionStatus: 'ACTIVE',
      dataRetentionEndsAt: null,
    });

    const result = await purgeExpiredTenants(10, NOW);

    expect(result.purged).toEqual([]);
    expect(result.skippedReactivated).toEqual(['t-1']);
    expect(txMock.tenant.delete).not.toHaveBeenCalled();
    expect(txMock.securityAuditLog.create).not.toHaveBeenCalled();
  });

  it('skips when re-check finds dataRetentionEndsAt cleared', async () => {
    findMany.mockResolvedValue([{ id: 't-1', slug: 'clinic' }]);
    txMock.tenant.findUnique.mockResolvedValue({
      id: 't-1',
      subscriptionStatus: 'CANCELED', // status unchanged but timer cleared
      dataRetentionEndsAt: null,
    });

    const result = await purgeExpiredTenants(10, NOW);

    expect(result.skippedReactivated).toEqual(['t-1']);
    expect(txMock.tenant.delete).not.toHaveBeenCalled();
  });

  it('captures forensic snapshot in audit log details', async () => {
    findMany.mockResolvedValue([{ id: 't-1', slug: 'clinic' }]);
    txMock.tenant.findUnique
      .mockResolvedValueOnce({
        id: 't-1',
        subscriptionStatus: 'CANCELED',
        dataRetentionEndsAt: PAST,
      })
      .mockResolvedValueOnce({
        id: 't-1',
        name: 'Clinica Patitas',
        slug: 'patitas',
        canceledAt: new Date('2026-01-28'),
        dataRetentionEndsAt: PAST,
      });
    txMock.customer.count.mockResolvedValue(120);
    txMock.pet.count.mockResolvedValue(340);
    txMock.medicalHistory.count.mockResolvedValue(2100);

    await purgeExpiredTenants(10, NOW);

    const auditCall = txMock.securityAuditLog.create.mock.calls[0][0];
    expect(auditCall.data.details.snapshot).toMatchObject({
      tenantId: 't-1',
      tenantName: 'Clinica Patitas',
      tenantSlug: 'patitas',
      counts: expect.objectContaining({
        customers: 120,
        pets: 340,
        medicalHistories: 2100,
      }),
    });
  });

  it('isolates per-tenant failures and continues', async () => {
    findMany.mockResolvedValue([
      { id: 't-fail', slug: 'a' },
      { id: 't-ok', slug: 'b' },
    ]);
    txMock.tenant.findUnique
      .mockResolvedValueOnce({
        id: 't-fail',
        subscriptionStatus: 'CANCELED',
        dataRetentionEndsAt: PAST,
      })
      .mockResolvedValueOnce({
        id: 't-fail',
        name: 'X', slug: 'a',
        canceledAt: new Date(), dataRetentionEndsAt: PAST,
      })
      .mockResolvedValueOnce({
        id: 't-ok',
        subscriptionStatus: 'CANCELED',
        dataRetentionEndsAt: PAST,
      })
      .mockResolvedValueOnce({
        id: 't-ok',
        name: 'Y', slug: 'b',
        canceledAt: new Date(), dataRetentionEndsAt: PAST,
      });
    txMock.tenant.delete
      .mockRejectedValueOnce(new Error('FK violation'))
      .mockResolvedValueOnce({ id: 't-ok' });

    const result = await purgeExpiredTenants(10, NOW);

    expect(result.purged).toEqual(['t-ok']);
    expect(result.failed).toEqual([
      { tenantId: 't-fail', error: 'FK violation' },
    ]);
  });

  it('caps at limit and reports remaining=true when overflow', async () => {
    const many = Array.from({ length: 4 }, (_, i) => ({
      id: `t-${i}`,
      slug: `s-${i}`,
    }));
    findMany.mockResolvedValue(many);
    txMock.tenant.findUnique.mockResolvedValue({
      id: 'any',
      subscriptionStatus: 'CANCELED',
      dataRetentionEndsAt: PAST,
    });

    const result = await purgeExpiredTenants(3, NOW);

    expect(result.scanned).toBe(3);
    expect(result.purged.length).toBeLessThanOrEqual(3);
    expect(result.remaining).toBe(true);
  });
});
