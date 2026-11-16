/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { createTestTenant } from '../../utils/test-utils';
import { POST } from '@/app/api/public/customer-lookup/route';
import { NextRequest } from 'next/server';

function createMockRequest(body: Record<string, unknown>): NextRequest {
  return {
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
}

type Row = { id: string; tenantId: string; name: string; phone: string | null; email: string | null; isActive: boolean };
type PetRow = { id: string; tenantId: string; customerId: string; name: string; species: string; breed: string; isDeceased: boolean };

const TENANT_ID = 'tenant-lookup-test';

const customers: Row[] = [
  { id: 'customer-juan', tenantId: TENANT_ID, name: 'Juan García', phone: '+52 55 1234 5678', email: 'juan@example.com', isActive: true },
  { id: 'customer-other-clinic', tenantId: 'other-tenant', name: 'Ana López', phone: '55 9876 5432', email: null, isActive: true },
  // Archived by the clinic: must be invisible to the public lookup
  { id: 'customer-archived', tenantId: TENANT_ID, name: 'Pedro Ruiz', phone: '55 2222 3333', email: 'pedro@example.com', isActive: false },
  // Same phone and name as an active customer, but archived and older (sorted first)
  { id: 'customer-maria-old', tenantId: TENANT_ID, name: 'María Pérez', phone: '55 4444 5555', email: null, isActive: false },
  { id: 'customer-maria', tenantId: TENANT_ID, name: 'María Pérez', phone: '55 4444 5555', email: null, isActive: true },
];

const pets: PetRow[] = [
  { id: 'pet-firulais', tenantId: TENANT_ID, customerId: 'customer-juan', name: 'Firulais', species: 'DOG', breed: 'Labrador', isDeceased: false },
  { id: 'pet-rocky', tenantId: TENANT_ID, customerId: 'customer-juan', name: 'Rocky', species: 'DOG', breed: 'Boxer', isDeceased: true },
  { id: 'pet-michi', tenantId: 'other-tenant', customerId: 'customer-other-clinic', name: 'Michi', species: 'CAT', breed: '', isDeceased: false },
  { id: 'pet-max', tenantId: TENANT_ID, customerId: 'customer-archived', name: 'Max', species: 'DOG', breed: '', isDeceased: false },
  { id: 'pet-luna-old', tenantId: TENANT_ID, customerId: 'customer-maria-old', name: 'Luna', species: 'CAT', breed: '', isDeceased: false },
  { id: 'pet-nala', tenantId: TENANT_ID, customerId: 'customer-maria', name: 'Nala', species: 'CAT', breed: '', isDeceased: false },
];

/** In-memory tables that honour the filters the route sends to Prisma. */
function useTables() {
  prismaMock.customer.findMany.mockImplementation((async (args: any) => {
    const where = args?.where ?? {};
    return customers.filter((c) => {
      if (where.tenantId && c.tenantId !== where.tenantId) return false;
      if (where.phone?.contains !== undefined && !(c.phone ?? '').includes(where.phone.contains)) return false;
      if (where.isActive !== undefined && c.isActive !== where.isActive) return false;
      return true;
    });
  }) as any);
  prismaMock.pet.findMany.mockImplementation((async (args: any) => {
    const where = args?.where ?? {};
    return pets
      .filter((p) => {
        if (where.tenantId && p.tenantId !== where.tenantId) return false;
        if (where.customerId && p.customerId !== where.customerId) return false;
        if (where.isDeceased === false && p.isDeceased) return false;
        return true;
      })
      .map((p) =>
        args?.select
          ? Object.fromEntries(Object.keys(args.select).map((key) => [key, (p as any)[key]]))
          : p
      );
  }) as any);
}

describe('Public Customer Lookup API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.tenant.findUnique.mockResolvedValue(
      createTestTenant({
        id: TENANT_ID,
        slug: 'test-clinic',
        status: 'ACTIVE',
        publicPageEnabled: true,
        publicBookingEnabled: true,
      }) as any
    );
    useTables();
  });

  describe('input requirements', () => {
    it.each(['1', '5678', '551234567'])('rejects the partial phone %s without querying customers', async (phone) => {
      const response = await POST(createMockRequest({ tenantSlug: 'test-clinic', phone, customerName: 'Juan García' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ success: false, error: 'Datos inválidos' });
      expect(prismaMock.customer.findMany).not.toHaveBeenCalled();
    });

    it('rejects a lookup by email alone', async () => {
      const response = await POST(createMockRequest({ tenantSlug: 'test-clinic', email: 'juan@example.com' }));

      expect(response.status).toBe(400);
      expect(prismaMock.customer.findMany).not.toHaveBeenCalled();
    });

    it('rejects a phone without a second factor (name or email)', async () => {
      const response = await POST(createMockRequest({ tenantSlug: 'test-clinic', phone: '5512345678' }));

      expect(response.status).toBe(400);
      expect(prismaMock.customer.findMany).not.toHaveBeenCalled();
    });
  });

  describe('matching', () => {
    it('returns only id and name of living pets when phone and name match', async () => {
      const response = await POST(
        createMockRequest({ tenantSlug: 'test-clinic', phone: '(55) 1234-5678', customerName: '  juan garcia ' })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true, pets: [{ id: 'pet-firulais', name: 'Firulais' }] });
    });

    it('returns the pets when phone and email match even if the name differs', async () => {
      const response = await POST(
        createMockRequest({
          tenantSlug: 'test-clinic',
          phone: '5512345678',
          customerName: 'J. García',
          email: 'JUAN@example.com',
        })
      );
      const data = await response.json();

      expect(data).toEqual({ success: true, pets: [{ id: 'pet-firulais', name: 'Firulais' }] });
    });

    it('answers a known phone with the wrong name exactly like an unknown phone', async () => {
      const known = await POST(
        createMockRequest({ tenantSlug: 'test-clinic', phone: '5512345678', customerName: 'Someone Else' })
      );
      const unknown = await POST(
        createMockRequest({ tenantSlug: 'test-clinic', phone: '5500000000', customerName: 'Someone Else' })
      );

      expect(known.status).toBe(200);
      expect(unknown.status).toBe(200);
      expect(await known.json()).toEqual({ success: true, pets: [] });
      expect(await unknown.json()).toEqual({ success: true, pets: [] });
    });

    it('does not find archived customers', async () => {
      const byName = await POST(
        createMockRequest({ tenantSlug: 'test-clinic', phone: '5522223333', customerName: 'Pedro Ruiz' })
      );
      const byEmail = await POST(
        createMockRequest({ tenantSlug: 'test-clinic', phone: '5522223333', customerName: 'x', email: 'pedro@example.com' })
      );

      expect(await byName.json()).toEqual({ success: true, pets: [] });
      expect(await byEmail.json()).toEqual({ success: true, pets: [] });
      expect(prismaMock.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isActive: true }) })
      );
    });

    it('matches the active customer when an archived one shares phone and name', async () => {
      const response = await POST(
        createMockRequest({ tenantSlug: 'test-clinic', phone: '5544445555', customerName: 'María Pérez' })
      );

      expect(await response.json()).toEqual({ success: true, pets: [{ id: 'pet-nala', name: 'Nala' }] });
    });

    it('does not return customers of another clinic', async () => {
      const response = await POST(
        createMockRequest({ tenantSlug: 'test-clinic', phone: '5598765432', customerName: 'Ana López' })
      );

      expect(await response.json()).toEqual({ success: true, pets: [] });
    });
  });

  describe('clinic availability', () => {
    it('returns 404 for a non-existent clinic', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(null);

      const response = await POST(
        createMockRequest({ tenantSlug: 'nope', phone: '5512345678', customerName: 'Juan García' })
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ success: false, error: 'Clínica no disponible' });
    });

    it('returns 404 when public booking is disabled', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(
        createTestTenant({ id: TENANT_ID, publicPageEnabled: true, publicBookingEnabled: false }) as any
      );

      const response = await POST(
        createMockRequest({ tenantSlug: 'test-clinic', phone: '5512345678', customerName: 'Juan García' })
      );

      expect(response.status).toBe(404);
    });

    it('returns 404 when the public page is disabled', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(
        createTestTenant({ id: TENANT_ID, publicPageEnabled: false, publicBookingEnabled: true }) as any
      );

      const response = await POST(
        createMockRequest({ tenantSlug: 'test-clinic', phone: '5512345678', customerName: 'Juan García' })
      );

      expect(response.status).toBe(404);
    });
  });
});
