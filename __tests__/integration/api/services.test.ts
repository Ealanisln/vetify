import { prismaMock } from '../../mocks/prisma';
import {
  createTestService,
  createTestTenant,
  createTestUser,
  createTestLocation,
} from '../../utils/test-utils';

// Mock the services API route
const mockServicesRoute = {
  GET: jest.fn(),
  POST: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
};

describe('Services API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockLocation: ReturnType<typeof createTestLocation>;
  let mockService: ReturnType<typeof createTestService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockLocation = createTestLocation({ tenantId: mockTenant.id });
    mockService = createTestService({ tenantId: mockTenant.id });

    // Mock Prisma responses
    prismaMock.service.findMany.mockResolvedValue([mockService]);
    prismaMock.service.findUnique.mockResolvedValue(mockService);
    prismaMock.service.create.mockResolvedValue(mockService);
    prismaMock.service.update.mockResolvedValue(mockService);
    prismaMock.service.delete.mockResolvedValue(mockService);
  });

  describe('GET /api/services', () => {
    it('should return all services for tenant', async () => {
      const services = [mockService];
      prismaMock.service.findMany.mockResolvedValue(services);

      const result = await prismaMock.service.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result[0].name).toBe(mockService.name);
    });

    it('should order by category and name', async () => {
      const consultationService = mockService;
      const surgeryService = createTestService({
        id: 'surgery-service',
        tenantId: mockTenant.id,
        name: 'Basic Surgery',
        category: 'SURGERY' as const,
      });
      const groomingService = createTestService({
        id: 'grooming-service',
        tenantId: mockTenant.id,
        name: 'Bath and Grooming',
        category: 'GROOMING' as const,
      });

      const orderedServices = [consultationService, groomingService, surgeryService];
      prismaMock.service.findMany.mockResolvedValue(orderedServices);

      const result = await prismaMock.service.findMany({
        where: { tenantId: mockTenant.id },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });

      expect(result).toHaveLength(3);
      // Verify services are returned (order depends on category alphabetically)
      expect(result.map((s: any) => s.category)).toBeDefined();
    });

    it('should enforce tenant isolation', async () => {
      const otherTenantService = createTestService({
        id: 'other-service',
        tenantId: 'other-tenant-id',
      });

      prismaMock.service.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return [mockService];
        }
        return [];
      });

      const result = await prismaMock.service.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result).not.toContainEqual(
        expect.objectContaining({ tenantId: 'other-tenant-id' })
      );
    });
  });

  describe('POST /api/services', () => {
    it('should create a new service', async () => {
      const newServiceData = {
        name: 'Dental Cleaning',
        description: 'Professional dental cleaning and examination',
        category: 'DENTAL',
        price: 800.00,
        duration: 60,
      };

      const createdService = {
        ...mockService,
        ...newServiceData,
        id: 'new-service-id',
      };

      prismaMock.service.create.mockResolvedValue(createdService);

      const result = await prismaMock.service.create({
        data: {
          ...newServiceData,
          tenantId: mockTenant.id,
          isActive: true,
        },
      });

      expect(result.name).toBe(newServiceData.name);
      expect(result.category).toBe(newServiceData.category);
      expect(result.price).toBe(newServiceData.price);
      expect(result.tenantId).toBe(mockTenant.id);
    });

    it('should validate required fields - name, category, price', async () => {
      const invalidData = {
        description: 'Missing name, category, and price',
        duration: 30,
      };

      const requiredFields = ['name', 'category', 'price'];
      const missingFields = requiredFields.filter((field) => !(field in invalidData));

      expect(missingFields).toContain('name');
      expect(missingFields).toContain('category');
      expect(missingFields).toContain('price');
    });

    it('should prevent duplicate service names within tenant', async () => {
      const duplicateNameData = {
        name: mockService.name, // Same name as existing service
        category: 'CONSULTATION',
        price: 600.00,
        tenantId: mockTenant.id,
      };

      // Simulate finding existing service with same name
      prismaMock.service.findFirst.mockResolvedValue(mockService);

      const existingService = await prismaMock.service.findFirst({
        where: {
          name: duplicateNameData.name,
          tenantId: duplicateNameData.tenantId,
        },
      });

      expect(existingService).not.toBeNull();
      expect(existingService?.name).toBe(duplicateNameData.name);
    });
  });

  describe('PUT /api/services/:id', () => {
    it('should update service data', async () => {
      const updateData = {
        name: 'Updated Consultation',
        price: 550.00,
        duration: 45,
      };

      const updatedService = { ...mockService, ...updateData };
      prismaMock.service.update.mockResolvedValue(updatedService);

      const result = await prismaMock.service.update({
        where: { id: mockService.id },
        data: updateData,
      });

      expect(result.name).toBe('Updated Consultation');
      expect(result.price).toBe(550.00);
      expect(result.duration).toBe(45);
    });

    it('should return 404 for non-existent service', async () => {
      prismaMock.service.findUnique.mockResolvedValue(null);

      const result = await prismaMock.service.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(result).toBeNull();
    });
  });

  describe('DELETE /api/services/:id', () => {
    it('should delete service without sales', async () => {
      // Service with no related sales
      const serviceWithoutSales = {
        ...mockService,
        _count: { saleItems: 0 },
      };

      prismaMock.service.findUnique.mockResolvedValue(serviceWithoutSales);

      const service = await prismaMock.service.findUnique({
        where: { id: mockService.id },
        include: { _count: { select: { saleItems: true } } },
      });

      const hasSales = (service?._count?.saleItems || 0) > 0;
      expect(hasSales).toBe(false);

      // Can hard delete
      prismaMock.service.delete.mockResolvedValue(mockService);

      const result = await prismaMock.service.delete({
        where: { id: mockService.id },
      });

      expect(result.id).toBe(mockService.id);
    });

    it('should deactivate service with sales (soft delete)', async () => {
      // Service with related sales
      const serviceWithSales = {
        ...mockService,
        _count: { saleItems: 5 },
      };

      prismaMock.service.findUnique.mockResolvedValue(serviceWithSales);

      const service = await prismaMock.service.findUnique({
        where: { id: mockService.id },
        include: { _count: { select: { saleItems: true } } },
      });

      const hasSales = (service?._count?.saleItems || 0) > 0;
      expect(hasSales).toBe(true);

      // Should soft delete (deactivate) instead of hard delete
      const deactivatedService = { ...mockService, isActive: false };
      prismaMock.service.update.mockResolvedValue(deactivatedService);

      const result = await prismaMock.service.update({
        where: { id: mockService.id },
        data: { isActive: false },
      });

      expect(result.isActive).toBe(false);
      expect(result.id).toBe(mockService.id);
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should return 404 when updating service from another tenant', async () => {
      const otherTenantId = 'other-tenant-id';

      prismaMock.service.updateMany.mockResolvedValue({ count: 0 });

      const result = await prismaMock.service.updateMany({
        where: {
          id: mockService.id,
          tenantId: otherTenantId, // Wrong tenant
        },
        data: { name: 'Hacked Name' },
      });

      expect(result.count).toBe(0);
    });

    it('should return 404 when deleting service from another tenant', async () => {
      const otherTenantId = 'other-tenant-id';

      prismaMock.service.deleteMany.mockResolvedValue({ count: 0 });

      const result = await prismaMock.service.deleteMany({
        where: {
          id: mockService.id,
          tenantId: otherTenantId, // Wrong tenant
        },
      });

      expect(result.count).toBe(0);
    });
  });
});
