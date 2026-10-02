/**
 * @jest-environment node
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    staff: {
      findFirst: jest.fn(),
    },
    pet: {
      count: jest.fn(),
    },
  },
}));

jest.mock('@/lib/email/email-service', () => ({
  sendEmail: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/email-service';
import { processTrialLifecycleEmails, sendTrialWelcomeEmail } from '@/lib/email/trial-lifecycle';

const mockFindMany = prisma.tenant.findMany as jest.Mock;
const mockFindUnique = prisma.tenant.findUnique as jest.Mock;
const mockUpdate = prisma.tenant.update as jest.Mock;
const mockPetCount = prisma.pet.count as jest.Mock;
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

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Default row: a tenant near the end of its trial whose activation emails
 * were all already sent, so the pre-existing expiring/expired tests keep
 * exercising only the expiring/expired branches.
 */
function mockTenantRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tenant-1',
    name: 'Clínica Test',
    status: 'ACTIVE',
    isTrialPeriod: true,
    trialEndsAt: daysFromNow(2),
    lastTrialCheck: null,
    createdAt: daysAgo(28),
    welcomeEmailSentAt: daysAgo(28),
    activationNudgeSentAt: daysAgo(26),
    trialCheckinSentAt: daysAgo(21),
    ...overrides,
  };
}

/**
 * A fresh trial tenant (created `ageDays` ago, trial far from ending) with
 * no activation email sent yet unless overridden.
 */
function freshTenantRow(ageDays: number, overrides: Record<string, unknown> = {}) {
  return mockTenantRow({
    trialEndsAt: daysFromNow(25),
    createdAt: daysAgo(ageDays),
    welcomeEmailSentAt: null,
    activationNudgeSentAt: null,
    trialCheckinSentAt: null,
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdate.mockResolvedValue({});
  mockStaffFindFirst.mockResolvedValue({
    email: 'admin@example.test',
    name: 'Admin Test',
  });
  mockSendEmail.mockResolvedValue({ success: true });
  mockPetCount.mockResolvedValue(0);
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

describe('processTrialLifecycleEmails – activation emails', () => {
  it('sends the welcome email as catch-up for a tenant created yesterday with no welcome sent', async () => {
    primeTenants([freshTenantRow(1)]);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'trial-welcome',
        tenantId: 'tenant-1',
        to: { email: 'admin@example.test', name: 'Admin Test' },
      })
    );
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { welcomeEmailSentAt: expect.any(Date) },
    });
    expect(result.welcomeEmailsSent).toBe(1);
    expect(result.activationNudgesSent).toBe(0);
    expect(result.checkinEmailsSent).toBe(0);
  });

  it('does not resend the welcome email once welcomeEmailSentAt is set', async () => {
    primeTenants([freshTenantRow(1, { welcomeEmailSentAt: daysAgo(1) })]);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(result.welcomeEmailsSent).toBe(0);
  });

  it('does not send the welcome catch-up for tenants older than the catch-up window', async () => {
    // 5 days old, welcome never sent, nudge already sent: too old for the
    // welcome, too young for the check-in -> nothing goes out.
    primeTenants([freshTenantRow(5, { activationNudgeSentAt: daysAgo(3) })]);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(result.welcomeEmailsSent).toBe(0);
  });

  it('sends the activation nudge from day 2 when the tenant has no pets', async () => {
    primeTenants([freshTenantRow(3, { welcomeEmailSentAt: daysAgo(3) })]);
    mockPetCount.mockResolvedValue(0);

    const result = await processTrialLifecycleEmails();

    expect(mockPetCount).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1' } });
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'trial-activation-nudge',
        tenantId: 'tenant-1',
        data: expect.objectContaining({
          createPetUrl: expect.stringContaining('/dashboard/pets/new'),
        }),
      })
    );
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { activationNudgeSentAt: expect.any(Date) },
    });
    expect(result.activationNudgesSent).toBe(1);
  });

  it('skips the activation nudge when the tenant already registered a pet', async () => {
    primeTenants([freshTenantRow(3, { welcomeEmailSentAt: daysAgo(3) })]);
    mockPetCount.mockResolvedValue(2);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(result.activationNudgesSent).toBe(0);
  });

  it('sends the activation nudge at most once', async () => {
    primeTenants([
      freshTenantRow(3, { welcomeEmailSentAt: daysAgo(3), activationNudgeSentAt: daysAgo(1) }),
    ]);
    mockPetCount.mockResolvedValue(0);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(result.activationNudgesSent).toBe(0);
  });

  it('sends the check-in from day 7 with a reply-to the founder reads', async () => {
    primeTenants([
      freshTenantRow(8, { welcomeEmailSentAt: daysAgo(8), activationNudgeSentAt: daysAgo(6) }),
    ]);
    mockPetCount.mockResolvedValue(3);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'trial-checkin',
        tenantId: 'tenant-1',
        replyTo: 'contacto@vetify.pro',
      })
    );
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { trialCheckinSentAt: expect.any(Date) },
    });
    expect(result.checkinEmailsSent).toBe(1);
  });

  it('sends the check-in at most once', async () => {
    primeTenants([
      freshTenantRow(8, {
        welcomeEmailSentAt: daysAgo(8),
        activationNudgeSentAt: daysAgo(6),
        trialCheckinSentAt: daysAgo(1),
      }),
    ]);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(result.checkinEmailsSent).toBe(0);
  });

  it('sends at most one activation email per tenant per run', async () => {
    // 8 days old, no pets, nudge and check-in both pending: only the nudge
    // goes out today, the check-in follows on a later run.
    primeTenants([freshTenantRow(8, { welcomeEmailSentAt: daysAgo(8) })]);
    mockPetCount.mockResolvedValue(0);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ template: 'trial-activation-nudge' })
    );
    expect(result.activationNudgesSent).toBe(1);
    expect(result.checkinEmailsSent).toBe(0);
  });

  it('never backfills activation emails for tenants created long ago', async () => {
    // Existing tenant on a long promo trial: still trialing, nothing ever
    // sent, but far outside every activation window.
    primeTenants([freshTenantRow(40, { trialEndsAt: daysFromNow(60) })]);
    mockPetCount.mockResolvedValue(0);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(result.welcomeEmailsSent).toBe(0);
    expect(result.activationNudgesSent).toBe(0);
    expect(result.checkinEmailsSent).toBe(0);
  });

  it('sends no activation email once the trial has ended', async () => {
    primeTenants([freshTenantRow(3, { trialEndsAt: daysFromNow(-1) })]);
    mockPetCount.mockResolvedValue(0);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ template: 'trial-expired' })
    );
    expect(result.welcomeEmailsSent).toBe(0);
    expect(result.activationNudgesSent).toBe(0);
  });

  it('marks the activation column only after a successful send', async () => {
    primeTenants([freshTenantRow(1)]);
    mockSendEmail.mockResolvedValue({ success: false });

    const result = await processTrialLifecycleEmails();

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(result.welcomeEmailsSent).toBe(0);
  });

  it('skips activation emails when no staff email can be resolved', async () => {
    primeTenants([freshTenantRow(1)]);
    mockStaffFindFirst.mockResolvedValue(null);

    const result = await processTrialLifecycleEmails();

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(result.welcomeEmailsSent).toBe(0);
  });
});

