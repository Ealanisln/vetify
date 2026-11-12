/**
 * @jest-environment node
 *
 * GET /api/pets?search= must filter by pet or owner name (the medical history
 * form searches with it) and keep the { success, data, pagination } shape.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';

jest.mock('@/lib/auth', () => ({ requireActiveSubscriptionApi: jest.fn() }));

import { GET } from '@/app/api/pets/route';
import { requireActiveSubscriptionApi } from '@/lib/auth';

const pets = [
  { id: 'pet-1', name: 'Firulais', customer: { name: 'Ana López' } },
  { id: 'pet-2', name: 'Michi', customer: { name: 'Beto Ruiz' } },
];

/** Minimal evaluator for the where clauses getPetsByTenant builds. */
function matches(pet: any, where: any): boolean {
  if (!where) return true;
  if (where.AND) return where.AND.every((w: any) => matches(pet, w));
  if (where.OR) return where.OR.some((w: any) => matches(pet, w));
  return Object.entries(where).every(([key, cond]: [string, any]) => {
    if (key === 'tenantId' || key === 'locationId') return true;
    if (key === 'customer') return matches(pet.customer, cond);
    if (cond && typeof cond === 'object' && 'contains' in cond) {
      return String(pet[key]).toLowerCase().includes(String(cond.contains).toLowerCase());
    }
    return pet[key] === cond;
  });
}

function get(url: string) {
  return GET({ url } as any);
}

describe('GET /api/pets search', () => {
  beforeEach(() => {
    (requireActiveSubscriptionApi as jest.Mock).mockResolvedValue({ tenant: { id: 'tenant-1' } });
    prismaMock.pet.findMany.mockImplementation((async ({ where }: any) => pets.filter((p) => matches(p, where))) as any);
    prismaMock.pet.count.mockImplementation((async ({ where }: any) => pets.filter((p) => matches(p, where)).length) as any);
  });

  it('filters by pet name', async () => {
    const res = await get('http://localhost/api/pets?search=firu&limit=10');
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.map((p: any) => p.id)).toEqual(['pet-1']);
    expect(body.pagination.total).toBe(1);
  });

  it('filters by owner name', async () => {
    const body = await (await get('http://localhost/api/pets?search=ruiz')).json();
    expect(body.data.map((p: any) => p.id)).toEqual(['pet-2']);
  });

  it('keeps returning every pet without search', async () => {
    const body = await (await get('http://localhost/api/pets')).json();
    expect(body.data).toHaveLength(2);
  });

  it('stays scoped to the tenant', async () => {
    await get('http://localhost/api/pets?search=firu');
    const where = prismaMock.pet.findMany.mock.calls[0][0]?.where as any;
    expect(JSON.stringify(where)).toContain('"tenantId":"tenant-1"');
  });
});
