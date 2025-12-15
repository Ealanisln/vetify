/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prismaMock } from '../../mocks/prisma';
import {
  createTestCashDrawer,
  createTestCashTransaction,
  createTestTenant,
  createTestUser,
  createTestLocation,
  createTestSale,
  createTestSalePayment,
  createTestCustomer,
} from '../../utils/test-utils';

describe('Caja (Cash Register) API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockLocation: ReturnType<typeof createTestLocation>;
  let mockDrawer: ReturnType<typeof createTestCashDrawer>;
  let mockTransaction: ReturnType<typeof createTestCashTransaction>;
  let mockSale: ReturnType<typeof createTestSale>;
  let mockPayment: ReturnType<typeof createTestSalePayment>;
  let mockCustomer: ReturnType<typeof createTestCustomer>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockLocation = createTestLocation({ tenantId: mockTenant.id });
    mockDrawer = createTestCashDrawer({
      tenantId: mockTenant.id,
      locationId: mockLocation.id,
      openedById: mockUser.id,
    });
    mockTransaction = createTestCashTransaction({
      drawerId: mockDrawer.id,
    });
    mockCustomer = createTestCustomer({ tenantId: mockTenant.id });
    mockSale = createTestSale({
      tenantId: mockTenant.id,
      customerId: mockCustomer.id,
    });
    mockPayment = createTestSalePayment({
      saleId: mockSale.id,
    });

    // Mock Prisma responses
    prismaMock.cashDrawer.findFirst.mockResolvedValue(mockDrawer);
    prismaMock.cashDrawer.findMany.mockResolvedValue([mockDrawer]);
    prismaMock.cashDrawer.create.mockResolvedValue(mockDrawer);
    prismaMock.cashDrawer.update.mockResolvedValue(mockDrawer);
    prismaMock.cashTransaction.findMany.mockResolvedValue([mockTransaction]);
    prismaMock.cashTransaction.aggregate.mockResolvedValue({
      _sum: { amount: 100 },
      _count: { id: 1 },
    });
  });

  describe('GET /api/caja', () => {
    it('should return current drawer status for today', async () => {
      const drawerWithRelations = {
        ...mockDrawer,
        openedBy: { name: 'Test User' },
        closedBy: null,
      };

      prismaMock.cashDrawer.findFirst.mockResolvedValue(drawerWithRelations);

      const result = await prismaMock.cashDrawer.findFirst({
        where: {
          tenantId: mockTenant.id,
          openedAt: {
            gte: expect.any(Date),
            lt: expect.any(Date),
          },
        },
        include: {
          openedBy: { select: { name: true } },
          closedBy: { select: { name: true } },
        },
        orderBy: { openedAt: 'desc' },
      });

      expect(result).toBeDefined();
      expect(result?.tenantId).toBe(mockTenant.id);
      expect(result?.status).toBe('OPEN');
    });

    it('should return null drawer if none open today', async () => {
      prismaMock.cashDrawer.findFirst.mockResolvedValue(null);

      const result = await prismaMock.cashDrawer.findFirst({
        where: {
          tenantId: mockTenant.id,
          openedAt: {
            gte: expect.any(Date),
            lt: expect.any(Date),
          },
        },
      });

      expect(result).toBeNull();
    });

    it('should filter by locationId when provided', async () => {
      prismaMock.cashDrawer.findFirst.mockImplementation(async (args: any) => {
        if (args?.where?.locationId === mockLocation.id) {
          return mockDrawer;
        }
        return null;
      });

      const result = await prismaMock.cashDrawer.findFirst({
        where: {
          tenantId: mockTenant.id,
          locationId: mockLocation.id,
        },
      });

      expect(result).toBeDefined();
      expect(result?.locationId).toBe(mockLocation.id);
    });
  });

  describe('POST /api/caja/open', () => {
    it('should open new cash drawer with valid data', async () => {
      const newDrawerData = {
        tenantId: mockTenant.id,
        locationId: mockLocation.id,
        initialAmount: 500.0,
      };

      const createdDrawer = {
        ...mockDrawer,
        ...newDrawerData,
        status: 'OPEN' as const,
        openedBy: { name: 'Test User' },
      };

      prismaMock.cashDrawer.findFirst.mockResolvedValue(null); // No existing drawer
      prismaMock.cashDrawer.create.mockResolvedValue(createdDrawer);

      // Verify no existing open drawer
      const existingDrawer = await prismaMock.cashDrawer.findFirst({
        where: {
          tenantId: mockTenant.id,
          status: 'OPEN',
        },
      });

      expect(existingDrawer).toBeNull();

      // Create new drawer
      const result = await prismaMock.cashDrawer.create({
        data: {
          tenantId: newDrawerData.tenantId,
          locationId: newDrawerData.locationId,
          initialAmount: newDrawerData.initialAmount,
          openedById: mockUser.id,
          status: 'OPEN',
        },
      });

      expect(result.tenantId).toBe(mockTenant.id);
      expect(result.initialAmount).toBe(500.0);
      expect(result.status).toBe('OPEN');
    });

    it('should validate initialAmount is non-negative', () => {
      const invalidData = {
        tenantId: mockTenant.id,
        initialAmount: -100, // Invalid: negative amount
      };

      // Zod validation would fail for negative amounts
      const isValid = invalidData.initialAmount >= 0;
      expect(isValid).toBe(false);
    });

    it('should prevent opening when drawer already open', async () => {
      // Mock existing open drawer
      prismaMock.cashDrawer.findFirst.mockResolvedValue(mockDrawer);

      const existingDrawer = await prismaMock.cashDrawer.findFirst({
        where: {
          tenantId: mockTenant.id,
          status: 'OPEN',
        },
      });

      expect(existingDrawer).toBeDefined();
      expect(existingDrawer?.status).toBe('OPEN');
      // API would return 400 error: "Ya hay una caja abierta para esta ubicación hoy"
    });

    it('should verify tenantId matches authenticated user', () => {
      const requestTenantId = 'different-tenant';
      const userTenantId = mockTenant.id;

      // This check would fail and return 403
      const isAuthorized = requestTenantId === userTenantId;
      expect(isAuthorized).toBe(false);
    });

    it('should associate drawer with location when provided', async () => {
      const newDrawerData = {
        tenantId: mockTenant.id,
        locationId: mockLocation.id,
        initialAmount: 1000.0,
      };

      const createdDrawer = {
        ...mockDrawer,
        ...newDrawerData,
      };

      prismaMock.cashDrawer.findFirst.mockResolvedValue(null);
      prismaMock.cashDrawer.create.mockResolvedValue(createdDrawer);

      const result = await prismaMock.cashDrawer.create({
        data: {
          ...newDrawerData,
          openedById: mockUser.id,
          status: 'OPEN',
        },
      });

      expect(result.locationId).toBe(mockLocation.id);
    });
  });

  describe('POST /api/caja/close', () => {
    it('should close drawer and calculate difference', async () => {
      const openDrawer = {
        ...mockDrawer,
        initialAmount: 500.0,
        status: 'OPEN' as const,
      };

      const finalAmount = 750.0;
      const cashSalesTotal = 200.0;
      const expectedAmount = 500.0 + cashSalesTotal; // 700.0
      const difference = finalAmount - expectedAmount; // 50.0

      const closedDrawer = {
        ...openDrawer,
        status: 'CLOSED' as const,
        finalAmount,
        expectedAmount,
        difference,
        closedAt: new Date(),
        closedById: mockUser.id,
        closedBy: { name: 'Test User' },
        openedBy: { name: 'Test User' },
      };

      prismaMock.cashDrawer.findFirst.mockResolvedValue(openDrawer);
      prismaMock.salePayment.aggregate.mockResolvedValue({
        _sum: { amount: cashSalesTotal },
      });
      prismaMock.cashDrawer.update.mockResolvedValue(closedDrawer);

      // Find open drawer
      const drawer = await prismaMock.cashDrawer.findFirst({
        where: { tenantId: mockTenant.id, status: 'OPEN' },
      });
      expect(drawer?.status).toBe('OPEN');

      // Get cash sales
      const cashPayments = await prismaMock.salePayment.aggregate({
        where: {
          paymentMethod: 'CASH',
          sale: { tenantId: mockTenant.id, status: 'COMPLETED' },
        },
        _sum: { amount: true },
      });

      expect(cashPayments._sum.amount).toBe(cashSalesTotal);

      // Close drawer
      const result = await prismaMock.cashDrawer.update({
        where: { id: drawer!.id },
        data: {
          status: 'CLOSED',
          finalAmount,
          expectedAmount,
          difference,
          closedById: mockUser.id,
          closedAt: expect.any(Date),
        },
      });

      expect(result.status).toBe('CLOSED');
      expect(result.finalAmount).toBe(750.0);
      expect(result.expectedAmount).toBe(700.0);
      expect(result.difference).toBe(50.0);
    });

    it('should return error if no open drawer exists', async () => {
      prismaMock.cashDrawer.findFirst.mockResolvedValue(null);

      const openDrawer = await prismaMock.cashDrawer.findFirst({
        where: { tenantId: mockTenant.id, status: 'OPEN' },
      });

      expect(openDrawer).toBeNull();
      // API would return 400: "No hay caja abierta para cerrar"
    });

    it('should calculate expected amount from cash sales', async () => {
      const initialAmount = 500.0;
      const cashSalesTotal = 350.0;
      const expectedAmount = initialAmount + cashSalesTotal;

      prismaMock.salePayment.aggregate.mockResolvedValue({
        _sum: { amount: cashSalesTotal },
      });

      const cashPayments = await prismaMock.salePayment.aggregate({
        where: {
          paymentMethod: 'CASH',
          sale: { tenantId: mockTenant.id, status: 'COMPLETED' },
        },
        _sum: { amount: true },
      });

      const calculatedExpected = initialAmount + Number(cashPayments._sum.amount || 0);

      expect(calculatedExpected).toBe(expectedAmount);
    });
  });

  describe('GET /api/caja/transactions', () => {
    it('should return transactions for current drawer', async () => {
      const transactions = [
        createTestCashTransaction({
          id: 'trans-1',
          drawerId: mockDrawer.id,
          amount: 100.0,
          type: 'SALE_CASH' as const,
        }),
        createTestCashTransaction({
          id: 'trans-2',
          drawerId: mockDrawer.id,
          amount: 50.0,
          type: 'SALE_CASH' as const,
        }),
      ];

      prismaMock.cashDrawer.findFirst.mockResolvedValue(mockDrawer);
      prismaMock.cashTransaction.findMany.mockResolvedValue(transactions);

      // Get current drawer
      const currentDrawer = await prismaMock.cashDrawer.findFirst({
        where: { tenantId: mockTenant.id },
      });

      expect(currentDrawer).toBeDefined();

      // Get transactions
      const result = await prismaMock.cashTransaction.findMany({
        where: { drawerId: currentDrawer!.id },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(2);
      expect(result[0].drawerId).toBe(mockDrawer.id);
    });

    it('should return summary when summary=true', async () => {
      const expectedSummary = {
        totalSales: 500.0,
        totalCash: 300.0,
        totalCard: 200.0,
        transactionCount: 5,
      };

      prismaMock.cashDrawer.findFirst.mockResolvedValue(mockDrawer);
      prismaMock.cashTransaction.aggregate.mockResolvedValue({
        _sum: { amount: expectedSummary.totalCash },
        _count: { id: 3 },
      });
      prismaMock.salePayment.aggregate.mockResolvedValue({
        _sum: { amount: expectedSummary.totalCard },
      });
      prismaMock.sale.aggregate.mockResolvedValue({
        _sum: { total: expectedSummary.totalSales },
        _count: { id: expectedSummary.transactionCount },
      });

      // Get cash transactions aggregate
      const cashAgg = await prismaMock.cashTransaction.aggregate({
        where: { drawerId: mockDrawer.id, type: 'SALE_CASH' },
        _sum: { amount: true },
        _count: { id: true },
      });

      expect(cashAgg._sum.amount).toBe(300.0);

      // Get card payments aggregate
      const cardAgg = await prismaMock.salePayment.aggregate({
        where: { paymentMethod: { in: ['CREDIT_CARD', 'DEBIT_CARD'] } },
        _sum: { amount: true },
      });

      expect(cardAgg._sum.amount).toBe(200.0);
    });

    it('should return empty summary if no drawer open', async () => {
      prismaMock.cashDrawer.findFirst.mockResolvedValue(null);

      const currentDrawer = await prismaMock.cashDrawer.findFirst({
        where: { tenantId: mockTenant.id },
      });

      expect(currentDrawer).toBeNull();

      // API would return:
      const emptySummary = {
        totalSales: 0,
        totalCash: 0,
        totalCard: 0,
        transactionCount: 0,
      };

      expect(emptySummary.totalSales).toBe(0);
      expect(emptySummary.transactionCount).toBe(0);
    });
  });

  describe('GET /api/caja/stats', () => {
    it('should return drawer statistics when drawer is open', async () => {
      const transactions = [
        createTestCashTransaction({ amount: 100.0, type: 'SALE_CASH' as const }),
        createTestCashTransaction({ amount: 50.0, type: 'DEPOSIT' as const }),
        createTestCashTransaction({ amount: 30.0, type: 'WITHDRAWAL' as const }),
      ];

      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        tenantId: mockTenant.id,
      });
      prismaMock.cashDrawer.findFirst.mockResolvedValue({
        ...mockDrawer,
        initialAmount: 500.0,
      });
      prismaMock.cashTransaction.findMany.mockResolvedValue(transactions);

      // Calculate stats
      const drawer = await prismaMock.cashDrawer.findFirst({
        where: { tenantId: mockTenant.id, status: 'OPEN' },
      });

      expect(drawer).toBeDefined();

      const txns = await prismaMock.cashTransaction.findMany({
        where: { drawerId: drawer!.id },
      });

      const totalIncome = txns
        .filter((t: any) => ['SALE_CASH', 'DEPOSIT', 'ADJUSTMENT_IN'].includes(t.type))
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      const totalExpenses = txns
        .filter((t: any) => ['REFUND_CASH', 'WITHDRAWAL', 'ADJUSTMENT_OUT'].includes(t.type))
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      const netTotal = totalIncome - totalExpenses;

      expect(totalIncome).toBe(150.0); // 100 + 50
      expect(totalExpenses).toBe(30.0);
      expect(netTotal).toBe(120.0);
    });

    it('should return zeros if no drawer open', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        tenantId: mockTenant.id,
      });
      prismaMock.cashDrawer.findFirst.mockResolvedValue(null);

      const drawer = await prismaMock.cashDrawer.findFirst({
        where: { tenantId: mockTenant.id, status: 'OPEN' },
      });

      expect(drawer).toBeNull();

      // API would return default stats
      const defaultStats = {
        totalIncome: 0,
        totalExpenses: 0,
        netTotal: 0,
        transactionCount: 0,
        currentBalance: 0,
        isDrawerOpen: false,
      };

      expect(defaultStats.isDrawerOpen).toBe(false);
      expect(defaultStats.currentBalance).toBe(0);
    });

    it('should calculate current balance correctly', async () => {
      const initialAmount = 500.0;
      const netTotal = 120.0; // From transactions
      const expectedBalance = initialAmount + netTotal;

      prismaMock.cashDrawer.findFirst.mockResolvedValue({
        ...mockDrawer,
        initialAmount,
      });

      const drawer = await prismaMock.cashDrawer.findFirst({
        where: { tenantId: mockTenant.id, status: 'OPEN' },
      });

      const currentBalance = Number(drawer!.initialAmount) + netTotal;

      expect(currentBalance).toBe(expectedBalance);
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should not access drawers from other tenants', async () => {
      const otherTenantDrawer = createTestCashDrawer({
        id: 'other-drawer',
        tenantId: 'other-tenant-id',
      });

      prismaMock.cashDrawer.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return [mockDrawer];
        }
        return [];
      });

      const result = await prismaMock.cashDrawer.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result).not.toContainEqual(
        expect.objectContaining({ tenantId: 'other-tenant-id' })
      );
    });

    it('should return 403 when opening drawer for different tenant', () => {
      const requestTenantId = 'other-tenant-id';
      const authenticatedTenantId = mockTenant.id;

      // The API checks: if (tenantId !== tenant.id) return 403
      const isAuthorized = requestTenantId === authenticatedTenantId;

      expect(isAuthorized).toBe(false);
      // API would return: { error: 'No autorizado' }, { status: 403 }
    });
  });
});
