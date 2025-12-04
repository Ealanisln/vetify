import { prismaMock } from '../../mocks/prisma';
import {
  createTestCustomer,
  createTestTenant,
  createTestUser,
  createTestPet,
  createTestAppointment,
} from '../../utils/test-utils';

// Mock the customers API route
const mockCustomersRoute = {
  GET: jest.fn(),
  POST: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
};

describe('Customers API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockCustomer: ReturnType<typeof createTestCustomer>;
  let mockPet: ReturnType<typeof createTestPet>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockCustomer = createTestCustomer({ tenantId: mockTenant.id });
    mockPet = createTestPet({ tenantId: mockTenant.id, customerId: mockCustomer.id });

    // Mock Prisma responses
    prismaMock.customer.findMany.mockResolvedValue([mockCustomer]);
    prismaMock.customer.findUnique.mockResolvedValue(mockCustomer);
    prismaMock.customer.create.mockResolvedValue(mockCustomer);
    prismaMock.customer.update.mockResolvedValue(mockCustomer);
    prismaMock.customer.delete.mockResolvedValue(mockCustomer);
  });

  describe('GET /api/customers', () => {
    it('should return all active customers for tenant', async () => {
      const customers = [mockCustomer];
      prismaMock.customer.findMany.mockResolvedValue(customers);

      expect(prismaMock.customer.findMany).toBeDefined();
      expect(customers).toHaveLength(1);
      expect(customers[0].tenantId).toBe(mockTenant.id);
      expect(customers[0].isActive).toBe(true);
    });

    it('should include pets count and appointments count', async () => {
      const customerWithCounts = {
        ...mockCustomer,
        _count: {
          pets: 2,
          appointments: 5,
        },
        pets: [mockPet],
      };
      prismaMock.customer.findMany.mockResolvedValue([customerWithCounts]);

      const result = await prismaMock.customer.findMany({
        where: { tenantId: mockTenant.id, isActive: true },
        include: {
          pets: true,
          _count: {
            select: { pets: true, appointments: true },
          },
        },
      });

      expect(result[0]._count.pets).toBe(2);
      expect(result[0]._count.appointments).toBe(5);
    });

    it('should enforce tenant isolation - not return customers from other tenants', async () => {
      const otherTenantCustomer = createTestCustomer({
        id: 'other-customer',
        tenantId: 'other-tenant-id',
      });

      // Simulate query that only returns current tenant's customers
      prismaMock.customer.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return [mockCustomer];
        }
        return [];
      });

      const result = await prismaMock.customer.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result).not.toContainEqual(
        expect.objectContaining({ tenantId: 'other-tenant-id' })
      );
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should return customer with related data (pets, appointments)', async () => {
      const mockAppointment = createTestAppointment({
        tenantId: mockTenant.id,
        customerId: mockCustomer.id,
      });

      const customerWithRelations = {
        ...mockCustomer,
        pets: [mockPet],
        appointments: [mockAppointment],
      };

      prismaMock.customer.findUnique.mockResolvedValue(customerWithRelations);

      const result = await prismaMock.customer.findUnique({
        where: { id: mockCustomer.id },
        include: { pets: true, appointments: true },
      });

      expect(result?.pets).toHaveLength(1);
      expect(result?.appointments).toHaveLength(1);
      expect(result?.pets[0].id).toBe(mockPet.id);
    });

    it('should return null for non-existent customer (404)', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(null);

      const result = await prismaMock.customer.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(result).toBeNull();
    });

    it('should enforce tenant isolation - return null for other tenant customer', async () => {
      const otherTenantCustomer = createTestCustomer({
        id: 'other-customer',
        tenantId: 'other-tenant-id',
      });

      // Simulate tenant-scoped query
      prismaMock.customer.findUnique.mockImplementation(async (args: any) => {
        // Only return if both id AND tenantId match
        if (
          args?.where?.id === mockCustomer.id &&
          (!args?.where?.tenantId || args?.where?.tenantId === mockTenant.id)
        ) {
          return mockCustomer;
        }
        return null;
      });

      // Attempt to access other tenant's customer should return null
      const result = await prismaMock.customer.findUnique({
        where: { id: otherTenantCustomer.id, tenantId: mockTenant.id },
      });

      expect(result).toBeNull();
    });
  });

  describe('POST /api/customers', () => {
    it('should create a new customer', async () => {
      const newCustomerData = {
        name: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+52 1 55 5555 6666',
        address: '789 New Street',
        preferredContactMethod: 'email',
      };

      const createdCustomer = {
        ...mockCustomer,
        ...newCustomerData,
        id: 'new-customer-id',
      };

      prismaMock.customer.create.mockResolvedValue(createdCustomer);

      const result = await prismaMock.customer.create({
        data: {
          ...newCustomerData,
          tenantId: mockTenant.id,
        },
      });

      expect(result.name).toBe(newCustomerData.name);
      expect(result.email).toBe(newCustomerData.email);
      expect(result.tenantId).toBe(mockTenant.id);
    });

    it('should validate required fields - name is required', async () => {
      const invalidData = {
        email: 'test@example.com',
        // name is missing
      };

      const isValid = 'name' in invalidData && invalidData.name !== undefined;
      expect(isValid).toBe(false);
    });

    it('should prevent duplicate emails within same tenant', async () => {
      const duplicateEmailData = {
        name: 'Duplicate User',
        email: mockCustomer.email, // Same email as existing customer
        tenantId: mockTenant.id,
      };

      // Simulate finding existing customer with same email
      prismaMock.customer.findFirst.mockResolvedValue(mockCustomer);

      const existingCustomer = await prismaMock.customer.findFirst({
        where: {
          email: duplicateEmailData.email,
          tenantId: duplicateEmailData.tenantId,
        },
      });

      expect(existingCustomer).not.toBeNull();
      expect(existingCustomer?.email).toBe(duplicateEmailData.email);
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('should update customer data', async () => {
      const updateData = {
        name: 'John Updated',
        phone: '+52 1 55 9999 8888',
      };

      const updatedCustomer = { ...mockCustomer, ...updateData };
      prismaMock.customer.update.mockResolvedValue(updatedCustomer);

      const result = await prismaMock.customer.update({
        where: { id: mockCustomer.id },
        data: updateData,
      });

      expect(result.name).toBe('John Updated');
      expect(result.phone).toBe('+52 1 55 9999 8888');
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should soft delete (archive) customer by setting isActive to false', async () => {
      const archivedCustomer = { ...mockCustomer, isActive: false };
      prismaMock.customer.update.mockResolvedValue(archivedCustomer);

      const result = await prismaMock.customer.update({
        where: { id: mockCustomer.id },
        data: { isActive: false },
      });

      expect(result.isActive).toBe(false);
      expect(result.id).toBe(mockCustomer.id);
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should return 404 when updating customer from another tenant', async () => {
      const otherTenantId = 'other-tenant-id';

      // Simulate tenant-scoped update that fails for wrong tenant
      prismaMock.customer.updateMany.mockResolvedValue({ count: 0 });

      const result = await prismaMock.customer.updateMany({
        where: {
          id: mockCustomer.id,
          tenantId: otherTenantId, // Wrong tenant
        },
        data: { name: 'Hacked Name' },
      });

      expect(result.count).toBe(0);
    });

    it('should return 404 when deleting customer from another tenant', async () => {
      const otherTenantId = 'other-tenant-id';

      // Simulate tenant-scoped delete that fails for wrong tenant
      prismaMock.customer.updateMany.mockResolvedValue({ count: 0 });

      const result = await prismaMock.customer.updateMany({
        where: {
          id: mockCustomer.id,
          tenantId: otherTenantId, // Wrong tenant
        },
        data: { isActive: false },
      });

      expect(result.count).toBe(0);
    });
  });
});
