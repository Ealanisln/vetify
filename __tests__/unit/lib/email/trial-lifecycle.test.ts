/**
 * @jest-environment node
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    staff: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/lib/email/email-service', () => ({
  sendEmail: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/email-service';
import { processTrialLifecycleEmails } from '@/lib/email/trial-lifecycle';

const mockFindMany = prisma.tenant.findMany as jest.Mock;
const mockUpdate = prisma.tenant.update as jest.Mock;
const mockStaffFindFirst = prisma.staff.findFirst as jest.Mock;
const mockSendEmail = sendEmail as jest.Mock;

/**
 * Simulate Prisma `select` semantics: return only the fields the caller
 * selected. This is what the real client does, so a query that omits a
 * field needed downstream fails here the same way it fails in production.
 */
function applySelect<T extends Record<string, unknown>>(
  row: T,
  select?: Record<string, unknown>
): Partial<T> {
  if (!select) return row;
  const out: Partial<T> = {};
  for (const key of Object.keys(select)) {
    if (select[key] && key in row) {
      out[key as keyof T] = row[key as keyof T];
    }
  }
  return out;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  if (days >= 0) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
}

function mockTenantRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tenant-1',
    name: 'Clínica Test',
    status: 'ACTIVE',
    isTrialPeriod: true,
    trialEndsAt: daysFromNow(2),
    lastTrialCheck: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdate.mockResolvedValue({});
  mockStaffFindFirst.mockResolvedValue({
    email: 'admin@example.test',
    name: 'Admin Test',
  });
  mockSendEmail.mockResolvedValue({ success: true });
});

function primeTenants(rows: Record<string, unknown>[]) {
  mockFindMany.mockImplementation(async (args?: { select?: Record<string, unknown> }) =>
    rows.map((row) => applySelect(row, args?.select))
  );
}

describe('processTrialLifecycleEmails', () => {
  it('sends the expiring email for a tenant inside the warning window', async () => {
    primeTenants([mockTenantRow({ trialEndsAt: daysFromNow(2) })]);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ template: 'trial-expiring', tenantId: 'tenant-1' })
    );
    expect(result.expiringEmailsSent).toBe(1);
    expect(result.expiredEmailsSent).toBe(0);
  });

  it('sends the expired email for a tenant past its trial end', async () => {
    primeTenants([mockTenantRow({ trialEndsAt: daysFromNow(-2) })]);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ template: 'trial-expired', tenantId: 'tenant-1' })
    );
    expect(result.expiredEmailsSent).toBe(1);
  });

  it('respects the 24h cooldown for expiring emails', async () => {
    primeTenants([
      mockTenantRow({
        trialEndsAt: daysFromNow(2),
        lastTrialCheck: new Date(Date.now() - 60 * 60 * 1000), // 1h ago
      }),
    ]);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(result.expiringEmailsSent).toBe(0);
  });

  it('skips tenants outside the warning window', async () => {
    primeTenants([mockTenantRow({ trialEndsAt: daysFromNow(15) })]);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(result.expiringEmailsSent).toBe(0);
    expect(result.expiredEmailsSent).toBe(0);
  });

  it('skips the expired email for trials that expired beyond the resend window', async () => {
    primeTenants([mockTenantRow({ trialEndsAt: daysFromNow(-45) })]);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(result.expiredEmailsSent).toBe(0);
  });

  it('still sends the expired email inside the resend window', async () => {
    primeTenants([mockTenantRow({ trialEndsAt: daysFromNow(-10) })]);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ template: 'trial-expired', tenantId: 'tenant-1' })
    );
    expect(result.expiredEmailsSent).toBe(1);
  });

  it('updates lastTrialCheck only after a successful send', async () => {
    primeTenants([mockTenantRow({ trialEndsAt: daysFromNow(2) })]);
    mockSendEmail.mockResolvedValue({ success: false });

    const result = await processTrialLifecycleEmails();

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(result.expiringEmailsSent).toBe(0);
  });
});
