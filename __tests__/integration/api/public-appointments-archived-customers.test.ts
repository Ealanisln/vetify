/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { createTestTenant } from '../../utils/test-utils';
import { POST } from '@/app/api/public/appointments/route';
import { NextRequest } from 'next/server';

// Calls the real route and the real customer identification; only Prisma is
// replaced by in-memory tables that honour the filters it receives.

function createMockRequest(body: Record<string, unknown>): NextRequest {
  return {
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
}

type Row = {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
};
type PetRow = { id: string; tenantId: string; customerId: string; name: string; species: string };

const TENANT_ID = 'tenant-booking-archived-test';

const customers: Row[] = [
  // Archived by the clinic: a public booking must never be linked to it
  { id: 'customer-archived', tenantId: TENANT_ID, name: 'Pedro Ruiz', phone: '55 2222 3333', email: 'pedro@example.com', isActive: false },
  // Same phone and name as an active customer, but archived and older (sorted first)
  { id: 'customer-maria-old', tenantId: TENANT_ID, name: 'María Pérez', phone: '55 4444 5555', email: null, isActive: false },
  { id: 'customer-maria', tenantId: TENANT_ID, name: 'María Pérez', phone: '55 4444 5555', email: null, isActive: true },
];

const pets: PetRow[] = [
  { id: 'pet-max', tenantId: TENANT_ID, customerId: 'customer-archived', name: 'Max', species: 'DOG' },
  { id: 'pet-luna-old', tenantId: TENANT_ID, customerId: 'customer-maria-old', name: 'Luna', species: 'CAT' },
  { id: 'pet-luna', tenantId: TENANT_ID, customerId: 'customer-maria', name: 'Luna', species: 'CAT' },
];

function matchesWhere(c: Row, where: any): boolean {
  if (where.id && c.id !== where.id) return false;
  if (where.tenantId && c.tenantId !== where.tenantId) return false;
  if (where.isActive !== undefined && c.isActive !== where.isActive) return false;
  if (where.phone?.contains !== undefined && !(c.phone ?? '').includes(where.phone.contains)) return false;
  if (where.email?.equals !== undefined && (c.email ?? '').toLowerCase() !== where.email.equals.toLowerCase()) {
    return false;
  }
  if (Array.isArray(where.OR)) {
    const anyName = where.OR.some((clause: any) =>
      c.name.toLowerCase().includes(String(clause.name?.contains ?? '').toLowerCase())
    );
    if (!anyName) return false;
  }
  return true;
}

function withPets(c: Row) {
  return { ...c, pets: pets.filter((p) => p.customerId === c.id), user: null };
}

function useTables() {
  prismaMock.customer.findMany.mockImplementation((async (args: any) =>
    customers.filter((c) => matchesWhere(c, args?.where ?? {})).map(withPets)) as any);
  prismaMock.customer.findFirst.mockImplementation((async (args: any) => {
    const found = customers.find((c) => matchesWhere(c, args?.where ?? {}));
    return found ? withPets(found) : null;
  }) as any);
  prismaMock.customer.create.mockImplementation((async (args: any) => ({
    id: 'customer-new',
    isActive: true,
    ...args.data,
    pets: [],
    user: null,
  })) as any);
  prismaMock.appointmentRequest.create.mockImplementation((async (args: any) => ({
    id: 'request-1',
    status: 'PENDING',
    preferredDate: null,
    ...args.data,
  })) as any);
}

function booking(overrides: Record<string, unknown>) {
  return createMockRequest({
    tenantSlug: 'test-clinic',
    customerName: 'Pedro Ruiz',
    customerPhone: '5522223333',
    petName: 'Max',
    service: 'Consulta general',
    ...overrides,
  });
}

function requestData() {
  return (prismaMock.appointmentRequest.create.mock.calls[0][0] as any).data;
}

describe('Public Appointments API - archived customers', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
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

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('treats the phone of an archived customer like an unknown phone', async () => {
    const response = await POST(booking({ customerName: 'Pedro Ruiz', customerPhone: '(55) 2222-3333' }));

    expect(response.status).toBe(200);
    expect(prismaMock.customer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: TENANT_ID, phone: '(55) 2222-3333', source: 'PUBLIC_BOOKING' }),
      })
    );
    expect(requestData()).toEqual(
      expect.objectContaining({ customerId: 'customer-new', petId: null })
    );
    expect(requestData().customerId).not.toBe('customer-archived');
  });

  it('does not match an archived customer by email', async () => {
    const response = await POST(
      booking({ customerName: 'Otro Nombre', customerPhone: '5599990000', customerEmail: 'PEDRO@example.com' })
    );

    expect(response.status).toBe(200);
    expect(prismaMock.customer.create).toHaveBeenCalled();
    expect(requestData().customerId).toBe('customer-new');
  });

  it('never modifies the archived customer', async () => {
    await POST(booking({ customerEmail: 'nuevo@example.com' }));

    expect(prismaMock.customer.update).not.toHaveBeenCalled();
    expect(prismaMock.customer.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.customer.upsert).not.toHaveBeenCalled();
  });

  it('links the active customer when an archived one shares phone and name', async () => {
    const response = await POST(booking({ customerName: 'María Pérez', customerPhone: '5544445555', petName: 'Luna' }));

    expect(response.status).toBe(200);
    expect(prismaMock.customer.create).not.toHaveBeenCalled();
    expect(requestData()).toEqual(
      expect.objectContaining({ customerId: 'customer-maria', petId: 'pet-luna' })
    );
  });

  it('answers an archived phone with the same generic response as an unknown one', async () => {
    const archived = await (await POST(booking({ customerPhone: '5522223333' }))).json();
    const unknown = await (await POST(booking({ customerPhone: '5500001111', customerName: 'Nadie Conocido' }))).json();

    expect(archived).toEqual(unknown);
    expect(JSON.stringify(archived)).not.toContain('customer-archived');
  });
});
