/**
 * @jest-environment node
 */

// Regression: ISSUE-001 — EmailLog rows silently dropped for unmapped templates
// Found by /qa on 2026-10-02
// Report: .gstack/qa-reports/run-20261002T185412Z/qa-report-development-vetify-pro-2026-10-02.md

// The global setup mocks @prisma/client without EmailTemplate. The enum is the
// boundary under test, so use the real generated client here.
jest.mock('@prisma/client', () => jest.requireActual('@prisma/client'));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    emailLog: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { logEmailSend } from '@/lib/notifications/notification-logger';
import type { EmailData } from '@/lib/email/types';

const mockCreate = prisma.emailLog.create as jest.Mock;
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

function emailFor(template: EmailData['template']): EmailData {
  return {
    template,
    to: { email: 'owner@example.test', name: 'Owner' },
    subject: 'Subject',
    tenantId: 'tenant-1',
    data: {},
  } as unknown as EmailData;
}

describe('logEmailSend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each<[EmailData['template'], string]>([
    ['appointment-confirmation', 'APPOINTMENT_CONFIRMATION'],
    ['appointment-reminder', 'APPOINTMENT_REMINDER'],
    ['appointment-cancellation', 'APPOINTMENT_CANCELLATION'],
    ['appointment-rescheduled', 'APPOINTMENT_RESCHEDULED'],
    ['appointment-staff-notification', 'APPOINTMENT_STAFF_NOTIFICATION'],
    ['low-stock-alert', 'LOW_STOCK_ALERT'],
    ['treatment-reminder', 'TREATMENT_REMINDER'],
    ['new-user-registration', 'NEW_USER_REGISTRATION'],
    ['new-subscription-payment', 'NEW_SUBSCRIPTION_PAYMENT'],
    ['payment-failed-alert', 'PAYMENT_FAILED_ALERT'],
    ['testimonial-request', 'TESTIMONIAL_REQUEST'],
    ['staff-invitation', 'STAFF_INVITATION'],
    ['trial-expiring', 'TRIAL_EXPIRING'],
    ['trial-expired', 'TRIAL_EXPIRED'],
    ['trial-welcome', 'TRIAL_WELCOME'],
    ['trial-activation-nudge', 'TRIAL_ACTIVATION_NUDGE'],
    ['trial-checkin', 'TRIAL_CHECKIN'],
    ['data-retention-warning', 'DATA_RETENTION_WARNING'],
  ])('logs %s with the %s EmailTemplate', async (template, expected) => {
    await logEmailSend(emailFor(template), { success: true, messageId: 'msg-1' });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0][0].data.template).toBe(expected);
  });

  it('never throws when the database write fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('db down'));

    await expect(
      logEmailSend(emailFor('trial-welcome'), { success: true, messageId: 'msg-1' })
    ).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
