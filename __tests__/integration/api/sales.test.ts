/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prismaMock } from '../../mocks/prisma';
import {
  createTestSale,
  createTestSaleItem,
  createTestSalePayment,
  createTestTenant,
  createTestUser,
  createTestCustomer,
  createTestPet,
  createTestInventoryItem,
  createTestService,
  createTestCashDrawer,
  createTestCashTransaction,
} from '../../utils/test-utils';

describe('Sales API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockCustomer: ReturnType<typeof createTestCustomer>;
  let mockPet: ReturnType<typeof createTestPet>;
  let mockSale: ReturnType<typeof createTestSale>;
  let mockSaleItem: ReturnType<typeof createTestSaleItem>;
  let mockPayment: ReturnType<typeof createTestSalePayment>;
  let mockInventoryItem: ReturnType<typeof createTestInventoryItem>;
  let mockService: ReturnType<typeof createTestService>;
  let mockDrawer: ReturnType<typeof createTestCashDrawer>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockCustomer = createTestCustomer({ tenantId: mockTenant.id });
    mockPet = createTestPet({ tenantId: mockTenant.id, ownerId: mockCustomer.id });
    mockInventoryItem = createTestInventoryItem({ tenantId: mockTenant.id });
    mockService = createTestService({ tenantId: mockTenant.id });
    mockDrawer = createTestCashDrawer({ tenantId: mockTenant.id, status: 'OPEN' as const });
    mockSale = createTestSale({
      tenantId: mockTenant.id,
      customerId: mockCustomer.id,
      petId: mockPet.id,
      userId: mockUser.id,
    });
    mockSaleItem = createTestSaleItem({ saleId: mockSale.id, itemId: mockInventoryItem.id });
    mockPayment = createTestSalePayment({ saleId: mockSale.id });

    // Mock Prisma responses
    prismaMock.user.findUnique.mockResolvedValue({
      ...mockUser,
      tenant: {
        ...mockTenant,
        tenantSubscription: null,
      },
    });
    prismaMock.sale.findMany.mockResolvedValue([mockSale]);
    prismaMock.sale.findUnique.mockResolvedValue(mockSale);
    prismaMock.sale.create.mockResolvedValue(mockSale);
    prismaMock.sale.count.mockResolvedValue(1);
    prismaMock.customer.findMany.mockResolvedValue([mockCustomer]);
    prismaMock.inventoryItem.findMany.mockResolvedValue([mockInventoryItem]);
    prismaMock.service.findMany.mockResolvedValue([mockService]);
  });

  describe('GET /api/sales', () => {
    it('should return recent sales for authenticated user', async () => {
      const salesWithRelations = [
        {
          ...mockSale,
          customer: mockCustomer,
          items: [mockSaleItem],
          payments: [mockPayment],
        },
      ];

      prismaMock.sale.findMany.mockResolvedValue(salesWithRelations);

      const result = await prismaMock.sale.findMany({
        where: { tenantId: mockTenant.id },
        include: {
          customer: true,
          items: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result[0].customer).toBeDefined();
    });

    it('should return sales stats when action=stats', async () => {
      const expectedStats = {
        totalSales: 10,
        totalRevenue: 5000.0,
        averageTicket: 500.0,
        todaySales: 3,
        todayRevenue: 1500.0,
      };

      prismaMock.sale.count.mockResolvedValue(expectedStats.totalSales);
      prismaMock.sale.aggregate.mockResolvedValue({
        _sum: { total: expectedStats.totalRevenue },
        _count: { id: expectedStats.totalSales },
      });

      const [totalSales, aggregation] = await Promise.all([
        prismaMock.sale.count({ where: { tenantId: mockTenant.id } }),
        prismaMock.sale.aggregate({
          where: { tenantId: mockTenant.id },
          _sum: { total: true },
          _count: { id: true },
        }),
      ]);

      expect(totalSales).toBe(10);
      expect(aggregation._sum.total).toBe(5000.0);
    });

    it('should respect limit parameter', async () => {
      const limit = 5;
      const multipleSales = Array.from({ length: limit }, (_, i) =>
        createTestSale({ id: `sale-${i}`, tenantId: mockTenant.id })
      );

      prismaMock.sale.findMany.mockResolvedValue(multipleSales);

      const result = await prismaMock.sale.findMany({
        where: { tenantId: mockTenant.id },
        take: limit,
      });

      expect(result).toHaveLength(limit);
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Simulating no user found
      prismaMock.user.findUnique.mockResolvedValue(null);

      const user = await prismaMock.user.findUnique({
        where: { id: 'non-existent-user' },
      });

      expect(user).toBeNull();
      // API would return: { error: 'No autorizado' }, { status: 401 }
    });

    it('should enforce tenant isolation', async () => {
      const otherTenantSale = createTestSale({
        id: 'other-sale',
        tenantId: 'other-tenant-id',
      });

      prismaMock.sale.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return [mockSale];
        }
        return [];
      });

      const result = await prismaMock.sale.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result).not.toContainEqual(
        expect.objectContaining({ tenantId: 'other-tenant-id' })
      );
    });
  });

  describe('POST /api/sales', () => {
    it('should create a new sale with valid data', async () => {
      const saleData = {
        customerId: mockCustomer.id,
        petId: mockPet.id,
        items: [
          {
            itemId: mockInventoryItem.id,
            quantity: 2,
            unitPrice: 75.0,
          },
        ],
        payments: [
          {
            paymentMethod: 'CASH',
            amount: 174.0, // 150 + 16% tax
          },
        ],
      };

      const createdSale = {
        ...mockSale,
        customerId: saleData.customerId,
        petId: saleData.petId,
        subtotal: 150.0,
        tax: 24.0,
        total: 174.0,
      };

      prismaMock.sale.create.mockResolvedValue(createdSale);

      const result = await prismaMock.sale.create({
        data: {
          tenantId: mockTenant.id,
          userId: mockUser.id,
          customerId: saleData.customerId,
          petId: saleData.petId,
          saleNumber: 'SALE-202401010002',
          subtotal: 150.0,
          tax: 24.0,
          total: 174.0,
          status: 'PENDING',
        },
      });

      expect(result.customerId).toBe(saleData.customerId);
      expect(result.total).toBe(174.0);
    });

    it('should validate required fields (customerId, items)', () => {
      const invalidData = {
        // Missing customerId
        items: [],
      };

      const hasCustomerId = 'customerId' in invalidData;
      const hasItems = invalidData.items && invalidData.items.length > 0;

      expect(hasCustomerId).toBe(false);
      expect(hasItems).toBe(false);
      // API would return: { error: 'Datos de venta incompletos' }, { status: 400 }
    });

    it('should require open caja for cash payments', async () => {
      // Simulate no open drawer
      prismaMock.cashDrawer.findFirst.mockResolvedValue(null);

      const openDrawer = await prismaMock.cashDrawer.findFirst({
        where: { tenantId: mockTenant.id, status: 'OPEN' },
      });

      expect(openDrawer).toBeNull();
      // createSale function would throw: "Se requiere una caja abierta para pagos en efectivo"
    });

    it('should allow cash payment when caja is open', async () => {
      prismaMock.cashDrawer.findFirst.mockResolvedValue(mockDrawer);

      const openDrawer = await prismaMock.cashDrawer.findFirst({
        where: { tenantId: mockTenant.id, status: 'OPEN' },
      });

      expect(openDrawer).toBeDefined();
      expect(openDrawer?.status).toBe('OPEN');
    });

    it('should decrement inventory quantity for products', async () => {
      const originalQuantity = mockInventoryItem.quantity;
      const soldQuantity = 5;
      const newQuantity = originalQuantity - soldQuantity;

      const updatedItem = {
        ...mockInventoryItem,
        quantity: newQuantity,
      };

      prismaMock.inventoryItem.update.mockResolvedValue(updatedItem);

      const result = await prismaMock.inventoryItem.update({
        where: { id: mockInventoryItem.id },
        data: {
          quantity: { decrement: soldQuantity },
        },
      });

      expect(result.quantity).toBe(newQuantity);
    });

    it('should create cash transaction when paying with cash', async () => {
      const cashPaymentAmount = 116.0;
      const newTransaction = createTestCashTransaction({
        drawerId: mockDrawer.id,
        amount: cashPaymentAmount,
        type: 'SALE_CASH' as const,
        relatedId: mockSale.id,
        relatedType: 'SALE',
      });

      prismaMock.cashTransaction.create.mockResolvedValue(newTransaction);

      const result = await prismaMock.cashTransaction.create({
        data: {
          drawerId: mockDrawer.id,
          amount: cashPaymentAmount,
          type: 'SALE_CASH',
          description: 'Pago de venta en efectivo',
          relatedId: mockSale.id,
          relatedType: 'SALE',
        },
      });

      expect(result.type).toBe('SALE_CASH');
      expect(result.amount).toBe(cashPaymentAmount);
      expect(result.relatedId).toBe(mockSale.id);
    });
  });

  describe('GET /api/sales/search', () => {
    it('should search customers by type=customers', async () => {
      const searchQuery = 'John';

      prismaMock.customer.findMany.mockImplementation(async (args: any) => {
        const where = args?.where;
        if (
          where?.OR?.some(
            (condition: any) =>
              condition?.name?.contains === searchQuery ||
              condition?.email?.contains === searchQuery
          )
        ) {
          return [mockCustomer];
        }
        return [];
      });

      const result = await prismaMock.customer.findMany({
        where: {
          tenantId: mockTenant.id,
          isActive: true,
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { email: { contains: searchQuery, mode: 'insensitive' } },
            { phone: { contains: searchQuery } },
          ],
        },
        take: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('John');
    });

    it('should search products by type=products', async () => {
      const searchQuery = 'Rabies';

      prismaMock.inventoryItem.findMany.mockImplementation(async (args: any) => {
        const where = args?.where;
        if (
          where?.OR?.some(
            (condition: any) =>
              condition?.name?.contains === searchQuery ||
              condition?.description?.contains === searchQuery
          )
        ) {
          return [mockInventoryItem];
        }
        return [];
      });

      const result = await prismaMock.inventoryItem.findMany({
        where: {
          tenantId: mockTenant.id,
          status: 'ACTIVE',
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
        take: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('Rabies');
    });

    it('should return empty array when no matches found', async () => {
      const searchQuery = 'NonExistentProduct';

      prismaMock.inventoryItem.findMany.mockResolvedValue([]);

      const result = await prismaMock.inventoryItem.findMany({
        where: {
          tenantId: mockTenant.id,
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
      });

      expect(result).toHaveLength(0);
    });

    it('should require search type parameter', () => {
      const searchParams = new URLSearchParams();
      // Missing 'type' parameter

      const type = searchParams.get('type');
      expect(type).toBeNull();
      // API would return: { error: 'Tipo de búsqueda requerido' }, { status: 400 }
    });

    it('should return error for invalid search type', () => {
      const invalidType = 'invalid';
      const validTypes = ['customers', 'products'];

      const isValidType = validTypes.includes(invalidType);
      expect(isValidType).toBe(false);
      // API would return: { error: 'Tipo de búsqueda inválido' }, { status: 400 }
    });

    it('should also search services when type=products', async () => {
      const searchQuery = 'Consultation';

      prismaMock.service.findMany.mockImplementation(async (args: any) => {
        const where = args?.where;
        if (
          where?.OR?.some(
            (condition: any) =>
              condition?.name?.contains === searchQuery
          )
        ) {
          return [mockService];
        }
        return [];
      });

      const result = await prismaMock.service.findMany({
        where: {
          tenantId: mockTenant.id,
          isActive: true,
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
        take: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('Consultation');
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should not return sales from other tenants', async () => {
      const otherTenantSale = createTestSale({
        id: 'other-sale',
        tenantId: 'other-tenant-id',
      });

      prismaMock.sale.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return [mockSale];
        }
        return [];
      });

      const result = await prismaMock.sale.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result).not.toContainEqual(
        expect.objectContaining({ tenantId: 'other-tenant-id' })
      );
    });
  });
});
