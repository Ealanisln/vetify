/**
 * @jest-environment node
 *
 * POST /api/onboarding must reject a clinic name made only of spaces (it
 * produced the slug "-") and names longer than 100 characters, and must store
 * the trimmed name.
 */

import { NextRequest } from 'next/server';

const mockCreateTenantWithDefaults = jest.fn();

jest.mock('@/lib/auth', () => ({
  getAuthenticatedUserWithOptionalTenant: jest.fn().mockResolvedValue({
    user: { id: 'user-1', email: 'owner@example.test', given_name: 'Ana', family_name: 'Ruiz', tenant: null },
  }),
}));

jest.mock('@/lib/tenant', () => ({
  createTenantWithDefaults: (...args: unknown[]) => mockCreateTenantWithDefaults(...args),
  isSlugAvailable: jest.fn().mockResolvedValue(true),
  generateUniqueSlug: jest.fn(),
}));

jest.mock('@/lib/email/admin-notifications', () => ({ notifyNewUserRegistration: jest.fn() }));
jest.mock('@/lib/email/trial-lifecycle', () => ({ sendTrialWelcomeEmail: jest.fn() }));
jest.mock('@/lib/after-response', () => ({ runAfterResponse: jest.fn() }));
jest.mock('@/lib/pricing-config', () => ({ getActivePromotionFromDB: jest.fn().mockResolvedValue(null) }));
jest.mock('@/lib/referrals/queries', () => ({ resolveReferralCode: jest.fn(), createConversion: jest.fn() }));

import { POST } from '@/app/api/onboarding/route';

function createRequest(body: unknown): NextRequest {
  return new Request('http://localhost:3000/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  mockCreateTenantWithDefaults.mockReset();
  mockCreateTenantWithDefaults.mockResolvedValue({
    tenant: { id: 'tenant-new', name: 'Clínica Norte', slug: 'clinica-norte', trialEndsAt: null },
    user: {},
  });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('POST /api/onboarding – clinic name validation', () => {
  it('rejects a clinic name made only of spaces', async () => {
    const response = await POST(createRequest({ clinicName: '    ', slug: 'clinica' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors[0].message).toBe('El nombre de la clínica es requerido');
    expect(mockCreateTenantWithDefaults).not.toHaveBeenCalled();
  });

  it('rejects a clinic name longer than 100 characters', async () => {
    const response = await POST(createRequest({ clinicName: 'a'.repeat(101), slug: 'clinica' }));

    expect(response.status).toBe(400);
    expect(mockCreateTenantWithDefaults).not.toHaveBeenCalled();
  });

  it('rejects a slug without letters or numbers', async () => {
    const response = await POST(createRequest({ clinicName: 'Clínica Norte', slug: '-' }));

    expect(response.status).toBe(400);
    expect(mockCreateTenantWithDefaults).not.toHaveBeenCalled();
  });

  it('stores the trimmed clinic name', async () => {
    const response = await POST(createRequest({ clinicName: '  Clínica Norte  ', slug: 'clinica-norte' }));

    expect(response.status).toBe(201);
    expect(mockCreateTenantWithDefaults).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Clínica Norte' })
    );
  });
});
