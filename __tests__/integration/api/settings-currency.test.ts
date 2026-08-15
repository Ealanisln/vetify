 

const mockRequireActiveSubscription = jest.fn();
const mockRequirePermission = jest.fn();

jest.mock('@/lib/auth', () => ({
  requireActiveSubscription: () => mockRequireActiveSubscription(),
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenantSettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    sale: { count: jest.fn() },
  },
}));

const mockLogAuditEvent = jest.fn();
jest.mock('@/lib/security/audit-logger', () => ({
  extractAuditInfo: () => ({
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
    endpoint: '/api/settings/currency',
    method: 'PUT',
  }),
  logAuditEvent: (...args: unknown[]) => mockLogAuditEvent(...args),
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET, PUT } from '@/app/api/settings/currency/route';

const settingsMock = prisma.tenantSettings as unknown as {
  findUnique: jest.Mock;
  upsert: jest.Mock;
};
const saleMock = prisma.sale as unknown as { count: jest.Mock };

const putRequest = (body: unknown) =>
  new NextRequest('http://localhost/api/settings/currency', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

describe('/api/settings/currency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    mockRequireActiveSubscription.mockResolvedValue({ tenant: { id: 'tenant-1' } });
    mockRequirePermission.mockResolvedValue({
      tenant: { id: 'tenant-1' },
      user: { id: 'user-1' },
    });
    settingsMock.upsert.mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET', () => {
    it("returns the tenant's currency, tax rate and sale count", async () => {
      settingsMock.findUnique.mockResolvedValue({
        currencyCode: 'COP',
        taxRate: 0.19,
        currencyConfirmed: true,
      });
      saleMock.count.mockResolvedValue(143);

      const data = await (await GET()).json();

      expect(data).toEqual({
        currencyCode: 'COP',
        currencySymbol: '$',
        taxRate: 0.19,
        currencyConfirmed: true,
        saleCount: 143,
        billingCurrency: 'MXN',
      });
    });

    it('exposes the tenant billing currency as read-only info', async () => {
      mockRequireActiveSubscription.mockResolvedValue({
        tenant: { id: 'tenant-1', billingCurrency: 'CLP' },
      });
      settingsMock.findUnique.mockResolvedValue({
        currencyCode: 'CLP',
        taxRate: 0.19,
        currencyConfirmed: true,
      });
      saleMock.count.mockResolvedValue(0);

      const data = await (await GET()).json();

      expect(data.billingCurrency).toBe('CLP');
    });

    it('falls back to defaults when the tenant has no settings row', async () => {
      settingsMock.findUnique.mockResolvedValue(null);
      saleMock.count.mockResolvedValue(0);

      const data = await (await GET()).json();

      expect(data.currencyCode).toBe('MXN');
      expect(data.taxRate).toBe(0.16);
      expect(data.currencyConfirmed).toBe(false);
    });

    it('falls back when the stored code is unusable rather than echoing garbage', async () => {
      settingsMock.findUnique.mockResolvedValue({
        currencyCode: 'XXX',
        taxRate: 0.16,
        currencyConfirmed: false,
      });
      saleMock.count.mockResolvedValue(0);

      const data = await (await GET()).json();

      expect(data.currencyCode).toBe('MXN');
    });
  });

  describe('PUT validation', () => {
    it('rejects an unsupported currency', async () => {
      const res = await PUT(putRequest({ currencyCode: 'BTC', taxRate: 0.16 }));

      expect(res.status).toBe(400);
      expect(settingsMock.upsert).not.toHaveBeenCalled();
    });

    it('rejects a tax rate outside 0..1', async () => {
      const res = await PUT(putRequest({ currencyCode: 'MXN', taxRate: 19 }));

      expect(res.status).toBe(400);
      expect(settingsMock.upsert).not.toHaveBeenCalled();
    });
  });

  describe('PUT relabel policy', () => {
    it('demands confirmation when changing currency with sales on record', async () => {
      settingsMock.findUnique.mockResolvedValue({ currencyCode: 'MXN' });
      saleMock.count.mockResolvedValue(143);

      const res = await PUT(putRequest({ currencyCode: 'COP', taxRate: 0.19 }));
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.code).toBe('CONFIRM_RELABEL_REQUIRED');
      expect(data.saleCount).toBe(143);
      expect(data.from).toBe('MXN');
      expect(data.to).toBe('COP');
      expect(settingsMock.upsert).not.toHaveBeenCalled();
    });

    it('applies the change once confirmed', async () => {
      settingsMock.findUnique.mockResolvedValue({ currencyCode: 'MXN' });
      saleMock.count.mockResolvedValue(143);

      const res = await PUT(
        putRequest({ currencyCode: 'COP', taxRate: 0.19, confirmRelabel: true })
      );

      expect(res.status).toBe(200);
      expect(settingsMock.upsert).toHaveBeenCalledTimes(1);
      expect(settingsMock.upsert.mock.calls[0][0].update).toMatchObject({
        currencyCode: 'COP',
        currencyConfirmed: true,
        taxRate: 0.19,
      });
    });

    /**
     * The common case is a clinic that picked wrong at signup and notices on day
     * one. Hard-blocking after the first sale would punish exactly them.
     */
    it('does not demand confirmation when the tenant has no sales yet', async () => {
      settingsMock.findUnique.mockResolvedValue({ currencyCode: 'MXN' });
      saleMock.count.mockResolvedValue(0);

      const res = await PUT(putRequest({ currencyCode: 'COP', taxRate: 0.19 }));

      expect(res.status).toBe(200);
      expect(settingsMock.upsert).toHaveBeenCalledTimes(1);
    });

    it('does not demand confirmation when only the tax rate changes', async () => {
      settingsMock.findUnique.mockResolvedValue({ currencyCode: 'MXN' });
      saleMock.count.mockResolvedValue(143);

      const res = await PUT(putRequest({ currencyCode: 'MXN', taxRate: 0.08 }));

      expect(res.status).toBe(200);
      expect(saleMock.count).not.toHaveBeenCalled();
    });

    it('confirms guessed defaults even when nothing changes', async () => {
      settingsMock.findUnique.mockResolvedValue({ currencyCode: 'MXN' });

      const res = await PUT(putRequest({ currencyCode: 'MXN', taxRate: 0.16 }));

      expect(res.status).toBe(200);
      expect(settingsMock.upsert.mock.calls[0][0].update.currencyConfirmed).toBe(true);
    });
  });

  describe('PUT auditing', () => {
    it('audits a currency change', async () => {
      settingsMock.findUnique.mockResolvedValue({ currencyCode: 'MXN' });
      saleMock.count.mockResolvedValue(0);

      await PUT(putRequest({ currencyCode: 'COP', taxRate: 0.19 }));

      expect(mockLogAuditEvent).toHaveBeenCalledTimes(1);
      expect(mockLogAuditEvent.mock.calls[0][0]).toMatchObject({
        eventType: 'data_update',
        resource: 'tenant_currency',
        resourceId: 'tenant-1',
        details: { from: 'MXN', to: 'COP', relabeledOnly: true },
        riskLevel: 'medium',
      });
    });

    it('does not audit a tax-rate-only change', async () => {
      settingsMock.findUnique.mockResolvedValue({ currencyCode: 'MXN' });

      await PUT(putRequest({ currencyCode: 'MXN', taxRate: 0.08 }));

      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  it('returns 403 when the caller lacks settings write permission', async () => {
    mockRequirePermission.mockRejectedValue(new Error('Access denied'));

    const res = await PUT(putRequest({ currencyCode: 'COP', taxRate: 0.19 }));

    expect(res.status).toBe(403);
    expect(settingsMock.upsert).not.toHaveBeenCalled();
  });

  describe('PUT billing currency lock', () => {
    it('ignores attempts to change the billing currency through this endpoint', async () => {
      settingsMock.findUnique.mockResolvedValue({ currencyCode: 'MXN' });

      const res = await PUT(
        putRequest({ currencyCode: 'MXN', taxRate: 0.16, billingCurrency: 'USD' })
      );

      expect(res.status).toBe(200);
      // Display settings only — the charge currency never goes through here
      const upsertArgs = settingsMock.upsert.mock.calls[0][0];
      expect(upsertArgs.update).not.toHaveProperty('billingCurrency');
      expect(upsertArgs.create).not.toHaveProperty('billingCurrency');
    });
  });
});
