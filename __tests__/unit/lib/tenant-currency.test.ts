/**
 * Guards the currency a new tenant is created with.
 *
 * TenantSettings.currencyCode shipped with @default("USD") and was written as a
 * hardcoded 'USD' on every creation path, while every money surface in the app
 * rendered MXN. Nothing read the column, so the mismatch stayed invisible — and
 * the first honest reader would have flipped every Mexican clinic to dollars.
 */

jest.mock('@/lib/prisma', () => {
  const tx = {
    tenant: { create: jest.fn().mockResolvedValue({ id: 'tenant-1' }) },
    tenantSubscription: { create: jest.fn().mockResolvedValue({}) },
    tenantSettings: { create: jest.fn().mockResolvedValue({}) },
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
import { CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currency';
import { createTenantWithDefaults } from '@/lib/tenant';

const txMock = (prisma as unknown as {
  __tx: { tenantSettings: { create: jest.Mock } };
}).__tx;

const settingsData = () => txMock.tenantSettings.create.mock.calls[0][0].data;

describe('createTenantWithDefaults currency', () => {
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

  it('creates settings with the shared default currency', () => {
    expect(settingsData().currencyCode).toBe(DEFAULT_CURRENCY);
  });

  it('creates settings in MXN, matching what the UI has always rendered', () => {
    expect(settingsData().currencyCode).toBe('MXN');
  });

  // Regression: this literal is what made the column a landmine.
  it('never writes USD', () => {
    expect(settingsData().currencyCode).not.toBe('USD');
  });

  it('derives the symbol from the currency module instead of hardcoding it', () => {
    expect(settingsData().currencySymbol).toBe(CURRENCIES[DEFAULT_CURRENCY].symbol);
  });
});
