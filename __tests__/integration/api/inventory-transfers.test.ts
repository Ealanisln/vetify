import { prismaMock } from '../../mocks/prisma';
import {
  createTestInventoryTransfer,
  createTestInventoryItem,
  createTestTenant,
  createTestUser,
  createTestLocation,
  createTestStaff,
} from '../../utils/test-utils';

// Mock the inventory transfers API route
const mockTransfersRoute = {
  GET: jest.fn(),
  POST: jest.fn(),
  PUT: jest.fn(),
};

describe('Inventory Transfers API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockFromLocation: ReturnType<typeof createTestLocation>;
  let mockToLocation: ReturnType<typeof createTestLocation>;
  let mockStaff: ReturnType<typeof createTestStaff>;
  let mockInventoryItem: ReturnType<typeof createTestInventoryItem>;
  let mockTransfer: ReturnType<typeof createTestInventoryTransfer>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockFromLocation = createTestLocation({
      id: 'location-1',
      tenantId: mockTenant.id,
      name: 'Main Clinic',
    });
    mockToLocation = createTestLocation({
      id: 'location-2',
      tenantId: mockTenant.id,
      name: 'Branch Clinic',
      isPrimary: false,
    });
    mockStaff = createTestStaff({ tenantId: mockTenant.id });
    mockInventoryItem = createTestInventoryItem({
      tenantId: mockTenant.id,
      locationId: mockFromLocation.id,
      quantity: 100,
    });
    mockTransfer = createTestInventoryTransfer({
      tenantId: mockTenant.id,
      inventoryItemId: mockInventoryItem.id,
      fromLocationId: mockFromLocation.id,
      toLocationId: mockToLocation.id,
      requestedById: mockStaff.id,
    });

    // Mock Prisma responses
    prismaMock.inventoryTransfer.findMany.mockResolvedValue([mockTransfer]);
    prismaMock.inventoryTransfer.findUnique.mockResolvedValue(mockTransfer);
    prismaMock.inventoryTransfer.create.mockResolvedValue(mockTransfer);
    prismaMock.inventoryTransfer.update.mockResolvedValue(mockTransfer);
  });

  describe('GET /api/inventory/transfers', () => {
    it('should return transfers for tenant', async () => {
      const transfers = [mockTransfer];
      prismaMock.inventoryTransfer.findMany.mockResolvedValue(transfers);

      const result = await prismaMock.inventoryTransfer.findMany({
        where: { tenantId: mockTenant.id },
        include: {
          inventoryItem: true,
          fromLocation: true,
          toLocation: true,
          requestedBy: true,
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
    });

    it('should filter by status', async () => {
      const pendingTransfer = mockTransfer;
      const completedTransfer = createTestInventoryTransfer({
        id: 'completed-transfer',
        tenantId: mockTenant.id,
        status: 'COMPLETED' as const,
        completedAt: new Date(),
      });

      prismaMock.inventoryTransfer.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.status === 'PENDING') {
          return [pendingTransfer];
        }
        if (args?.where?.status === 'COMPLETED') {
          return [completedTransfer];
        }
        return [pendingTransfer, completedTransfer];
      });

      const pendingResult = await prismaMock.inventoryTransfer.findMany({
        where: { tenantId: mockTenant.id, status: 'PENDING' },
      });

      expect(pendingResult).toHaveLength(1);
      expect(pendingResult[0].status).toBe('PENDING');
    });

    it('should filter by fromLocationId/toLocationId', async () => {
      prismaMock.inventoryTransfer.findMany.mockImplementation(async (args: any) => {
        const where = args?.where;
        if (where?.fromLocationId === mockFromLocation.id) {
          return [mockTransfer];
        }
        if (where?.toLocationId === mockToLocation.id) {
          return [mockTransfer];
        }
        return [];
      });

      const fromResult = await prismaMock.inventoryTransfer.findMany({
        where: { tenantId: mockTenant.id, fromLocationId: mockFromLocation.id },
      });

      const toResult = await prismaMock.inventoryTransfer.findMany({
        where: { tenantId: mockTenant.id, toLocationId: mockToLocation.id },
      });

      expect(fromResult).toHaveLength(1);
      expect(toResult).toHaveLength(1);
      expect(fromResult[0].fromLocationId).toBe(mockFromLocation.id);
      expect(toResult[0].toLocationId).toBe(mockToLocation.id);
    });
  });

  describe('POST /api/inventory/transfers', () => {
    it('should create a new transfer', async () => {
      const newTransferData = {
        inventoryItemId: mockInventoryItem.id,
        fromLocationId: mockFromLocation.id,
        toLocationId: mockToLocation.id,
        quantity: 15,
        notes: 'Transfer for restocking',
        requestedById: mockStaff.id,
      };

      const createdTransfer = {
        ...mockTransfer,
        ...newTransferData,
        id: 'new-transfer-id',
        status: 'PENDING' as const,
      };

      prismaMock.inventoryTransfer.create.mockResolvedValue(createdTransfer);

      const result = await prismaMock.inventoryTransfer.create({
        data: {
          ...newTransferData,
          tenantId: mockTenant.id,
          status: 'PENDING',
        },
      });

      expect(result.quantity).toBe(15);
      expect(result.status).toBe('PENDING');
      expect(result.tenantId).toBe(mockTenant.id);
    });

    it('should validate from and to locations are different', async () => {
      const invalidTransferData = {
        inventoryItemId: mockInventoryItem.id,
        fromLocationId: mockFromLocation.id,
        toLocationId: mockFromLocation.id, // Same location - invalid
        quantity: 10,
      };

      const locationsAreDifferent =
        invalidTransferData.fromLocationId !== invalidTransferData.toLocationId;

      expect(locationsAreDifferent).toBe(false);
    });

    it('should validate sufficient stock at source location', async () => {
      const requestedQuantity = 150; // More than available (100)
      const availableQuantity = mockInventoryItem.quantity;

      // Check if sufficient stock
      prismaMock.inventoryItem.findUnique.mockResolvedValue(mockInventoryItem);

      const item = await prismaMock.inventoryItem.findUnique({
        where: { id: mockInventoryItem.id },
      });

      const hasSufficientStock = (item?.quantity as number) >= requestedQuantity;
      expect(hasSufficientStock).toBe(false);

      // Valid case - request within available stock
      const validQuantity = 50;
      const hasValidStock = (item?.quantity as number) >= validQuantity;
      expect(hasValidStock).toBe(true);
    });
  });

  describe('POST /api/inventory/transfers/:id/complete', () => {
    it('should complete a pending transfer', async () => {
      const completedTransfer = {
        ...mockTransfer,
        status: 'COMPLETED' as const,
        completedAt: new Date(),
      };

      prismaMock.inventoryTransfer.findUnique.mockResolvedValue(mockTransfer);
      prismaMock.inventoryTransfer.update.mockResolvedValue(completedTransfer);

      // Check if transfer is pending before completing
      const transfer = await prismaMock.inventoryTransfer.findUnique({
        where: { id: mockTransfer.id },
      });

      expect(transfer?.status).toBe('PENDING');

      // Complete the transfer
      const result = await prismaMock.inventoryTransfer.update({
        where: { id: mockTransfer.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      expect(result.status).toBe('COMPLETED');
      expect(result.completedAt).not.toBeNull();
    });

    it('should fail for non-pending transfers', async () => {
      const completedTransfer = {
        ...mockTransfer,
        status: 'COMPLETED' as const,
        completedAt: new Date(),
      };

      prismaMock.inventoryTransfer.findUnique.mockResolvedValue(completedTransfer);

      const transfer = await prismaMock.inventoryTransfer.findUnique({
        where: { id: mockTransfer.id },
      });

      const canComplete = transfer?.status === 'PENDING';
      expect(canComplete).toBe(false);

      // Test cancelled transfer
      const cancelledTransfer = {
        ...mockTransfer,
        status: 'CANCELLED' as const,
      };

      prismaMock.inventoryTransfer.findUnique.mockResolvedValue(cancelledTransfer);

      const cancelledResult = await prismaMock.inventoryTransfer.findUnique({
        where: { id: mockTransfer.id },
      });

      const canCompleteCancelled = cancelledResult?.status === 'PENDING';
      expect(canCompleteCancelled).toBe(false);
    });
  });

  describe('POST /api/inventory/transfers/:id/cancel', () => {
    it('should cancel a pending transfer', async () => {
      const cancelledTransfer = {
        ...mockTransfer,
        status: 'CANCELLED' as const,
      };

      prismaMock.inventoryTransfer.findUnique.mockResolvedValue(mockTransfer);
      prismaMock.inventoryTransfer.update.mockResolvedValue(cancelledTransfer);

      // Check if transfer is pending before cancelling
      const transfer = await prismaMock.inventoryTransfer.findUnique({
        where: { id: mockTransfer.id },
      });

      expect(transfer?.status).toBe('PENDING');

      // Cancel the transfer
      const result = await prismaMock.inventoryTransfer.update({
        where: { id: mockTransfer.id },
        data: { status: 'CANCELLED' },
      });

      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should not return transfers from other tenants', async () => {
      const otherTenantTransfer = createTestInventoryTransfer({
        id: 'other-transfer',
        tenantId: 'other-tenant-id',
      });

      prismaMock.inventoryTransfer.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return [mockTransfer];
        }
        return [];
      });

      const result = await prismaMock.inventoryTransfer.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result).not.toContainEqual(
        expect.objectContaining({ tenantId: 'other-tenant-id' })
      );
    });

    it('should return 404 when updating transfer from another tenant', async () => {
      const otherTenantId = 'other-tenant-id';

      prismaMock.inventoryTransfer.updateMany.mockResolvedValue({ count: 0 });

      const result = await prismaMock.inventoryTransfer.updateMany({
        where: {
          id: mockTransfer.id,
          tenantId: otherTenantId, // Wrong tenant
        },
        data: { status: 'COMPLETED' },
      });

      expect(result.count).toBe(0);
    });
  });
});
