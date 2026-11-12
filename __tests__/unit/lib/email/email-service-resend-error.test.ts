/**
 * @jest-environment node
 *
 * When Resend rejects a send (e.g. unverified domain) it resolves with
 * { data: null, error }. That real error must be returned and logged.
 */
const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}));
jest.mock('@/lib/notifications/notification-logger', () => ({
  logEmailSend: jest.fn(),
}));
jest.mock('@react-email/components', () => ({
  ...jest.requireActual('@react-email/components'),
  render: jest.fn(async () => '<html></html>'),
}));

describe('sendEmail with a Resend API error', () => {
  const originalEnv = process.env;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    // Leave NODE_ENV=test dry-run mode so the Resend call actually happens
    process.env = { ...originalEnv, NODE_ENV: 'development', RESEND_API_KEY: 're_test_dummy' };
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleSpy.mockRestore();
  });

  it('returns and logs the real Resend error message', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'The vetify.pro domain is not verified.' },
    });

    const { sendEmail } = await import('@/lib/email/email-service');
    const { logEmailSend } = await import('@/lib/notifications/notification-logger');

    const result = await sendEmail({
      to: { email: 'ana@example.com', name: 'Ana' },
      subject: 'Invitación',
      tenantId: 'tenant-1',
      template: 'staff-invitation',
      data: {
        staffName: 'Ana',
        clinicName: 'Clínica Norte',
        position: 'VETERINARIAN',
        inviteUrl: 'https://www.vetify.pro/invite?token=tok-1',
        expirationDays: 7,
      },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('The vetify.pro domain is not verified.');
    expect(result.error).not.toContain('No message ID returned');
    expect(logEmailSend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ success: false, error: expect.stringContaining('not verified') })
    );
  });
});
