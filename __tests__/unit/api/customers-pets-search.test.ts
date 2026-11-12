/**
 * @jest-environment node
 */

// Regression: the customer and pet lists filtered only the 10 rows already
// loaded, with an accent-sensitive match and a raw phone substring. Search
// now runs on the server across every row of the tenant.
// Found by the flows audit (docs/AUDITORIA-FLUJOS-2026-11.md, section 2).

import { prismaMock } from '../../mocks/prisma';

jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  requireAuth: jest.fn(),
  requireActiveSubscriptionApi: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET as getCustomers } from '@/app/api/customers/route';
import { GET as getPets } from '@/app/api/pets/route';
import { requireActiveSubscriptionApi, requireAuth } from '@/lib/auth';

type Row = Record<string, unknown> & { id: string };

/**
 * A tiny stand-in for the table: findMany returns the tenant's rows in
 * name order, or the rows whose ids were asked for (in storage order, as
 * Postgres does not keep the order of an IN list).
 */
function fakeTable(rows: Row[]) {
  return async (args: { where?: { id?: { in: string[] } }; skip?: number; take?: number }) => {
    const ids = args.where?.id?.in;
    if (ids) return rows.filter((r) => ids.includes(r.id));
    const sorted = [...rows].sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const start = args.skip ?? 0;
    return sorted.slice(start, args.take === undefined ? undefined : start + args.take);
  };
}

const filler = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `filler-${i}`,
    name: `Aaa Cliente ${String(i).padStart(2, '0')}`,
    email: null,
    phone: '0000000000',
  }));

const get = (path: string) => new NextRequest(`http://localhost${path}`);

describe('GET /api/customers?search=', () => {
  const customers: Row[] = [
    ...filler(25),
    { id: 'jose', name: 'José Ramírez', email: 'jose@test.com', phone: '+52 (55) 1234-5678' },
    { id: 'maria', name: 'María García', email: 'MARIA@test.com', phone: '33 9876 5432' },
  ];

  beforeEach(() => {
    (requireAuth as jest.Mock).mockResolvedValue({ tenant: { id: 'tenant-1' }, user: { id: 'u1' } });
    prismaMock.customer.findMany.mockImplementation(fakeTable(customers) as never);
    prismaMock.customer.count.mockResolvedValue(customers.length);
  });

  it('finds a customer past the first page, ignoring accents', async () => {
    const body = await (await getCustomers(get('/api/customers?page=1&limit=10&sortBy=name&sortOrder=asc&search=jose ramirez'))).json();

    expect(body.data.map((c: Row) => c.id)).toEqual(['jose']);
    expect(body.pagination).toEqual(expect.objectContaining({ total: 1, totalPages: 1, hasMore: false }));
  });

  it('matches a phone typed in another format', async () => {
    const body = await (await getCustomers(get('/api/customers?search=5512345678'))).json();
    expect(body.data.map((c: Row) => c.id)).toEqual(['jose']);
  });

  it('matches email ignoring case', async () => {
    const body = await (await getCustomers(get('/api/customers?search=maria@TEST'))).json();
    expect(body.data.map((c: Row) => c.id)).toEqual(['maria']);
  });

  it('paginates the matches and keeps the requested order', async () => {
    const page1 = await (await getCustomers(get('/api/customers?page=1&limit=10&sortBy=name&sortOrder=asc&search=aaa cliente'))).json();
    const page3 = await (await getCustomers(get('/api/customers?page=3&limit=10&sortBy=name&sortOrder=asc&search=aaa cliente'))).json();

    expect(page1.pagination).toEqual(expect.objectContaining({ total: 25, totalPages: 3, hasMore: true }));
    expect(page1.data.map((c: Row) => c.id)).toEqual(Array.from({ length: 10 }, (_, i) => `filler-${i}`));
    expect(page3.data.map((c: Row) => c.id)).toEqual(['filler-20', 'filler-21', 'filler-22', 'filler-23', 'filler-24']);
  });

  it('keeps the plain paginated list when there is no search', async () => {
    const body = await (await getCustomers(get('/api/customers?page=1&limit=10'))).json();
    expect(body.data).toHaveLength(10);
    expect(body.pagination.total).toBe(customers.length);
  });
});

describe('GET /api/pets?search=', () => {
  const pets: Row[] = [
    ...filler(15).map((r) => ({ ...r, breed: 'Mestizo', customer: { name: 'Dueño', email: null, phone: '0000000000' } })),
    {
      id: 'nino',
      name: 'Niño',
      breed: 'Pastor Alemán',
      microchipNumber: '985112',
      customer: { name: 'Ana Pérez', email: 'ana@test.com', phone: '55-1111-2222' },
      appointments: [],
      medicalHistories: [],
    },
  ];

  beforeEach(() => {
    (requireActiveSubscriptionApi as jest.Mock).mockResolvedValue({ tenant: { id: 'tenant-1' }, user: { id: 'u1' } });
    prismaMock.pet.findMany.mockImplementation(fakeTable(pets) as never);
    prismaMock.pet.count.mockResolvedValue(pets.length);
  });

  it('finds a pet past the first page by name without accents', async () => {
    const body = await (await getPets(get('/api/pets?page=1&limit=10&search=nino'))).json();
    expect(body.data.map((p: Row) => p.id)).toEqual(['nino']);
    expect(body.pagination.total).toBe(1);
  });

  it('finds a pet by breed or owner name ignoring accents', async () => {
    for (const term of ['aleman', 'ANA PEREZ']) {
      const body = await (await getPets(get(`/api/pets?search=${encodeURIComponent(term)}`))).json();
      expect(body.data.map((p: Row) => p.id)).toEqual(['nino']);
    }
  });

  it("finds a pet by its owner's phone in another format", async () => {
    const body = await (await getPets(get('/api/pets?search=' + encodeURIComponent('55 1111 2222')))).json();
    expect(body.data.map((p: Row) => p.id)).toEqual(['nino']);
  });
});
