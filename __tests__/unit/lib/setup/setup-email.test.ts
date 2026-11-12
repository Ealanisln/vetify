/**
 * @jest-environment node
 *
 * Resend resolves with { data: null, error } on API errors instead of
 * throwing; the setup email must not report those as sent.
 */
const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}));

jest.mock('@/lib/setup/setup-token', () => ({
  generateSetupToken: jest.fn(async () => ({ token: 'tok-1' })),
}));

import { sendSetupVerificationEmail } from '@/lib/setup/setup-email';

describe('sendSetupVerificationEmail', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    mockSend.mockReset();
    process.env = { ...originalEnv, RESEND_API_KEY: 're_test_dummy' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('resolves when Resend accepts the email', async () => {
    mockSend.mockResolvedValue({ data: { id: 'msg-1' }, error: null });

    await expect(sendSetupVerificationEmail('admin@example.test')).resolves.toEqual({ success: true });
    expect(mockSend.mock.calls[0][0].html).toContain('/setup?token=tok-1');
  });

  it('fails with the Resend error instead of reporting success', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'The vetify.pro domain is not verified.' },
    });

    await expect(sendSetupVerificationEmail('admin@example.test')).rejects.toThrow(
      'The vetify.pro domain is not verified.'
    );
  });
});