describe('sendTrialWelcomeEmail', () => {
  it('sends the welcome email to the clinic admin and stamps welcomeEmailSentAt', async () => {
    mockFindUnique.mockResolvedValue(freshTenantRow(0));

    const result = await sendTrialWelcomeEmail('tenant-1');

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'tenant-1' } })
    );
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'trial-welcome',
        tenantId: 'tenant-1',
        to: { email: 'admin@example.test', name: 'Admin Test' },
        data: expect.objectContaining({
          clinicName: 'Clínica Test',
          ownerName: 'Admin Test',
          dashboardUrl: expect.stringContaining('/dashboard'),
          createPetUrl: expect.stringContaining('/dashboard/pets/new'),
        }),
      })
    );
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { welcomeEmailSentAt: expect.any(Date) },
    });
    expect(result.success).toBe(true);
  });

  it('does nothing when the welcome email was already sent', async () => {
    mockFindUnique.mockResolvedValue(freshTenantRow(0, { welcomeEmailSentAt: daysAgo(0) }));

    const result = await sendTrialWelcomeEmail('tenant-1');

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });

  it('does nothing when the tenant is not in trial', async () => {
    mockFindUnique.mockResolvedValue(freshTenantRow(0, { isTrialPeriod: false }));

    const result = await sendTrialWelcomeEmail('tenant-1');

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });

  it('never throws: a database failure resolves to success false', async () => {
    mockFindUnique.mockRejectedValue(new Error('db down'));

    await expect(sendTrialWelcomeEmail('tenant-1')).resolves.toEqual(
      expect.objectContaining({ success: false })
    );
  });
});
