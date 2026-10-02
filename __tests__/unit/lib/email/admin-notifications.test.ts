/**
 * @jest-environment node
 *
 * Admin notifications must hand the template a working link to the tenant in
 * the super-admin panel, built from the app's base URL.
 */

const mockSendEmail = jest.fn();

jest.mock('@/lib/email/email-service', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

import {
  notifyNewUserRegistration,
  notifyNewSubscriptionPayment,
  notifyPaymentFailed,
} from '@/lib/email/admin-notifications';

const ORIGINAL_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const expectedUrl = 'https://www.vetify.pro/admin/tenants?search=clinica-norte';

function sentData() {
  return mockSendEmail.mock.calls[0][0].data;
}

describe('admin notifications', () => {
  beforeEach(() => {
    mockSendEmail.mockReset();
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'msg_1' });
    process.env.NEXT_PUBLIC_BASE_URL = 'https://www.vetify.pro';
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_BASE_URL = ORIGINAL_BASE_URL;
  });

  it('new user registration passes the admin tenant URL', async () => {
    await notifyNewUserRegistration({
      userName: 'Ana',
      userEmail: 'ana@example.com',
      tenantId: 'tenant_1',
      tenantName: 'Clínica Norte',
      tenantSlug: 'clinica-norte',
      planType: 'TRIAL',
    });

    expect(sentData().adminTenantUrl).toBe(expectedUrl);
  });

  it('new subscription payment passes the admin tenant URL', async () => {
    await notifyNewSubscriptionPayment({
      userName: 'Ana',
      userEmail: 'ana@example.com',
      tenantId: 'tenant_1',
      tenantName: 'Clínica Norte',
      tenantSlug: 'clinica-norte',
      planName: 'Profesional',
      planAmount: 59900,
      currency: 'mxn',
      billingInterval: 'month',
    });

    expect(sentData().adminTenantUrl).toBe(expectedUrl);
  });

  it('payment failed alert passes the admin tenant URL', async () => {
    await notifyPaymentFailed({
      tenantName: 'Clínica Norte',
      tenantSlug: 'clinica-norte',
      failureReason: 'card_declined',
    });

    expect(sentData().adminTenantUrl).toBe(expectedUrl);
  });

  it('encodes the slug in the search query', async () => {
    await notifyPaymentFailed({
      tenantName: 'Clínica Norte',
      tenantSlug: 'a&b',
      failureReason: 'card_declined',
    });

    expect(sentData().adminTenantUrl).toBe(
      'https://www.vetify.pro/admin/tenants?search=a%26b'
    );
  });
});
