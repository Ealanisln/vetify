/**
 * @jest-environment node
 *
 * Trial, billing and retention emails are rendered on a UTC server. Their
 * dates must come out in the clinic's timezone (or Vetify's own zone for the
 * internal billing alerts), not in the server's.
 */

// Module scope (the test only uses dynamic imports), so names don't clash
// with other test files in the type check.
export {};

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}));
jest.mock('@/lib/notifications/notification-logger', () => ({
  logEmailSend: jest.fn(),
}));
// react-email's render needs dynamic import (unsupported in Jest's VM); the
// synchronous React renderer produces the same markup for these templates.
jest.mock('@react-email/components', () => {
  const { renderToStaticMarkup } = jest.requireActual('react-dom/server');
  return {
    ...jest.requireActual('@react-email/components'),
    render: jest.fn(async (element: unknown) => renderToStaticMarkup(element)),
  };
});

// Fri Nov 13 2026 19:30 in Mexico City = Sat Nov 14 01:30 UTC
const EVENING_IN_MEXICO = new Date('2026-11-14T01:30:00.000Z');
// Sat Nov 14 23:30 UTC: still Nov 14 in UTC and Mexico, already Nov 15 at UTC+14
const LATE_UTC = new Date('2026-11-14T23:30:00.000Z');

const recipient = { email: 'owner@example.test', name: 'Ana' };

function clinicEmail(template: string, date: Date) {
  const common = { clinicName: 'Clínica Norte', ownerName: 'Ana' };
  switch (template) {
    case 'trial-expiring':
      return {
        template,
        data: { ...common, daysRemaining: 1, trialEndsDate: date, upgradeUrl: 'https://x.test/u' },
      };
    case 'trial-expired':
      return { template, data: { ...common, expiredDate: date, upgradeUrl: 'https://x.test/u' } };
    case 'trial-welcome':
      return {
        template,
        data: {
          ...common,
          trialEndsDate: date,
          createPetUrl: 'https://x.test/p',
          dashboardUrl: 'https://x.test/d',
        },
      };
    case 'data-retention-warning':
      return {
        template,
        data: { ...common, daysRemaining: 3, deletionDate: date, reactivateUrl: 'https://x.test/r' },
      };
    default:
      throw new Error(template);
  }
}

const CLINIC_TEMPLATES = ['trial-expiring', 'trial-expired', 'trial-welcome', 'data-retention-warning'];

/*
 * Jest cannot switch the process timezone at runtime, so the default-zone
 * cases only prove something when the process runs in UTC, as CI and Vercel
 * do (locally: `TZ=UTC pnpm jest <this file>`). The Pacific/Kiritimati cases
 * disagree with both UTC and Mexico City, so they hold on any machine.
 */
describe('trial, billing and retention emails on a UTC server', () => {
  const realEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: 'msg-1' }, error: null });
    // Leave NODE_ENV=test dry-run mode so the template is actually rendered
    process.env = { ...realEnv, NODE_ENV: 'development', RESEND_API_KEY: 're_test_dummy' };
  });

  afterEach(() => {
    process.env = realEnv;
  });

  it.each(CLINIC_TEMPLATES)('%s formats its date in the clinic timezone', async (template) => {
    const { sendEmail } = await import('@/lib/email/email-service');

    await sendEmail({
      ...clinicEmail(template, EVENING_IN_MEXICO),
      to: recipient,
      subject: 's',
      tenantId: 'tenant-1',
      timeZone: 'America/Mexico_City',
    } as never);

    const html: string = mockSend.mock.calls[0][0].html;
    expect(html).toMatch(/13 de noviembre de 2026/);
    expect(html).not.toMatch(/14 de noviembre/);
  });

  it.each(CLINIC_TEMPLATES)('%s follows a non-default clinic timezone', async (template) => {
    const { sendEmail } = await import('@/lib/email/email-service');

    await sendEmail({
      ...clinicEmail(template, LATE_UTC),
      to: recipient,
      subject: 's',
      tenantId: 'tenant-1',
      timeZone: 'Pacific/Kiritimati',
    } as never);

    const html: string = mockSend.mock.calls[0][0].html;
    expect(html).toMatch(/15 de noviembre de 2026/);
  });

  it('formats the subscription payment alert in Vetify time by default', async () => {
    const { sendEmail } = await import('@/lib/email/email-service');

    await sendEmail({
      template: 'new-subscription-payment',
      to: recipient,
      subject: 's',
      tenantId: 'tenant-1',
      data: {
        userName: 'Ana',
        userEmail: 'ana@example.test',
        tenantName: 'Clínica Norte',
        tenantSlug: 'norte',
        adminTenantUrl: 'https://x.test/a',
        planName: 'Profesional',
        planAmount: 59900,
        currency: 'mxn',
        billingInterval: 'month',
        paymentDate: EVENING_IN_MEXICO,
      },
    });

    const html: string = mockSend.mock.calls[0][0].html;
    expect(html).toMatch(/13 de noviembre de 2026, 19:30/);
  });

  it('formats the failed payment alert in Vetify time by default', async () => {
    const { sendEmail } = await import('@/lib/email/email-service');

    await sendEmail({
      template: 'payment-failed-alert',
      to: recipient,
      subject: 's',
      tenantId: 'tenant-1',
      data: {
        tenantName: 'Clínica Norte',
        tenantSlug: 'norte',
        adminTenantUrl: 'https://x.test/a',
        failureReason: 'card_declined',
        failureDate: EVENING_IN_MEXICO,
      },
    });

    const html: string = mockSend.mock.calls[0][0].html;
    expect(html).toMatch(/13 de noviembre de 2026, 19:30/);
  });

  it('formats the new registration alert (and its trial end) in Vetify time by default', async () => {
    const { sendEmail } = await import('@/lib/email/email-service');

    await sendEmail({
      template: 'new-user-registration',
      to: recipient,
      subject: 's',
      tenantId: 'tenant-1',
      data: {
        userName: 'Ana',
        userEmail: 'ana@example.test',
        tenantName: 'Clínica Norte',
        tenantSlug: 'norte',
        adminTenantUrl: 'https://x.test/a',
        registrationDate: EVENING_IN_MEXICO,
        planType: 'TRIAL',
        trialEndsAt: EVENING_IN_MEXICO,
      },
    });

    const html: string = mockSend.mock.calls[0][0].html;
    expect(html).toMatch(/13 de noviembre de 2026, 19:30/);
    expect(html).toMatch(/13 nov 2026/);
    expect(html).not.toMatch(/14 nov/);
  });
  it('honors an explicit timeZone on the billing alerts', async () => {
    const { sendEmail } = await import('@/lib/email/email-service');

    await sendEmail({
      template: 'payment-failed-alert',
      to: recipient,
      subject: 's',
      tenantId: 'tenant-1',
      timeZone: 'Pacific/Kiritimati',
      data: {
        tenantName: 'Clínica Norte',
        tenantSlug: 'norte',
        adminTenantUrl: 'https://x.test/a',
        failureReason: 'card_declined',
        failureDate: LATE_UTC,
      },
    });

    const html: string = mockSend.mock.calls[0][0].html;
    expect(html).toMatch(/15 de noviembre de 2026, 13:30/);
  });
});
