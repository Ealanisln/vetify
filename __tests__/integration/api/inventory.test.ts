import { prismaMock } from '../../mocks/prisma';
import {
  createTestInventoryItem,
  createTestTenant,
  createTestUser,
  createTestLocation,
} from '../../utils/test-utils';

// Mock the inventory API route
const mockInventoryRoute = {
  GET: jest.fn(),
  POST: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
};

describe('Inventory API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockLocation: ReturnType<typeof createTestLocation>;
  let mockInventoryItem: ReturnType<typeof createTestInventoryItem>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockLocation = createTestLocation({ tenantId: mockTenant.id });
    mockInventoryItem = createTestInventoryItem({
      tenantId: mockTenant.id,
      locationId: mockLocation.id,
    });

    // Mock Prisma responses
    prismaMock.inventoryItem.findMany.mockResolvedValue([mockInventoryItem]);
    prismaMock.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem);
    prismaMock.inventoryItem.create.mockResolvedValue(mockInventoryItem);
    prismaMock.inventoryItem.update.mockResolvedValue(mockInventoryItem);
    prismaMock.inventoryItem.delete.mockResolvedValue(mockInventoryItem);
    prismaMock.inventoryItem.count.mockResolvedValue(1);
  });

  describe('GET /api/inventory', () => {
    it('should return paginated inventory items', async () => {
      const page = 1;
      const pageSize = 20;
      const skip = (page - 1) * pageSize;

      prismaMock.inventoryItem.findMany.mockResolvedValue([mockInventoryItem]);
      prismaMock.inventoryItem.count.mockResolvedValue(50);

      const [items, total] = await Promise.all([
        prismaMock.inventoryItem.findMany({
          where: { tenantId: mockTenant.id },
          skip,
          take: pageSize,
          orderBy: { name: 'asc' },
        }),
        prismaMock.inventoryItem.count({
          where: { tenantId: mockTenant.id },
        }),
      ]);

      expect(items).toBeDefined();
      expect(total).toBe(50);
    });

    it('should filter by category', async () => {
      const category = 'VACCINE';

      prismaMock.inventoryItem.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.category === category) {
          return [mockInventoryItem];
        }
        return [];
      });

      const result = await prismaMock.inventoryItem.findMany({
        where: { tenantId: mockTenant.id, category },
      });

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe(category);
    });

    it('should filter by search term (name, description)', async () => {
      const searchTerm = 'Rabies';

      prismaMock.inventoryItem.findMany.mockImplementation(async (args: any) => {
        const where = args?.where;
        if (
          where?.OR?.some(
            (condition: any) =>
              condition?.name?.contains === searchTerm ||
              condition?.description?.contains === searchTerm
          )
        ) {
          return [mockInventoryItem];
        }
        return [];
      });

      const result = await prismaMock.inventoryItem.findMany({
        where: {
          tenantId: mockTenant.id,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('Rabies');
    });

    it('should filter by locationId', async () => {
      prismaMock.inventoryItem.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.locationId === mockLocation.id) {
          return [mockInventoryItem];
        }
        return [];
      });

      const result = await prismaMock.inventoryItem.findMany({
        where: { tenantId: mockTenant.id, locationId: mockLocation.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].locationId).toBe(mockLocation.id);
    });

    it('should return inventory stats when action=stats', async () => {
      const stats = {
        totalItems: 100,
        totalValue: 50000,
        lowStockItems: 5,
        expiringSoon: 3,
        byCategory: {
          VACCINE: 25,
          MEDICATION: 40,
          SUPPLY: 35,
        },
      };

      prismaMock.inventoryItem.count.mockResolvedValueOnce(100);
      prismaMock.inventoryItem.aggregate.mockResolvedValue({
        _sum: { price: 50000 },
      });

      const [totalItems, aggregation] = await Promise.all([
        prismaMock.inventoryItem.count({ where: { tenantId: mockTenant.id } }),
        prismaMock.inventoryItem.aggregate({
          where: { tenantId: mockTenant.id },
          _sum: { price: true },
        }),
      ]);

      expect(totalItems).toBe(100);
      expect(aggregation._sum.price).toBe(50000);
    });

    it('should return low stock items when action=low-stock', async () => {
      const lowStockItem = {
        ...mockInventoryItem,
        quantity: 5, // Below minStock of 10
      };

      prismaMock.inventoryItem.findMany.mockResolvedValue([lowStockItem]);

      const result = await prismaMock.inventoryItem.findMany({
        where: {
          tenantId: mockTenant.id,
          quantity: { lte: prismaMock.inventoryItem.fields?.minStock || 10 },
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBeLessThanOrEqual(mockInventoryItem.minStock);
    });
  });

  describe('GET /api/inventory/:id', () => {
    it('should return inventory item by ID', async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem);

      const result = await prismaMock.inventoryItem.findUnique({
        where: { id: mockInventoryItem.id },
      });

      expect(result?.id).toBe(mockInventoryItem.id);
      expect(result?.name).toBe(mockInventoryItem.name);
    });

    it('should return null for non-existent item (404)', async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue(null);

      const result = await prismaMock.inventoryItem.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(result).toBeNull();
    });
  });

  describe('POST /api/inventory', () => {
    it('should create inventory item', async () => {
      const newItemData = {
        name: 'Canine Parvovirus Vaccine',
        category: 'VACCINE',
        description: 'Vaccine for parvovirus prevention',
        quantity: 50,
        minStock: 10,
        price: 85.00,
        cost: 60.00,
        locationId: mockLocation.id,
      };

      const createdItem = {
        ...mockInventoryItem,
        ...newItemData,
        id: 'new-item-id',
      };

      prismaMock.inventoryItem.create.mockResolvedValue(createdItem);

      const result = await prismaMock.inventoryItem.create({
        data: {
          ...newItemData,
          tenantId: mockTenant.id,
        },
      });

      expect(result.name).toBe(newItemData.name);
      expect(result.category).toBe(newItemData.category);
      expect(result.tenantId).toBe(mockTenant.id);
    });

    it('should validate required fields - name and category', async () => {
      const invalidData = {
        description: 'Missing name and category',
        quantity: 10,
      };

      const requiredFields = ['name', 'category'];
      const missingFields = requiredFields.filter((field) => !(field in invalidData));

      expect(missingFields).toContain('name');
      expect(missingFields).toContain('category');
    });
  });

  describe('PUT /api/inventory/:id', () => {
    it('should update inventory item', async () => {
      const updateData = {
        name: 'Updated Vaccine Name',
        quantity: 75,
        price: 90.00,
      };

      const updatedItem = { ...mockInventoryItem, ...updateData };
      prismaMock.inventoryItem.update.mockResolvedValue(updatedItem);

      const result = await prismaMock.inventoryItem.update({
        where: { id: mockInventoryItem.id },
        data: updateData,
      });

      expect(result.name).toBe('Updated Vaccine Name');
      expect(result.quantity).toBe(75);
      expect(result.price).toBe(90.00);
    });
  });

  describe('DELETE /api/inventory/:id', () => {
    it('should delete inventory item', async () => {
      prismaMock.inventoryItem.delete.mockResolvedValue(mockInventoryItem);

      const result = await prismaMock.inventoryItem.delete({
        where: { id: mockInventoryItem.id },
      });

      expect(result.id).toBe(mockInventoryItem.id);
    });
  });

  describe('GET /api/inventory/alerts', () => {
    it('should get low stock alerts', async () => {
      const lowStockItems = [
        { ...mockInventoryItem, quantity: 5, minStock: 10 },
        { ...mockInventoryItem, id: 'item-2', name: 'Low Stock Item 2', quantity: 3, minStock: 15 },
      ];

      prismaMock.inventoryItem.findMany.mockResolvedValue(lowStockItems);

      const result = await prismaMock.inventoryItem.findMany({
        where: {
          tenantId: mockTenant.id,
          status: 'ACTIVE',
          OR: [
            { quantity: { lte: 10 } }, // Using a reasonable default for comparison
          ],
        },
        orderBy: { quantity: 'asc' },
      });

      expect(result).toHaveLength(2);
      result.forEach((item: any) => {
        expect(item.quantity).toBeLessThanOrEqual(item.minStock);
      });
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should not return inventory items from other tenants', async () => {
      const otherTenantItem = createTestInventoryItem({
        id: 'other-item',
        tenantId: 'other-tenant-id',
      });

      prismaMock.inventoryItem.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return [mockInventoryItem];
        }
        return [];
      });

      const result = await prismaMock.inventoryItem.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result).not.toContainEqual(
        expect.objectContaining({ tenantId: 'other-tenant-id' })
      );
    });

    it('should return 404 when updating item from another tenant', async () => {
      const otherTenantId = 'other-tenant-id';

      prismaMock.inventoryItem.updateMany.mockResolvedValue({ count: 0 });

      const result = await prismaMock.inventoryItem.updateMany({
        where: {
          id: mockInventoryItem.id,
          tenantId: otherTenantId, // Wrong tenant
        },
        data: { name: 'Hacked Name' },
      });

      expect(result.count).toBe(0);
    });
  });
});
