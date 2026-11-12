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
    location: { findFirst: jest.fn() },
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
const locationMock = prisma.location as unknown as { findFirst: jest.Mock };

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
    locationMock.findFirst.mockImplementation(({ where }) =>
      Promise.resolve(where.id === 'loc-1' && where.tenantId === TENANT_ID ? { id: 'loc-1' } : null)
    );
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

    it.each([
      ['a negative price', { price: -1 }, ['price'], 'El precio no puede ser negativo'],
      ['a missing price', { price: undefined }, ['price'], 'Ingresa el precio'],
      ['a price above the MXN storage limit', { price: 100_000_000 }, ['price'], /^El precio no puede ser mayor a /],
      ['a zero duration', { duration: 0 }, ['duration'], 'La duración mínima es 1 minuto'],
      ['a duration above 8 hours', { duration: 481 }, ['duration'], 'La duración máxima es 8 horas'],
      ['a fractional duration', { duration: 30.5 }, ['duration'], 'La duración debe ser un número entero de minutos'],
      ['a one-letter name', { name: 'A' }, ['name'], 'El nombre debe tener al menos 2 caracteres'],
    ])('rejects %s with a Spanish message', async (_label, overrides, path, message) => {
      const response = await POST(jsonRequest('/api/services', 'POST', validBody(overrides)));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Datos inválidos');
      expect(data.details).toContainEqual(
        expect.objectContaining({ path, message: typeof message === 'string' ? message : expect.stringMatching(message) })
      );
      expect(serviceMock.create).not.toHaveBeenCalled();
    });

    it('assigns a location of the caller tenant', async () => {
      const response = await POST(jsonRequest('/api/services', 'POST', validBody({ locationId: 'loc-1' })));

      expect(response.status).toBe(201);
      expect(locationMock.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'loc-1', tenantId: TENANT_ID } })
      );
      expect(serviceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ locationId: 'loc-1' }) })
      );
    });

    it("rejects another tenant's location instead of linking (and returning) it", async () => {
      const response = await POST(jsonRequest('/api/services', 'POST', validBody({ locationId: 'loc-other-tenant' })));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: 'Ubicación no encontrada o no pertenece a esta clínica',
      });
      expect(serviceMock.create).not.toHaveBeenCalled();
    });

    // The services routes only call requireAuth(), so any staff position
    // (e.g. RECEPTIONIST) can create, edit or delete the catalog, while the
    // other settings routes use requirePermission('settings', ...). Changing
    // that is an authorization decision, so it is tracked here, not fixed.
    it.todo('requires the settings:write permission to change the service catalog');
  });

  describe('PUT /api/services/[id]', () => {
    beforeEach(() => {
      serviceMock.findFirst.mockImplementation(({ where }) =>
        Promise.resolve(
          where.id === existingService.id && where.tenantId === existingService.tenantId ? existingService : null
        )
      );
    });

    it('edits the service and returns the updated record', async () => {
      const response = await PUT(
        jsonRequest('/api/services/service-1', 'PUT', validBody({ name: 'Consulta Especializada', price: 500, duration: 45 })),
        params('service-1')
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(
        expect.objectContaining({ id: 'service-1', name: 'Consulta Especializada', price: 500, duration: 45 })
      );
      expect(serviceMock.findFirst).toHaveBeenCalledWith({ where: { id: 'service-1', tenantId: TENANT_ID } });
      expect(serviceMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'service-1' },
          data: expect.objectContaining({ name: 'Consulta Especializada', price: 500, duration: 45 }),
        })
      );
    });

    it('deactivates the service when isActive is false', async () => {
      const response = await PUT(
        jsonRequest('/api/services/service-1', 'PUT', validBody({ isActive: false })),
        params('service-1')
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(expect.objectContaining({ isActive: false }));
      expect(serviceMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isActive: false }) })
      );
      expect(serviceMock.delete).not.toHaveBeenCalled();
    });

    it("cannot edit another tenant's service by id (IDOR)", async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: 'tenant-2' }, user: { id: 'user-2' } });

      const response = await PUT(
        jsonRequest('/api/services/service-1', 'PUT', validBody({ tenantId: 'tenant-2', price: 1 })),
        params('service-1')
      );

      expect(response.status).toBe(404);
      expect(serviceMock.findFirst).toHaveBeenCalledWith({ where: { id: 'service-1', tenantId: 'tenant-2' } });
      expect(serviceMock.update).not.toHaveBeenCalled();
    });

    it("rejects moving the service to another tenant's location", async () => {
      const response = await PUT(
        jsonRequest('/api/services/service-1', 'PUT', validBody({ locationId: 'loc-other-tenant' })),
        params('service-1')
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: 'Ubicación no encontrada o no pertenece a esta clínica',
      });
      expect(serviceMock.update).not.toHaveBeenCalled();
    });

    it('rejects an invalid price with a Spanish message and does not write', async () => {
      const response = await PUT(
        jsonRequest('/api/services/service-1', 'PUT', validBody({ price: -10 })),
        params('service-1')
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details).toContainEqual(
        expect.objectContaining({ path: ['price'], message: 'El precio no puede ser negativo' })
      );
      expect(serviceMock.update).not.toHaveBeenCalled();
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

    it("cannot delete or deactivate another tenant's service by id (IDOR)", async () => {
      mockRequireAuth.mockResolvedValue({ tenant: { id: 'tenant-2' }, user: { id: 'user-2' } });
      serviceMock.findFirst.mockImplementation(({ where }) =>
        Promise.resolve(where.tenantId === existingService.tenantId ? existingService : null)
      );

      const response = await DELETE(jsonRequest('/api/services/service-1', 'DELETE'), params('service-1'));

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: 'Servicio no encontrado' });
      expect(serviceMock.findFirst).toHaveBeenCalledWith({ where: { id: 'service-1', tenantId: 'tenant-2' } });
      expect(saleItemMock.count).not.toHaveBeenCalled();
      expect(serviceMock.update).not.toHaveBeenCalled();
      expect(serviceMock.delete).not.toHaveBeenCalled();
    });
  });
});
