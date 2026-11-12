/**
 * @jest-environment node
 */

// Regression: createCustomerSchema had no locationId, so Zod stripped the
// location NewCustomerForm sends and every customer was saved without one.
// The duplicate-email check was also case-sensitive.
// Found by the flows audit (docs/AUDITORIA-FLUJOS-2026-11.md, section 2).

jest.mock('@/lib/prisma', () => ({
  prisma: {
    customer: { findFirst: jest.fn(), create: jest.fn() },
    location: { findFirst: jest.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { createCustomer, createCustomerSchema } from '@/lib/customers';

const mockCustomerFindFirst = prisma.customer.findFirst as jest.Mock;
const mockCustomerCreate = prisma.customer.create as jest.Mock;
const mockLocationFindFirst = prisma.location.findFirst as jest.Mock;

type EmailFilter = string | { equals: string; mode?: 'insensitive' | 'default' };

// Stands in for Postgres: one active customer stored as "Juan@Test.com"
function emailLookupLikePostgres(stored: string) {
  return async ({ where }: { where: { email: EmailFilter } }) => {
    const filter = where.email;
    const matches =
      typeof filter === 'string'
        ? filter === stored
        : filter.mode === 'insensitive'
          ? filter.equals.toLowerCase() === stored.toLowerCase()
          : filter.equals === stored;
    return matches ? { id: 'existing', name: 'Juan', email: stored, location: null } : null;
  };
}

describe('createCustomer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCustomerFindFirst.mockResolvedValue(null);
    mockCustomerCreate.mockImplementation(async ({ data }) => ({ id: 'customer-1', ...data }));
  });

  describe('location', () => {
    it('keeps locationId through schema validation', () => {
      expect(createCustomerSchema.parse({ name: 'Ana', locationId: 'loc-1' }).locationId).toBe('loc-1');
      expect(createCustomerSchema.parse({ name: 'Ana', locationId: null }).locationId).toBeNull();
      expect(createCustomerSchema.parse({ name: 'Ana' }).locationId).toBeUndefined();
    });

    it('saves the location when it belongs to the tenant', async () => {
      mockLocationFindFirst.mockResolvedValue({ id: 'loc-1' });

      await createCustomer('tenant-1', createCustomerSchema.parse({ name: 'Ana', locationId: 'loc-1' }));

      expect(mockLocationFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: 'loc-1', tenantId: 'tenant-1' }) })
      );
      expect(mockCustomerCreate.mock.calls[0][0].data.locationId).toBe('loc-1');
    });

    it('rejects a location from another tenant in Spanish', async () => {
      mockLocationFindFirst.mockResolvedValue(null);

      await expect(
        createCustomer('tenant-1', createCustomerSchema.parse({ name: 'Ana', locationId: 'loc-other' }))
      ).rejects.toThrow('Ubicación no encontrada o no pertenece a esta clínica');
      expect(mockCustomerCreate).not.toHaveBeenCalled();
    });

    it('creates the customer without a location when none is given', async () => {
      await createCustomer('tenant-1', createCustomerSchema.parse({ name: 'Ana' }));

      expect(mockLocationFindFirst).not.toHaveBeenCalled();
      expect(mockCustomerCreate.mock.calls[0][0].data.locationId ?? null).toBeNull();
    });
  });

  describe('duplicate email', () => {
    it('finds an existing customer whatever the email case', async () => {
      mockCustomerFindFirst.mockImplementation(emailLookupLikePostgres('Juan@Test.com'));

      await expect(
        createCustomer('tenant-1', createCustomerSchema.parse({ name: 'Juan', email: 'juan@test.com' }))
      ).rejects.toThrow(/Ya existe un cliente "Juan"/);
      expect(mockCustomerCreate).not.toHaveBeenCalled();
    });

    it('still creates a customer with a different email', async () => {
      mockCustomerFindFirst.mockImplementation(emailLookupLikePostgres('Juan@Test.com'));

      await createCustomer('tenant-1', createCustomerSchema.parse({ name: 'Ana', email: 'ana@test.com' }));

      expect(mockCustomerCreate).toHaveBeenCalledTimes(1);
    });
  });
});
