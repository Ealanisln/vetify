/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-function-type */
/**
 * Integration tests for V1 Pets API routes
 *
 * Routes tested:
 * - GET/POST /api/v1/pets
 * - GET/PUT/DELETE /api/v1/pets/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { prismaMock } from '../../mocks/prisma';

// --- Mock API key auth ---
const mockApiKeyAuth = {
  apiKey: {
    id: 'key-1',
    key: 'vfy_test_key',
    tenantId: 'tenant-1',
    locationId: null,
    scopes: ['read:pets', 'write:pets'],
    rateLimit: 1000,
    isActive: true,
    tenant: { id: 'tenant-1', name: 'Test Clinic' },
    location: null,
  },
  locationId: null as string | null,
};

jest.mock('@/lib/api/api-key-auth', () => ({
  withApiAuth: (handler: Function, _options?: any) => {
    return async (request: any, context?: any) => {
      const params = context?.params ? await context.params : undefined;
      return handler(request, { ...mockApiKeyAuth, params });
    };
  },
  apiError: (error: string, code: string, status: number, details?: string) => {
    return NextResponse.json({ error, code, ...(details && { details }) }, { status });
  },
  parsePaginationParams: (request: any) => {
    const url = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '50')), 100);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));
    return { limit, offset };
  },
  paginatedResponse: (data: any[], total: number, pagination: { limit: number; offset: number }) => ({
    data,
    meta: { total, limit: pagination.limit, offset: pagination.offset, hasMore: pagination.offset + data.length < total },
  }),
  buildWhereClause: (apiKey: any, locationId: string | null, additionalWhere: any = {}) => ({
    tenantId: apiKey.tenantId,
    ...(locationId && { locationId }),
    ...additionalWhere,
  }),
}));

jest.mock('@/app/api/v1/_shared/serializers', () => ({
  serializePet: (pet: any) => ({
    id: pet.id,
    internalId: pet.internalId,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    dateOfBirth: pet.dateOfBirth?.toISOString?.() ?? pet.dateOfBirth,
    gender: pet.gender,
    weight: pet.weight ? Number(pet.weight) : null,
    weightUnit: pet.weightUnit,
    microchipNumber: pet.microchipNumber,
    isNeutered: pet.isNeutered,
    isDeceased: pet.isDeceased,
    profileImage: pet.profileImage,
    customerId: pet.customerId,
    locationId: pet.locationId,
    createdAt: pet.createdAt?.toISOString?.() ?? pet.createdAt,
    updatedAt: pet.updatedAt?.toISOString?.() ?? pet.updatedAt,
  }),
  serializeCustomerSummary: (customer: any) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
  }),
}));

jest.mock('@/lib/webhooks', () => ({
  triggerWebhookEvent: jest.fn(),
}));

// Import route handlers AFTER mocks
import { GET as getPets, POST as createPet } from '@/app/api/v1/pets/route';
import { GET as getPet, PUT as updatePet, DELETE as deletePet } from '@/app/api/v1/pets/[id]/route';

// --- Helpers ---
function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

const now = new Date();

const mockPet = {
  id: 'pet-1',
  tenantId: 'tenant-1',
  customerId: '00000000-0000-0000-0000-000000000001',
  locationId: null,
  internalId: 'P001',
  name: 'Luna',
  species: 'Dog',
  breed: 'Labrador',
  dateOfBirth: new Date('2022-03-15'),
  gender: 'female',
  weight: 25,
  weightUnit: 'kg',
  microchipNumber: 'MC123',
  isNeutered: true,
  isDeceased: false,
  profileImage: null,
  createdAt: now,
  updatedAt: now,
  customer: { id: '00000000-0000-0000-0000-000000000001', name: 'Maria Garcia', email: 'maria@test.com', phone: '555-1234' },
};

let consoleSpy: jest.SpyInstance;

beforeEach(() => {
  consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  mockApiKeyAuth.locationId = null;
});

afterEach(() => {
  consoleSpy.mockRestore();
});

// =============================================================================
// GET /api/v1/pets
// =============================================================================
describe('GET /api/v1/pets', () => {
  it('should return pets with customer info', async () => {
    (prismaMock.pet.findMany as jest.Mock).mockResolvedValue([mockPet]);
    (prismaMock.pet.count as jest.Mock).mockResolvedValue(1);

    const req = makeRequest('http://localhost:3000/api/v1/pets');
    const res = await getPets(req, {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Luna');
    expect(body.data[0].customer).toBeDefined();
    expect(body.data[0].customer.name).toBe('Maria Garcia');
    expect(body.meta.total).toBe(1);
  });

  it('should filter by species', async () => {
    (prismaMock.pet.findMany as jest.Mock).mockResolvedValue([mockPet]);
    (prismaMock.pet.count as jest.Mock).mockResolvedValue(1);

    const req = makeRequest('http://localhost:3000/api/v1/pets?species=Dog');
    const res = await getPets(req, {});

    expect(res.status).toBe(200);
    expect(prismaMock.pet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          species: expect.objectContaining({ equals: 'Dog', mode: 'insensitive' }),
        }),
      })
    );
  });

  it('should filter by customerId', async () => {
    (prismaMock.pet.findMany as jest.Mock).mockResolvedValue([mockPet]);
    (prismaMock.pet.count as jest.Mock).mockResolvedValue(1);

    const req = makeRequest('http://localhost:3000/api/v1/pets?customerId=00000000-0000-0000-0000-000000000001');
    const res = await getPets(req, {});

    expect(res.status).toBe(200);
    expect(prismaMock.pet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ customerId: '00000000-0000-0000-0000-000000000001' }),
      })
    );
  });
});

// =============================================================================
// POST /api/v1/pets
// =============================================================================
describe('POST /api/v1/pets', () => {
  const createPayload = {
    name: 'Firulais',
    species: 'Dog',
    breed: 'Mixed',
    dateOfBirth: '2023-01-10',
    gender: 'male',
    customerId: '00000000-0000-0000-0000-000000000001',
  };

  it('should create pet', async () => {
    (prismaMock.customer.findFirst as jest.Mock).mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      tenantId: 'tenant-1',
      isActive: true,
      locationId: null,
    });
    const created = {
      ...mockPet,
      id: 'pet-new',
      name: 'Firulais',
      species: 'Dog',
      breed: 'Mixed',
    };
    (prismaMock.pet.create as jest.Mock).mockResolvedValue(created);

    const req = makeRequest('http://localhost:3000/api/v1/pets', {
      method: 'POST',
      body: JSON.stringify(createPayload),
    });
    const res = await createPet(req, {});
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.id).toBe('pet-new');
    expect(body.data.name).toBe('Firulais');
  });

  it('should require name, species, breed, dateOfBirth, gender, customerId', async () => {
    const req = makeRequest('http://localhost:3000/api/v1/pets', {
      method: 'POST',
      body: JSON.stringify({ name: 'OnlyName' }),
    });
    const res = await createPet(req, {});
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});

// =============================================================================
// GET /api/v1/pets/[id]
// =============================================================================
describe('GET /api/v1/pets/[id]', () => {
  it('should return pet with customer', async () => {
    (prismaMock.pet.findFirst as jest.Mock).mockResolvedValue(mockPet);

    const req = makeRequest('http://localhost:3000/api/v1/pets/pet-1');
    const res = await getPet(req, { params: Promise.resolve({ id: 'pet-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.id).toBe('pet-1');
    expect(body.data.customer).toBeDefined();
    expect(body.data.customer.name).toBe('Maria Garcia');
  });
});

// =============================================================================
// PUT /api/v1/pets/[id]
// =============================================================================
describe('PUT /api/v1/pets/[id]', () => {
  it('should update pet', async () => {
    const updated = { ...mockPet, name: 'Luna Updated' };
    (prismaMock.pet.findFirst as jest.Mock).mockResolvedValue(mockPet);
    (prismaMock.pet.update as jest.Mock).mockResolvedValue(updated);

    const req = makeRequest('http://localhost:3000/api/v1/pets/pet-1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Luna Updated' }),
    });
    const res = await updatePet(req, { params: Promise.resolve({ id: 'pet-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.name).toBe('Luna Updated');
  });
});

// =============================================================================
// DELETE /api/v1/pets/[id]
// =============================================================================
describe('DELETE /api/v1/pets/[id]', () => {
  it('should soft delete (isDeceased=true)', async () => {
    (prismaMock.pet.findFirst as jest.Mock).mockResolvedValue(mockPet);
    (prismaMock.pet.update as jest.Mock).mockResolvedValue({ ...mockPet, isDeceased: true });

    const req = makeRequest('http://localhost:3000/api/v1/pets/pet-1', { method: 'DELETE' });
    const res = await deletePet(req, { params: Promise.resolve({ id: 'pet-1' }) });

    expect(res.status).toBe(204);
    expect(prismaMock.pet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pet-1' },
        data: expect.objectContaining({ isDeceased: true }),
      })
    );
  });
});
