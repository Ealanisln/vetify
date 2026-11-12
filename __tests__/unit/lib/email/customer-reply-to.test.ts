/**
 * @jest-environment node
 *
 * Emails to a clinic's customers must reply to the clinic (its public
 * contact email, else its owner's), not to Vetify support. Emails to the
 * clinic's own staff keep Vetify's reply-to.
 */

// Module scope (the test only uses dynamic imports), so names don't clash
// with other test files in the type check.
export {};

const mockSend = jest.fn();
const mockTenantFindUnique = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}));
jest.mock('@/lib/notifications/notification-logger', () => ({
  logEmailSend: jest.fn(),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: { tenant: { findUnique: (...args: unknown[]) => mockTenantFindUnique(...args) } },
}));
// react-email's render needs dynamic import (unsupported in Jest's VM)
jest.mock('@react-email/components', () => {
  const { renderToStaticMarkup } = jest.requireActual('react-dom/server');
  return {
    ...jest.requireActual('@react-email/components'),
    render: jest.fn(async (element: unknown) => renderToStaticMarkup(element)),
  };
});

const VETIFY_REPLY_TO = 'soporte@vetify.pro';
const WHEN = new Date('2026-11-20T16:00:00.000Z');
const appointment = {
  appointmentId: 'apt-1',
  petName: 'Firulais',
  ownerName: 'Ana',
  appointmentDate: WHEN,
  appointmentTime: '10:00',
  serviceName: 'Consulta',
  clinicName: 'Clínica Norte',
};

const customerEmails = {
  'appointment-confirmation': appointment,
  'appointment-reminder': { ...appointment, hoursUntilAppointment: 24 },
  'appointment-cancellation': { ...appointment, cancelledBy: 'CLINIC' },
  'appointment-rescheduled': {
    ...appointment,
    previousDate: WHEN,
    previousTime: '09:00',
    newDate: WHEN,
    newTime: '10:00',
  },
  'treatment-reminder': {
    reminderId: 'r-1',
    petName: 'Firulais',
    ownerName: 'Ana',
    treatmentName: 'Rabia',
    treatmentType: 'VACCINATION',
    dueDate: WHEN,
    clinicName: 'Clínica Norte',
    daysUntilDue: 3,
  },
  'testimonial-request': {
    appointmentId: 'apt-1',
    ownerName: 'Ana',
    petName: 'Firulais',
    serviceName: 'Consulta',
    appointmentDate: WHEN,
    clinicName: 'Clínica Norte',
    clinicSlug: 'norte',
    baseUrl: 'https://www.vetify.pro',
  },
} as const;

function email(template: string, data: unknown, extra: Record<string, unknown> = {}) {
  return {
    template,
    to: { email: 'cliente@example.test', name: 'Ana' },
    subject: 's',
    tenantId: 'tenant-1',
    data,
    ...extra,
  } as never;
}

function clinic(publicEmail: string | null, ownerEmail: string | null) {
  mockTenantFindUnique.mockResolvedValue({
    publicEmail,
    staff: ownerEmail ? [{ email: ownerEmail }] : [],
  });
}

function sentReplyTo(): string {
  return mockSend.mock.calls[0][0].replyTo;
}

describe('reply-to of customer emails', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    mockSend.mockReset();
    mockTenantFindUnique.mockReset();
    mockSend.mockResolvedValue({ data: { id: 'msg-1' }, error: null });
    // Leave NODE_ENV=test dry-run mode so the payload reaches Resend
    process.env = { ...originalEnv, NODE_ENV: 'development', RESEND_API_KEY: 're_test_dummy' };
    delete process.env.RESEND_REPLY_TO;
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it.each(Object.entries(customerEmails))(
    '%s replies to the clinic public email',
    async (template, data) => {
      clinic('contacto@clinicanorte.mx', 'dueno@example.test');
      const { sendEmail } = await import('@/lib/email/email-service');

      await sendEmail(email(template, data));

      expect(sentReplyTo()).toBe('contacto@clinicanorte.mx');
      expect(mockTenantFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'tenant-1' } })
      );
    }
  );

  it("falls back to the owner's email when the clinic has no public email", async () => {
    clinic('  ', 'dueno@example.test');
    const { sendEmail } = await import('@/lib/email/email-service');

    await sendEmail(email('appointment-confirmation', appointment));

    expect(sentReplyTo()).toBe('dueno@example.test');
  });

  it('keeps the Vetify reply-to when the clinic has no contact email at all', async () => {
    clinic(null, null);
    const { sendEmail } = await import('@/lib/email/email-service');

    await sendEmail(email('appointment-confirmation', appointment));

    expect(sentReplyTo()).toBe(VETIFY_REPLY_TO);
  });

  it('still sends with the Vetify reply-to if the clinic lookup fails', async () => {
    mockTenantFindUnique.mockRejectedValue(new Error('db down'));
    const { sendEmail } = await import('@/lib/email/email-service');

    const result = await sendEmail(email('appointment-reminder', customerEmails['appointment-reminder']));

    expect(result.success).toBe(true);
    expect(sentReplyTo()).toBe(VETIFY_REPLY_TO);
  });

  it('respects an explicit replyTo', async () => {
    clinic('contacto@clinicanorte.mx', null);
    const { sendEmail } = await import('@/lib/email/email-service');

    await sendEmail(email('appointment-confirmation', appointment, { replyTo: 'citas@clinicanorte.mx' }));

    expect(sentReplyTo()).toBe('citas@clinicanorte.mx');
  });

  it('keeps the Vetify reply-to on emails to clinic staff', async () => {
    clinic('contacto@clinicanorte.mx', 'dueno@example.test');
    const { sendEmail } = await import('@/lib/email/email-service');

    await sendEmail(
      email('appointment-staff-notification', {
        ...appointment,
        staffName: 'Luis',
        petSpecies: 'Perro',
      })
    );
    await sendEmail(
      email('trial-activation-nudge', {
        clinicName: 'Clínica Norte',
        ownerName: 'Ana',
        createPetUrl: 'https://www.vetify.pro/dashboard/pets/new',
      })
    );

    expect(mockSend.mock.calls.map(([payload]) => payload.replyTo)).toEqual([
      VETIFY_REPLY_TO,
      VETIFY_REPLY_TO,
    ]);
    expect(mockTenantFindUnique).not.toHaveBeenCalled();
  });
});
