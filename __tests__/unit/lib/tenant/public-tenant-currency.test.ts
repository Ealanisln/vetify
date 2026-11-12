/**
 * Public pages must format money in the clinic's currency, so the public
 * tenant payload carries TenantSettings.currencyCode.
 */
jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: { findUnique: jest.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { getTenantBySlug } from '@/lib/tenant';

const findUnique = prisma.tenant.findUnique as jest.Mock;

const dbTenant = (tenantSettings: { currencyCode: string } | null) => ({
  id: 'tenant-1',
  name: 'Clínica',
  slug: 'clinica',
  publicServices: null,
  publicHours: null,
  publicImages: null,
  publicSocialMedia: null,
  publicTheme: null,
  tenantSubscription: null,
  tenantSettings,
});

describe('getTenantBySlug currency', () => {
  beforeEach(() => jest.clearAllMocks());

  it("exposes the clinic's currency code", async () => {
    findUnique.mockResolvedValue(dbTenant({ currencyCode: 'CLP' }));

    const tenant = await getTenantBySlug('clinica');

    expect(tenant?.currencyCode).toBe('CLP');
    expect(tenant).not.toHaveProperty('tenantSettings');
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          tenantSettings: { select: expect.objectContaining({ currencyCode: true }) },
        }),
      })
    );
  });

  it('defaults to MXN when the tenant has no settings row', async () => {
    findUnique.mockResolvedValue(dbTenant(null));

    const tenant = await getTenantBySlug('clinica');

    expect(tenant?.currencyCode).toBe('MXN');
  });
});
