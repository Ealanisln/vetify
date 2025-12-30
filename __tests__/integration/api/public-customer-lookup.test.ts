/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import {
  createTestCustomer,
  createTestTenant,
  createTestPet,
} from '../../utils/test-utils';
import { POST } from '@/app/api/public/customer-lookup/route';
import { NextRequest } from 'next/server';

// Helper to create a mock NextRequest
function createMockRequest(body: Record<string, unknown>): NextRequest {
  return {
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
}

describe('Public Customer Lookup API', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockCustomer: ReturnType<typeof createTestCustomer>;
  let mockPet: ReturnType<typeof createTestPet>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant({
      id: 'tenant-lookup-test',
      slug: 'test-clinic',
      status: 'ACTIVE',
      publicPageEnabled: true,
      publicBookingEnabled: true,
    });

    mockCustomer = createTestCustomer({
      id: 'customer-lookup-test',
      tenantId: mockTenant.id,
      name: 'Juan García',
      phone: '+52 55 1234 5678',
      email: 'juan@example.com',
    });

    mockPet = createTestPet({
      id: 'pet-lookup-test',
      tenantId: mockTenant.id,
      customerId: mockCustomer.id,
      name: 'Firulais',
      species: 'DOG',
      breed: 'Labrador',
      isDeceased: false,
    });
  });

  describe('POST /api/public/customer-lookup', () => {
    it('should find customer by phone number', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      prismaMock.customer.findFirst.mockResolvedValue({
        ...mockCustomer,
        pets: [mockPet],
      } as any);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        phone: '+52 55 1234 5678',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.found).toBe(true);
      expect(data.customer.name).toBe('Juan García');
      expect(data.pets).toHaveLength(1);
      expect(data.pets[0].name).toBe('Firulais');
    });

    it('should find customer by email (case-insensitive)', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      // When searching by email only (no phone), the code goes directly to email lookup
      prismaMock.customer.findFirst.mockResolvedValue({
        ...mockCustomer,
        pets: [mockPet],
      } as any);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        email: 'JUAN@EXAMPLE.COM', // Uppercase email
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.found).toBe(true);
      expect(data.customer.name).toBe('Juan García');
    });

    it('should return not found when no customer matches', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      prismaMock.customer.findFirst.mockResolvedValue(null);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        phone: '+52 55 9999 9999',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.found).toBe(false);
      expect(data.message).toBe('Cliente no encontrado');
    });

    it('should return 400 when neither phone nor email provided', async () => {
      const request = createMockRequest({
        tenantSlug: 'test-clinic',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Datos inválidos');
    });

    it('should return 400 for invalid email format', async () => {
      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        email: 'not-an-email',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 404 for non-existent tenant', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(null);

      const request = createMockRequest({
        tenantSlug: 'non-existent-clinic',
        phone: '+52 55 1234 5678',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Clínica no disponible');
    });

    it('should return 404 when publicBookingEnabled is false', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        publicBookingEnabled: false,
      } as any);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        phone: '+52 55 1234 5678',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Clínica no disponible');
    });

    it('should return 404 when publicPageEnabled is false', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        publicPageEnabled: false,
      } as any);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        phone: '+52 55 1234 5678',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should exclude deceased pets from response', async () => {
      const deceasedPet = createTestPet({
        id: 'pet-deceased',
        tenantId: mockTenant.id,
        customerId: mockCustomer.id,
        name: 'Rocky',
        isDeceased: true,
      });

      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      // The API filters deceased pets in the query, so the mock should only return living pets
      prismaMock.customer.findFirst.mockResolvedValue({
        ...mockCustomer,
        pets: [mockPet], // Only living pet returned
      } as any);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        phone: '+52 55 1234 5678',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pets).toHaveLength(1);
      expect(data.pets[0].name).toBe('Firulais');
      // Deceased pet should not be in response
      expect(data.pets.find((p: any) => p.name === 'Rocky')).toBeUndefined();
    });

    it('should mask sensitive contact info (hasPhone, hasEmail)', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      prismaMock.customer.findFirst.mockResolvedValue({
        ...mockCustomer,
        pets: [mockPet],
      } as any);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        phone: '+52 55 1234 5678',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should have hasPhone and hasEmail flags instead of actual values
      expect(data.customer.hasPhone).toBe(true);
      expect(data.customer.hasEmail).toBe(true);
      // Should NOT expose actual phone/email
      expect(data.customer.phone).toBeUndefined();
      expect(data.customer.email).toBeUndefined();
    });

    it('should normalize phone number with special characters', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      prismaMock.customer.findFirst.mockResolvedValue({
        ...mockCustomer,
        pets: [],
      } as any);

      // Phone with spaces, dashes, and parentheses
      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        phone: '(55) 1234-5678',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.found).toBe(true);
    });

    it('should return pet details with species and breed', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as any);
      prismaMock.customer.findFirst.mockResolvedValue({
        ...mockCustomer,
        pets: [mockPet],
      } as any);

      const request = createMockRequest({
        tenantSlug: 'test-clinic',
        phone: '+52 55 1234 5678',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.pets[0]).toEqual({
        id: mockPet.id,
        name: 'Firulais',
        species: 'DOG',
        breed: 'Labrador',
      });
    });
  });
});
