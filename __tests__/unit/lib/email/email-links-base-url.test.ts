/**
 * @jest-environment node
 *
 * Every link Vetify emails out must use the shared base URL: the configured
 * NEXT_PUBLIC_APP_URL when present (read at send time, not at import), and
 * https://www.vetify.pro in production when nothing is configured. Before,
 * some fell back to localhost, some to the apex and one to "undefined".
 */

const mockSendEmail = jest.fn();
const mockResendSend = jest.fn();

jest.mock('@/lib/email/email-service', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockResendSend } })),
}));
jest.mock('@/lib/setup/setup-token', () => ({
  generateSetupToken: jest.fn(async () => ({ token: 'setup-tok' })),
}));
jest.mock('@/lib/invitations/invitation-token', () => ({
  generateStaffInvitation: jest.fn(async () => ({ id: 'inv-1', token: 'invite-tok' })),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    staff: { findFirst: jest.fn(), findUnique: jest.fn() },
    pet: { count: jest.fn() },
    emailLog: { findFirst: jest.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { processTrialLifecycleEmails } from '@/lib/email/trial-lifecycle';
import { sendRetentionWarnings } from '@/lib/retention/notify';
import { sendSetupVerificationEmail } from '@/lib/setup/setup-email';
import { sendStaffInvitationEmail } from '@/lib/invitations/invitation-email';
import { notifyReferralConversion } from '@/lib/email/referral-notifications';
import { notifyPaymentFailed } from '@/lib/email/admin-notifications';

const tenantFindMany = prisma.tenant.findMany as jest.Mock;
const tenantFindUnique = prisma.tenant.findUnique as jest.Mock;
const staffFindFirst = prisma.staff.findFirst as jest.Mock;
const staffFindUnique = prisma.staff.findUnique as jest.Mock;

const DAY = 24 * 60 * 60 * 1000;

const URL_KEYS = ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_BASE_URL', 'VERCEL_ENV', 'VERCEL_URL'];

/** Every link-bearing email, returning the link(s) it produced */
const senders: Record<string, () => Promise<string>> = {
  'trial expiring upgrade link': async () => {
    tenantFindMany.mockResolvedValue([
      {
        id: 't1',
        name: 'Clínica',
        isTrialPeriod: true,
        trialEndsAt: new Date(Date.now() + 2 * DAY),
        lastTrialCheck: null,
        createdAt: new Date(Date.now() - 28 * DAY),
        welcomeEmailSentAt: new Date(),
        activationNudgeSentAt: new Date(),
        trialCheckinSentAt: new Date(),
      },
    ]);
    await processTrialLifecycleEmails();
    return mockSendEmail.mock.calls[0][0].data.upgradeUrl;
  },
  'retention reactivate link': async () => {
    const now = new Date('2026-04-28T12:00:00.000Z');
    tenantFindMany.mockResolvedValue([
      { id: 't1', name: 'Clínica', dataRetentionEndsAt: new Date('2026-05-03T12:00:00.000Z') },
    ]);
    await sendRetentionWarnings(50, now);
    return mockSendEmail.mock.calls[0][0].data.reactivateUrl;
  },
  'setup verification link': async () => {
    await sendSetupVerificationEmail('root@example.test');
    return mockResendSend.mock.calls[0][0].html;
  },
  'staff invitation link': async () => {
    staffFindUnique.mockResolvedValue({
      id: 's1',
      name: 'Luis',
      email: 'luis@example.test',
      position: 'VETERINARIAN',
      userId: null,
      tenantId: 't1',
    });
    tenantFindUnique.mockResolvedValue({ id: 't1', name: 'Clínica' });
    await sendStaffInvitationEmail({ staffId: 's1', tenantId: 't1' });
    return mockSendEmail.mock.calls[0][0].data.inviteUrl;
  },
  'referral conversion admin link': async () => {
    await notifyReferralConversion({
      partnerName: 'Dr',
      partnerEmail: 'dr@example.test',
      referralCode: 'DR',
      tenantName: 'Clínica',
      planKey: 'PRO',
      subscriptionAmount: 599,
      commissionPercent: 20,
      commissionAmount: 119.8,
    });
    return mockResendSend.mock.calls[0][0].html;
  },
  'payment failed admin link': async () => {
    await notifyPaymentFailed({
      tenantName: 'Clínica',
      tenantSlug: 'clinica',
      failureReason: 'card_declined',
    });
    return mockSendEmail.mock.calls[0][0].data.adminTenantUrl;
  },
};

describe('email links use the shared base URL', () => {
  const originalEnv = process.env;

  function setEnv(values: Record<string, string>) {
    const env: Record<string, string | undefined> = { ...originalEnv };
    for (const key of URL_KEYS) delete env[key];
    process.env = { ...env, RESEND_API_KEY: 're_test_dummy', ...values } as unknown as NodeJS.ProcessEnv;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'm' });
    mockResendSend.mockResolvedValue({ data: { id: 'm' }, error: null });
    staffFindFirst.mockResolvedValue({ email: 'owner@example.test', name: 'Ana' });
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it.each(Object.keys(senders))('%s falls back to www in production', async (name) => {
    setEnv({ NODE_ENV: 'production' });

    const link = await senders[name]();

    expect(link).toContain('https://www.vetify.pro/');
    expect(link).not.toMatch(/localhost|undefined|https:\/\/vetify\.pro/);
  });

  it.each(Object.keys(senders))('%s uses NEXT_PUBLIC_APP_URL at send time', async (name) => {
    setEnv({ NODE_ENV: 'development', NEXT_PUBLIC_APP_URL: 'http://localhost:4000' });

    const link = await senders[name]();

    expect(link).toContain('http://localhost:4000/');
  });
});
