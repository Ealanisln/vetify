/**
 * @jest-environment node
 */

// POST /api/customers through the real route handler and createCustomer,
// with only prisma and the session mocked.
// Found by the flows audit (docs/AUDITORIA-FLUJOS-2026-11.md, section 2).

import { prismaMock } from '../../mocks/prisma';

jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  requireAuth: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/customers/route';
import { requireAuth } from '@/lib/auth';

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/customers', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const ENGLISH = /Required|Invalid|Expected|String must/i;

describe('POST /api/customers', () => {
  beforeEach(() => {
    (requireAuth as jest.Mock).mockResolvedValue({ tenant: { id: 'tenant-1' }, user: { id: 'u1' } });
    prismaMock.customer.findFirst.mockResolvedValue(null);
    prismaMock.customer.create.mockImplementation((async (args: { data: Record<string, unknown> }) => ({
      id: 'customer-1',
      ...args.data,
    })) as never);
  });

  describe('validation errors', () => {
    it('returns Spanish per-field messages instead of the raw Zod issues', async () => {
      const res = await POST(postRequest({ name: '', email: 'no-es-correo', preferredContactMethod: 'fax' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message.startsWith('[')).toBe(false);
      expect(body.message).not.toMatch(ENGLISH);

      const byField = Object.fromEntries(body.errors.map((e: { field: string; message: string }) => [e.field, e.message]));
      expect(byField).toEqual({
        name: 'El nombre es requerido',
        email: 'El email no es válido',
        preferredContactMethod: 'El método de contacto no es válido',
      });
    });

    it('treats a missing name as required, in Spanish', async () => {
      const res = await POST(postRequest({ phone: '5512345678' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.errors).toEqual([{ field: 'name', message: 'El nombre es requerido' }]);
    });
  });

  it('creates the customer with valid data', async () => {
    const res = await POST(postRequest({ name: 'Juan Pérez', phone: '5512345678' }));

    expect(res.status).toBe(201);
    expect(prismaMock.customer.create).toHaveBeenCalledTimes(1);
  });
});
