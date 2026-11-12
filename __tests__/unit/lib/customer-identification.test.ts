/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import {
  findOrCreateCustomer,
  createPublicAppointmentRequest,
} from '@/lib/customer-identification';

const TENANT_ID = 'tenant-1';

type StoredCustomer = {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  email: string | null;
  pets: Array<{ id: string; name: string; species: string }>;
  user: null;
};

/**
 * Minimal in-memory customer table. findMany/findFirst honour the tenant,
 * phone `contains`, email and id filters the code sends, so the matching
 * logic under test runs against realistic rows instead of canned answers.
 */
function useCustomerTable(rows: StoredCustomer[]) {
  const matchesWhere = (c: StoredCustomer, where: any): boolean => {
    if (where?.tenantId && c.tenantId !== where.tenantId) return false;
    if (where?.id && c.id !== where.id) return false;
    if (where?.phone?.contains !== undefined) {
      if (!c.phone || !c.phone.includes(where.phone.contains)) return false;
    }
    if (typeof where?.phone === 'string' && c.phone !== where.phone) return false;
    if (where?.email !== undefined) {
      const wanted = typeof where.email === 'string' ? where.email : where.email.equals;
      const insensitive = typeof where.email === 'object' && where.email.mode === 'insensitive';
      const stored = c.email ?? '';
      if (insensitive ? stored.toLowerCase() !== String(wanted).toLowerCase() : stored !== wanted) {
        return false;
      }
    }
    if (where?.OR) return false; // fuzzy name search: no similar customers in these tests
    return true;
  };

  prismaMock.customer.findMany.mockImplementation((async (args: any) =>
    rows.filter((c) => matchesWhere(c, args?.where))) as any);
  prismaMock.customer.findFirst.mockImplementation((async (args: any) =>
    rows.find((c) => matchesWhere(c, args?.where)) ?? null) as any);
  prismaMock.customer.create.mockImplementation((async (args: any) => ({
    id: 'created-customer',
    ...args.data,
    pets: [],
    user: null,
  })) as any);
  prismaMock.appointmentRequest.create.mockImplementation((async (args: any) => ({
    id: 'request-1',
    ...args.data,
  })) as any);
}

const juan: StoredCustomer = {
  id: 'customer-juan',
  tenantId: TENANT_ID,
  name: 'Juan García',
  phone: '55 12 34 56 78',
  email: null,
  pets: [{ id: 'pet-firulais', name: 'Firulais', species: 'DOG' }],
  user: null,
};

describe('findOrCreateCustomer', () => {
  it('matches an existing customer whose phone is stored in another format', async () => {
    useCustomerTable([juan]);

    const result = await findOrCreateCustomer({
      tenantId: TENANT_ID,
      phone: '+52 (55) 1234-5678',
      name: 'Juan García',
    });

    expect(result.status).toBe('existing');
    expect(result.customer.id).toBe('customer-juan');
    expect(prismaMock.customer.create).not.toHaveBeenCalled();
  });

  it('only searches customers of the same clinic', async () => {
    useCustomerTable([{ ...juan, tenantId: 'other-tenant' }]);

    const result = await findOrCreateCustomer({
      tenantId: TENANT_ID,
      phone: '5512345678',
      name: 'Juan García',
    });

    expect(result.status).toBe('new');
    expect(prismaMock.customer.create).toHaveBeenCalled();
  });

  it('does not match a different number that only shares some digits', async () => {
    useCustomerTable([{ ...juan, phone: '+52 99 1234 5678 78' }]);

    const result = await findOrCreateCustomer({
      tenantId: TENANT_ID,
      phone: '5512345678',
      name: 'Juan García',
    });

    expect(result.status).toBe('new');
    expect(prismaMock.customer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ phone: '5512345678', source: 'PUBLIC_BOOKING' }),
      })
    );
  });

  it('never writes the caller email onto an existing customer matched by phone', async () => {
    useCustomerTable([juan]);

    const result = await findOrCreateCustomer({
      tenantId: TENANT_ID,
      phone: '5512345678',
      email: 'someone-else@example.com',
      name: 'Juan García',
    });

    expect(result.status).toBe('existing');
    expect(prismaMock.customer.update).not.toHaveBeenCalled();
    expect(result.customer.email).toBeNull();
  });

  it('never writes the caller phone onto an existing customer matched by email', async () => {
    useCustomerTable([{ ...juan, phone: null, email: 'juan@example.com' }]);

    const result = await findOrCreateCustomer({
      tenantId: TENANT_ID,
      phone: '5599998888',
      email: 'juan@example.com',
      name: 'Juan García',
    });

    expect(result.status).toBe('existing');
    expect(prismaMock.customer.update).not.toHaveBeenCalled();
    expect(result.customer.phone).toBeNull();
  });
});

describe('createPublicAppointmentRequest', () => {
  it('keeps the selected pet when the booking phone is formatted differently', async () => {
    useCustomerTable([juan]);

    const identification = await findOrCreateCustomer({
      tenantId: TENANT_ID,
      phone: '(55) 1234-5678',
      name: 'Juan García',
    });
    await createPublicAppointmentRequest({
      tenantId: TENANT_ID,
      customerId: identification.customer.id,
      appointmentData: { petId: 'pet-firulais', petName: 'Firulais' },
      identificationResult: identification,
    });

    expect(prismaMock.appointmentRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'customer-juan',
          petId: 'pet-firulais',
        }),
      })
    );
  });

  it('stores contact data that differs from the customer record on the request', async () => {
    useCustomerTable([juan]);

    const identification = await findOrCreateCustomer({
      tenantId: TENANT_ID,
      phone: '5512345678',
      email: 'someone-else@example.com',
      name: 'Juan García',
    });
    await createPublicAppointmentRequest({
      tenantId: TENANT_ID,
      customerId: identification.customer.id,
      appointmentData: { petName: 'Firulais' },
      identificationResult: identification,
    });

    const data = prismaMock.appointmentRequest.create.mock.calls[0][0].data as any;
    expect(data.reviewNotes).toContain('someone-else@example.com');
  });

  it('adds no contact note when the caller data matches the record', async () => {
    useCustomerTable([{ ...juan, email: 'juan@example.com' }]);

    const identification = await findOrCreateCustomer({
      tenantId: TENANT_ID,
      phone: '55 1234 5678',
      email: 'JUAN@example.com',
      name: 'juan garcia',
    });
    await createPublicAppointmentRequest({
      tenantId: TENANT_ID,
      customerId: identification.customer.id,
      appointmentData: { petName: 'Firulais' },
      identificationResult: identification,
    });

    const data = prismaMock.appointmentRequest.create.mock.calls[0][0].data as any;
    expect(data.reviewNotes ?? '').not.toContain('Datos de contacto');
  });
});
