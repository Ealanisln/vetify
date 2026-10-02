/**
 * @jest-environment node
 *
 * Onboarding must fire the trial welcome email right after the tenant is
 * created, and a failing email must never break the onboarding response.
 */

import { NextRequest } from 'next/server';

const mockGetAuthenticatedUser = jest.fn();
const mockCreateTenantWithDefaults = jest.fn();
const mockIsSlugAvailable = jest.fn();
const mockGenerateUniqueSlug = jest.fn();
const mockNotifyNewUserRegistration = jest.fn();
const mockGetActivePromotionFromDB = jest.fn();
const mockSendTrialWelcomeEmail = jest.fn();

jest.mock('@/lib/auth', () => ({
  getAuthenticatedUserWithOptionalTenant: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

jest.mock('@/lib/tenant', () => ({
  createTenantWithDefaults: (...args: unknown[]) => mockCreateTenantWithDefaults(...args),
  isSlugAvailable: (...args: unknown[]) => mockIsSlugAvailable(...args),
  generateUniqueSlug: (...args: unknown[]) => mockGenerateUniqueSlug(...args),
}));

jest.mock('@/lib/email/admin-notifications', () => ({
  notifyNewUserRegistration: (...args: unknown[]) => mockNotifyNewUserRegistration(...args),
}));

jest.mock('@/lib/pricing-config', () => ({
  getActivePromotionFromDB: (...args: unknown[]) => mockGetActivePromotionFromDB(...args),
}));

jest.mock('@/lib/referrals/queries', () => ({
  resolveReferralCode: jest.fn(),
  createConversion: jest.fn(),
}));

jest.mock('@/lib/email/trial-lifecycle', () => ({
  sendTrialWelcomeEmail: (...args: unknown[]) => mockSendTrialWelcomeEmail(...args),
}));

import { POST } from '@/app/api/onboarding/route';

function createRequest(body: unknown): NextRequest {
  return new Request('http://localhost:3000/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const validBody = {
  clinicName: 'Clínica Norte',
  slug: 'clinica-norte',
};

const createdTenant = {
  id: 'tenant-new',
  name: 'Clínica Norte',
  slug: 'clinica-norte',
  isTrialPeriod: true,
  trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
};

/** Let fire-and-forget promises settle before asserting. */
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAuthenticatedUser.mockResolvedValue({
    user: { id: 'user-1', email: 'owner@example.test', given_name: 'Ana', family_name: 'Ruiz', tenant: null },
  });
  mockIsSlugAvailable.mockResolvedValue(true);
  mockGetActivePromotionFromDB.mockResolvedValue(null);
  mockCreateTenantWithDefaults.mockResolvedValue({ tenant: createdTenant, user: {} });
  mockNotifyNewUserRegistration.mockResolvedValue({ success: true });
  mockSendTrialWelcomeEmail.mockResolvedValue({ success: true });
});

describe('POST /api/onboarding – trial welcome email', () => {
  it('triggers the trial welcome email for the newly created tenant', async () => {
    const response = await POST(createRequest(validBody));
    await flushPromises();

    expect(response.status).toBe(201);
    expect(mockSendTrialWelcomeEmail).toHaveBeenCalledTimes(1);
    expect(mockSendTrialWelcomeEmail).toHaveBeenCalledWith('tenant-new');
  });

  it('still returns 201 when the welcome email rejects', async () => {
    mockSendTrialWelcomeEmail.mockRejectedValue(new Error('resend down'));

    const response = await POST(createRequest(validBody));
    await flushPromises();

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.tenant.id).toBe('tenant-new');
  });

  it('does not send a welcome email when tenant creation fails', async () => {
    mockCreateTenantWithDefaults.mockRejectedValue(new Error('plan missing'));

    const response = await POST(createRequest(validBody));
    await flushPromises();

    expect(response.status).toBe(500);
    expect(mockSendTrialWelcomeEmail).not.toHaveBeenCalled();
  });
});
