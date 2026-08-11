const mockGetAuthenticatedUserWithOptionalTenant = jest.fn();

jest.mock('@/lib/auth', () => ({
  getAuthenticatedUserWithOptionalTenant: () => mockGetAuthenticatedUserWithOptionalTenant(),
}));

const mockCreateTenantWithDefaults = jest.fn();
const mockIsSlugAvailable = jest.fn();

jest.mock('@/lib/tenant', () => ({
  createTenantWithDefaults: (...args: unknown[]) => mockCreateTenantWithDefaults(...args),
  isSlugAvailable: (...args: unknown[]) => mockIsSlugAvailable(...args),
  generateUniqueSlug: jest.fn().mockResolvedValue('clinica-2'),
}));

jest.mock('@/lib/email/admin-notifications', () => ({
  notifyNewUserRegistration: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/pricing-config', () => ({
  getActivePromotionFromDB: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/referrals/queries', () => ({
  resolveReferralCode: jest.fn(),
  createConversion: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/onboarding/route';

const postRequest = (body: unknown) =>
  new NextRequest('http://localhost/api/onboarding', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

const basePayload = {
  clinicName: 'Vet Andes',
  slug: 'vet-andes',
};

describe('POST /api/onboarding — countryCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
    mockGetAuthenticatedUserWithOptionalTenant.mockResolvedValue({
      user: { id: 'user-1', email: 'vet@example.com', tenant: null },
    });
    mockIsSlugAvailable.mockResolvedValue(true);
    mockCreateTenantWithDefaults.mockResolvedValue({
      tenant: { id: 'tenant-1', name: 'Vet Andes', slug: 'vet-andes', trialEndsAt: new Date() },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes the chosen country through to tenant creation', async () => {
    const response = await POST(postRequest({ ...basePayload, countryCode: 'CL' }));

    expect(response.status).toBe(201);
    expect(mockCreateTenantWithDefaults).toHaveBeenCalledWith(
      expect.objectContaining({ countryCode: 'CL' })
    );
  });

  it('normalizes lowercase country codes', async () => {
    await POST(postRequest({ ...basePayload, countryCode: 'co' }));

    expect(mockCreateTenantWithDefaults).toHaveBeenCalledWith(
      expect.objectContaining({ countryCode: 'CO' })
    );
  });

  it('creates the tenant without a country when none is sent (legacy clients)', async () => {
    const response = await POST(postRequest(basePayload));

    expect(response.status).toBe(201);
    expect(mockCreateTenantWithDefaults).toHaveBeenCalledWith(
      expect.objectContaining({ countryCode: undefined })
    );
  });

  it('rejects malformed country codes', async () => {
    const response = await POST(postRequest({ ...basePayload, countryCode: 'CHILE' }));

    expect(response.status).toBe(400);
    expect(mockCreateTenantWithDefaults).not.toHaveBeenCalled();
  });
});
