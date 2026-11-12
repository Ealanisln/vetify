/**
 * Services API route tests.
 *
 * These call the real route handlers with Prisma and auth mocked, so they
 * exercise the actual validation, tenant scoping and response shapes.
 */
const mockRequireAuth = jest.fn();

jest.mock('@/lib/auth', () => ({
  requireAuth: () => mockRequireAuth(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    service: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    saleItem: { count: jest.fn() },
    tenantSettings: { findUnique: jest.fn() },
  },
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET, POST } from '@/app/api/services/route';
import { PUT, DELETE } from '@/app/api/services/[id]/route';

const serviceMock = prisma.service as unknown as {
  findMany: jest.Mock;
  findFirst: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};
const saleItemMock = prisma.saleItem as unknown as { count: jest.Mock };
const settingsMock = prisma.tenantSettings as unknown as { findUnique: jest.Mock };

const TENANT_ID = 'tenant-1';

const existingService = {
  id: 'service-1',
  tenantId: TENANT_ID,
  locationId: null,
  name: 'Consulta General',
  description: null,
  category: 'CONSULTATION',
  price: 350,
  duration: 30,
  isActive: true,
};

const validBody = (overrides: Record<string, unknown> = {}) => ({
  name: 'Consulta General',
  description: '',
  category: 'CONSULTATION',
  price: 350,
  duration: 30,
  isActive: true,
  tenantId: TENANT_ID,
  locationId: null,
  isFeatured: false,
  publicIcon: null,
  publicPriceLabel: null,
  ...overrides,
});

const jsonRequest = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    ...(body !== undefined && {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
  });

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('/api/services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    mockRequireAuth.mockResolvedValue({ tenant: { id: TENANT_ID }, user: { id: 'user-1' } });
    settingsMock.findUnique.mockResolvedValue({ currencyCode: 'MXN' });
    serviceMock.findFirst.mockResolvedValue(null);
    serviceMock.create.mockImplementation(({ data }) => Promise.resolve({ id: 'new-service', ...data }));
    serviceMock.update.mockImplementation(({ data }) => Promise.resolve({ ...existingService, ...data }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET', () => {
    it("returns only the authenticated tenant's services", async () => {
      serviceMock.findMany.mockResolvedValue([existingService]);

      const response = await GET(jsonRequest(`/api/services?tenantId=${TENANT_ID}`, 'GET'));

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([existingService]);
      expect(serviceMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT_ID }) })
      );
    });

    it('rejects a tenantId that is not the caller tenant', async () => {
      const response = await GET(jsonRequest('/api/services?tenantId=other-tenant', 'GET'));

      expect(response.status).toBe(403);
      expect(serviceMock.findMany).not.toHaveBeenCalled();
    });
  });

  describe('POST', () => {
    it('creates a service and returns 201', async () => {
      const response = await POST(jsonRequest('/api/services', 'POST', validBody()));

      expect(response.status).toBe(201);
      expect(serviceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Consulta General', price: 350, tenantId: TENANT_ID }),
        })
      );
    });

    it('checks duplicate names case-insensitively', async () => {
      serviceMock.findFirst.mockResolvedValue(existingService);

      const response = await POST(jsonRequest('/api/services', 'POST', validBody({ name: 'consulta general' })));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Ya existe un servicio con este nombre' });
      expect(serviceMock.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId: TENANT_ID,
          name: { equals: 'consulta general', mode: 'insensitive' },
        },
      });
      expect(serviceMock.create).not.toHaveBeenCalled();
    });

    it('accepts prices above 99,999 for a zero-decimal currency (CLP)', async () => {
      settingsMock.findUnique.mockResolvedValue({ currencyCode: 'CLP' });

      const response = await POST(jsonRequest('/api/services', 'POST', validBody({ price: 350_000 })));

      expect(response.status).toBe(201);
      expect(settingsMock.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: TENANT_ID } })
      );
    });

    it('accepts prices above 99,999 for MXN too, up to the storage limit', async () => {
      const response = await POST(jsonRequest('/api/services', 'POST', validBody({ price: 150_000 })));

      expect(response.status).toBe(201);
    });

    it('rejects prices beyond the Decimal(10,2) storage limit', async () => {
      const response = await POST(jsonRequest('/api/services', 'POST', validBody({ price: 100_000_000 })));

      expect(response.status).toBe(400);
      expect(serviceMock.create).not.toHaveBeenCalled();
    });

    it('falls back to MXN limits when the tenant has no settings row', async () => {
      settingsMock.findUnique.mockResolvedValue(null);

      const response = await POST(jsonRequest('/api/services', 'POST', validBody({ price: 500 })));

      expect(response.status).toBe(201);
    });

    it('accepts a service without duration (null)', async () => {
      const response = await POST(jsonRequest('/api/services', 'POST', validBody({ duration: null })));

      expect(response.status).toBe(201);
      expect(serviceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ duration: null }) })
      );
    });

    it('rejects a body for another tenant', async () => {
      const response = await POST(jsonRequest('/api/services', 'POST', validBody({ tenantId: 'other-tenant' })));

      expect(response.status).toBe(403);
      expect(serviceMock.create).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/services/[id]', () => {
    beforeEach(() => {
      serviceMock.findFirst.mockImplementation(({ where }) =>
        Promise.resolve(where.id === existingService.id ? existingService : null)
      );
    });

    it('checks duplicate names case-insensitively, excluding the service itself', async () => {
      serviceMock.findFirst
        .mockResolvedValueOnce(existingService)
        .mockResolvedValueOnce({ ...existingService, id: 'service-2', name: 'Vacunación' });

      const response = await PUT(
        jsonRequest('/api/services/service-1', 'PUT', validBody({ name: 'VACUNACIÓN' })),
        params('service-1')
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Ya existe un servicio con este nombre' });
      expect(serviceMock.findFirst).toHaveBeenLastCalledWith({
        where: {
          tenantId: TENANT_ID,
          name: { equals: 'VACUNACIÓN', mode: 'insensitive' },
          id: { not: 'service-1' },
        },
      });
      expect(serviceMock.update).not.toHaveBeenCalled();
    });

    it('clears the duration when it is sent as null', async () => {
      const response = await PUT(
        jsonRequest('/api/services/service-1', 'PUT', validBody({ duration: null })),
        params('service-1')
      );

      expect(response.status).toBe(200);
      expect(serviceMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ duration: null }) })
      );
    });

    it('accepts a CLP price above 99,999', async () => {
      settingsMock.findUnique.mockResolvedValue({ currencyCode: 'CLP' });

      const response = await PUT(
        jsonRequest('/api/services/service-1', 'PUT', validBody({ price: 350_000 })),
        params('service-1')
      );

      expect(response.status).toBe(200);
    });

    it('returns 404 for a service outside the tenant', async () => {
      const response = await PUT(
        jsonRequest('/api/services/missing', 'PUT', validBody()),
        params('missing')
      );

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/services/[id]', () => {
    beforeEach(() => {
      serviceMock.findFirst.mockResolvedValue(existingService);
    });

    it('deactivates instead of deleting when the service has sales, and says so', async () => {
      saleItemMock.count.mockResolvedValue(3);

      const response = await DELETE(jsonRequest('/api/services/service-1', 'DELETE'), params('service-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(serviceMock.delete).not.toHaveBeenCalled();
      expect(serviceMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'service-1' }, data: { isActive: false } })
      );
      expect(data.message).toMatch(/desactivado/i);
      expect(data.service).toEqual(expect.objectContaining({ id: 'service-1', isActive: false }));
    });

    it('deletes a service without sales', async () => {
      saleItemMock.count.mockResolvedValue(0);

      const response = await DELETE(jsonRequest('/api/services/service-1', 'DELETE'), params('service-1'));

      expect(response.status).toBe(200);
      expect(serviceMock.delete).toHaveBeenCalledWith({ where: { id: 'service-1' } });
      await expect(response.json()).resolves.toEqual({ message: 'Servicio eliminado correctamente' });
    });

    it('returns 404 when the service is not in the tenant', async () => {
      serviceMock.findFirst.mockResolvedValue(null);

      const response = await DELETE(jsonRequest('/api/services/x', 'DELETE'), params('x'));

      expect(response.status).toBe(404);
    });
  });
});
