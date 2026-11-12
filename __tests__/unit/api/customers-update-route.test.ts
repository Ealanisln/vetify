/**
 * @jest-environment node
 */

// PUT /api/customers/:id through the real route handler and updateCustomer,
// with only prisma and the session mocked.
// Regression: a partial update that omitted email set it to null, and
// locationId was dropped. Found by the flows audit
// (docs/AUDITORIA-FLUJOS-2026-11.md, section 2).

import { prismaMock } from '../../mocks/prisma';

jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  requireAuth: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { PUT } from '@/app/api/customers/[id]/route';
import { requireAuth } from '@/lib/auth';

function putRequest(body: unknown) {
  return new NextRequest('http://localhost/api/customers/customer-1', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const params = { params: Promise.resolve({ id: 'customer-1' }) };

function updateData() {
  return prismaMock.customer.update.mock.calls[0][0].data as Record<string, unknown>;
}

describe('PUT /api/customers/:id', () => {
  beforeEach(() => {
    (requireAuth as jest.Mock).mockResolvedValue({ tenant: { id: 'tenant-1' }, user: { id: 'u1' } });
    prismaMock.customer.update.mockImplementation((async (args: { data: Record<string, unknown> }) => ({
      id: 'customer-1',
      name: 'Ana',
      email: 'ana@test.com',
      ...args.data,
    })) as never);
  });

  describe('partial updates', () => {
    it('leaves email untouched when the body omits it', async () => {
      const res = await PUT(putRequest({ phone: '5551234567' }), params);

      expect(res.status).toBe(200);
      const data = updateData();
      expect(data).not.toHaveProperty('email');
      expect(data.phone).toBe('5551234567');
    });

    it('only sends the provided fields to the database', async () => {
      await PUT(putRequest({ notes: 'Prefiere citas en la tarde' }), params);

      expect(Object.keys(updateData())).toEqual(['notes']);
    });

    it('does not reset preferredContactMethod to its create default', async () => {
      await PUT(putRequest({ name: 'Ana López' }), params);

      expect(updateData()).not.toHaveProperty('preferredContactMethod');
    });

    it('clears email when the body sends an empty string', async () => {
      await PUT(putRequest({ email: '' }), params);

      expect(updateData().email).toBeNull();
    });

    it('scopes the update to the tenant', async () => {
      await PUT(putRequest({ name: 'Ana' }), params);

      expect(prismaMock.customer.update.mock.calls[0][0].where).toEqual({
        id: 'customer-1',
        tenantId: 'tenant-1',
      });
    });
  });

  describe('location', () => {
    it('saves a location that belongs to the tenant', async () => {
      prismaMock.location.findFirst.mockResolvedValue({ id: 'loc-1' } as never);

      const res = await PUT(putRequest({ locationId: 'loc-1' }), params);

      expect(res.status).toBe(200);
      expect(prismaMock.location.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: 'loc-1', tenantId: 'tenant-1' }) })
      );
      expect(updateData().locationId).toBe('loc-1');
    });

    it('rejects a location from another tenant without updating', async () => {
      prismaMock.location.findFirst.mockResolvedValue(null);

      const res = await PUT(putRequest({ locationId: 'loc-other' }), params);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe('Ubicación no encontrada o no pertenece a esta clínica');
      expect(prismaMock.customer.update).not.toHaveBeenCalled();
    });

    it('unassigns the location when locationId is null', async () => {
      await PUT(putRequest({ locationId: null }), params);

      expect(prismaMock.location.findFirst).not.toHaveBeenCalled();
      expect(updateData().locationId).toBeNull();
    });

    it('leaves the location untouched when locationId is omitted', async () => {
      await PUT(putRequest({ name: 'Ana' }), params);

      expect(updateData()).not.toHaveProperty('locationId');
    });
  });
});
