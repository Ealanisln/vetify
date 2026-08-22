/**
 * Route handlers that gate on an active subscription must answer 403 with a
 * machine-readable code when the tenant has no active plan, never a 500.
 * Before this, requireActiveSubscription() redirected, and the NEXT_REDIRECT
 * throw was swallowed by each route's catch → "Error interno del servidor".
 */

const mockRequireActiveSubscriptionApi = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireActiveSubscriptionApi: () => mockRequireActiveSubscriptionApi(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenantSettings: { findUnique: jest.fn() },
    pet: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
  },
}));

jest.mock('@/lib/pets', () => ({
  createPet: jest.fn(),
  createPetSchema: { parse: (v: unknown) => v },
  getPetsByTenant: jest.fn(),
  PETS_ALLOWED_SORT_FIELDS: ['name'],
}));

jest.mock('@/lib/plan-limits', () => ({
  validatePlanAction: jest.fn(),
  PlanLimitError: class PlanLimitError extends Error {},
}));

import { NextRequest } from 'next/server';
import { SubscriptionRequiredError } from '@/lib/subscription/subscription-required-error';
import { GET as getTaxRate } from '@/app/api/settings/tax-rate/route';
import { GET as getPets, POST as postPet } from '@/app/api/pets/route';
import { GET as getPet, PUT as putPet, DELETE as deletePet } from '@/app/api/pets/[id]/route';

const petParams = { params: Promise.resolve({ id: 'pet-1' }) };
const request = (method: string, body?: unknown) =>
  new NextRequest('http://localhost/api/test', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
  });

const expectSubscriptionRequired = async (response: Response) => {
  expect(response.status).toBe(403);
  await expect(response.json()).resolves.toEqual({
    error: 'Suscripción requerida',
    code: 'SUBSCRIPTION_REQUIRED',
  });
};

describe('subscription-gated route handlers without an active plan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    mockRequireActiveSubscriptionApi.mockRejectedValue(new SubscriptionRequiredError());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GET /api/settings/tax-rate answers 403 SUBSCRIPTION_REQUIRED', async () => {
    await expectSubscriptionRequired(await getTaxRate());
  });

  it('GET /api/pets answers 403 SUBSCRIPTION_REQUIRED', async () => {
    await expectSubscriptionRequired(await getPets(request('GET')));
  });

  it('POST /api/pets answers 403 SUBSCRIPTION_REQUIRED', async () => {
    await expectSubscriptionRequired(await postPet(request('POST', { name: 'Firulais' })));
  });

  it('GET /api/pets/[id] answers 403 SUBSCRIPTION_REQUIRED', async () => {
    await expectSubscriptionRequired(await getPet(request('GET'), petParams));
  });

  it('PUT /api/pets/[id] answers 403 SUBSCRIPTION_REQUIRED', async () => {
    await expectSubscriptionRequired(await putPet(request('PUT', { name: 'Firulais' }), petParams));
  });

  it('DELETE /api/pets/[id] answers 403 SUBSCRIPTION_REQUIRED', async () => {
    await expectSubscriptionRequired(await deletePet(request('DELETE'), petParams));
  });
});
