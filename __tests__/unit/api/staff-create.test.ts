/**
 * @jest-environment node
 *
 * POST /api/staff must answer validation problems in Spanish, never with
 * zod's raw JSON / English messages or Prisma errors.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import '../../mocks/prisma';

jest.mock('@/lib/auth', () => ({ requirePermission: jest.fn() }));
jest.mock('@/lib/staff', () => ({
  ...jest.requireActual('@/lib/staff'),
  createStaff: jest.fn(),
}));

import { POST } from '@/app/api/staff/route';
import { requirePermission } from '@/lib/auth';
import { createStaff } from '@/lib/staff';

function request(body: unknown) {
  return { json: () => Promise.resolve(body) } as any;
}

describe('POST /api/staff', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (requirePermission as jest.Mock).mockResolvedValue({ tenant: { id: 'tenant-1' } });
  });

  afterEach(() => consoleSpy.mockRestore());

  it('returns the Spanish field messages for invalid input', async () => {
    const res = await POST(request({ name: 'A', position: 'Veterinario', email: 'no-es-email' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toContain('El nombre debe tener al menos 2 caracteres');
    expect(body.message).toContain('Email inválido');
    expect(body.message).not.toMatch(/[[{]|too_small|invalid_string/);
    expect(body.errors).toEqual(
      expect.arrayContaining([
        { field: 'name', message: 'El nombre debe tener al menos 2 caracteres' },
        { field: 'email', message: 'Email inválido' },
      ])
    );
    expect(createStaff).not.toHaveBeenCalled();
  });

  it('translates missing required fields', async () => {
    const res = await POST(request({ position: 'Veterinario' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe('El nombre es requerido');
  });

  it('returns a Spanish 409 when the email is already used by other staff', async () => {
    (createStaff as jest.Mock).mockRejectedValue(
      Object.assign(new Error('Unique constraint failed on the fields: (`email`)'), {
        code: 'P2002',
        meta: { target: ['email'] },
      })
    );

    const res = await POST(request({ name: 'Ana', position: 'Veterinario', email: 'ana@example.com' }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.message).toMatch(/ya está registrado/);
  });
});
