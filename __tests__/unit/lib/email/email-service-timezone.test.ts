/**
 * @jest-environment node
 *
 * Appointment emails are rendered on a UTC server. The date in the body must
 * be the clinic-local date, so an evening appointment in Mexico City (already
 * the next day in UTC) keeps its own date.
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

const baseReminder = {
  template: 'appointment-reminder' as const,
  to: { email: 'ana@example.test', name: 'Ana' },
  subject: 'Recordatorio de Cita - Firulais',
  tenantId: 'tenant-1',
  data: {
    appointmentId: 'apt-1',
    petName: 'Firulais',
    ownerName: 'Ana',
    appointmentDate: EVENING_IN_MEXICO,
    appointmentTime: '19:30',
    serviceName: 'Consulta',
    clinicName: 'Clínica Norte',
    hoursUntilAppointment: 42,
  },
};

describe('sendEmail renders appointment dates in the clinic timezone', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: 'msg-1' }, error: null });
    // Leave NODE_ENV=test dry-run mode so the template is actually rendered
    process.env = { ...originalEnv, NODE_ENV: 'development', RESEND_API_KEY: 're_test_dummy' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses the email timeZone for the appointment date', async () => {
    const { sendEmail } = await import('@/lib/email/email-service');

    await sendEmail({ ...baseReminder, timeZone: 'America/Mexico_City' });

    const html: string = mockSend.mock.calls[0][0].html;
    expect(html).toMatch(/viernes, 13 de noviembre de 2026/);
    expect(html).not.toMatch(/14 de noviembre/);
  });

  it('does not depend on the machine timezone', async () => {
    const { sendEmail } = await import('@/lib/email/email-service');
    // Nov 14 23:30 UTC is Nov 14 in UTC and in Mexico, but Nov 15 at UTC+14
    await sendEmail({
      ...baseReminder,
      timeZone: 'Pacific/Kiritimati',
      data: { ...baseReminder.data, appointmentDate: new Date('2026-11-14T23:30:00.000Z') },
    });

    const html: string = mockSend.mock.calls[0][0].html;
    expect(html).toMatch(/domingo, 15 de noviembre de 2026/);
  });

  it('defaults to the Mexico City zone when no timeZone is given', async () => {
    const { sendEmail } = await import('@/lib/email/email-service');

    await sendEmail(baseReminder);

    const html: string = mockSend.mock.calls[0][0].html;
    expect(html).toMatch(/13 de noviembre de 2026/);
  });

  it('formats both dates of a rescheduled appointment in the clinic timezone', async () => {
    const { sendEmail } = await import('@/lib/email/email-service');

    await sendEmail({
      template: 'appointment-rescheduled',
      to: { email: 'ana@example.test', name: 'Ana' },
      subject: 'Cita Reprogramada - Firulais',
      tenantId: 'tenant-1',
      timeZone: 'America/Mexico_City',
      data: {
        appointmentId: 'apt-1',
        petName: 'Firulais',
        ownerName: 'Ana',
        previousDate: new Date('2026-11-13T02:00:00.000Z'), // Nov 12 20:00 local
        previousTime: '20:00',
        newDate: EVENING_IN_MEXICO,
        newTime: '19:30',
        serviceName: 'Consulta',
        clinicName: 'Clínica Norte',
      },
    });

    const html: string = mockSend.mock.calls[0][0].html;
    expect(html).toMatch(/12 de noviembre de 2026/);
    expect(html).toMatch(/13 de noviembre de 2026/);
    expect(html).not.toMatch(/14 de noviembre/);
  });
});
