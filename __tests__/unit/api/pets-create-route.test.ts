/**
 * @jest-environment node
 */

// POST /api/pets through the real route handler, plan-limit code and
// createPet, with only prisma and the session mocked.
// Found by the flows audit (docs/AUDITORIA-FLUJOS-2026-11.md, section 2).

import { prismaMock } from '../../mocks/prisma';

jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  requireActiveSubscriptionApi: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/pets/route';
import { requireActiveSubscriptionApi } from '@/lib/auth';

const DAY = 24 * 60 * 60 * 1000;

const trialTenant = {
  id: 'tenant-1',
  subscriptionStatus: 'TRIALING',
  isTrialPeriod: true,
  trialEndsAt: new Date(Date.now() + 10 * DAY),
  subscriptionEndsAt: null,
  tenantSubscription: null,
};

const validBody = {
  name: 'Firulais',
  species: 'dog',
  dateOfBirth: '2022-05-10',
  gender: 'male',
  customerId: 'customer-1',
};

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/pets', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const ENGLISH = /Required|Invalid|Expected|Number must|String must|cannot|limit reached/i;

describe('POST /api/pets', () => {
  beforeEach(() => {
    (requireActiveSubscriptionApi as jest.Mock).mockResolvedValue({ tenant: trialTenant, user: { id: 'u1' } });
    prismaMock.tenant.findUnique.mockResolvedValue(trialTenant as never);
    prismaMock.pet.count.mockResolvedValue(0);
    prismaMock.customer.findFirst.mockResolvedValue({ id: 'customer-1' } as never);
    prismaMock.pet.create.mockResolvedValue({ id: 'pet-1', name: 'Firulais', weight: null } as never);
  });

  describe('validation errors', () => {
    it('returns Spanish per-field messages instead of the raw Zod issues', async () => {
      const res = await POST(postRequest({ ...validBody, name: '', species: 'dragon', gender: undefined }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message.startsWith('[')).toBe(false);
      expect(body.message).not.toMatch(ENGLISH);

      const byField = Object.fromEntries(body.errors.map((e: { field: string; message: string }) => [e.field, e.message]));
      expect(byField.name).toBe('El nombre es requerido');
      expect(byField.species).toBe('La especie no es válida');
      expect(byField.gender).toBe('El sexo es requerido');
      for (const message of Object.values(byField)) {
        expect(message).not.toMatch(ENGLISH);
      }
    });

    it('explains a missing birth date in Spanish', async () => {
      const res = await POST(postRequest({ ...validBody, dateOfBirth: undefined }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.errors).toEqual([{ field: 'dateOfBirth', message: 'La fecha de nacimiento es requerida' }]);
    });

    it('explains a future birth date in Spanish and names the field', async () => {
      const res = await POST(postRequest({ ...validBody, dateOfBirth: '2999-01-01' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe('La fecha de nacimiento no puede ser una fecha futura.');
      expect(body.errors).toEqual([{ field: 'dateOfBirth', message: body.message }]);
    });

    it('rejects a zero weight in Spanish', async () => {
      const res = await POST(postRequest({ ...validBody, weight: 0 }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.errors).toEqual([{ field: 'weight', message: 'El peso debe ser mayor a 0' }]);
    });
  });

  it('creates the pet with valid data', async () => {
    const res = await POST(postRequest(validBody));

    expect(res.status).toBe(200);
    expect(prismaMock.pet.create).toHaveBeenCalledTimes(1);
  });
});
