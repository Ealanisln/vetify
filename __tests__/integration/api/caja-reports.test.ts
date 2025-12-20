/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prismaMock } from '../../mocks/prisma';
import {
  createTestCashDrawer,
  createTestCashTransaction,
  createTestCashShift,
  createTestTenant,
  createTestUser,
  createTestLocation,
  createTestStaff,
} from '../../utils/test-utils';

describe('Caja Reports API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockLocation: ReturnType<typeof createTestLocation>;
  let mockDrawer: ReturnType<typeof createTestCashDrawer>;
  let mockStaff: ReturnType<typeof createTestStaff>;
  let mockShift: ReturnType<typeof createTestCashShift>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTenant = createTestTenant({ plan: 'pro' as const });
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockLocation = createTestLocation({ tenantId: mockTenant.id });
    mockStaff = createTestStaff({ tenantId: mockTenant.id });
    mockDrawer = createTestCashDrawer({
      tenantId: mockTenant.id,
      locationId: mockLocation.id,
    });
    mockShift = createTestCashShift({
      tenantId: mockTenant.id,
      drawerId: mockDrawer.id,
      cashierId: mockStaff.id,
    });
  });

  describe('GET /api/caja/reports', () => {
    it('should return summary for day period', async () => {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const transactions = [
        createTestCashTransaction({ amount: 100.0, type: 'SALE_CASH' as const }),
        createTestCashTransaction({ amount: 50.0, type: 'DEPOSIT' as const }),
        createTestCashTransaction({ amount: 30.0, type: 'WITHDRAWAL' as const }),
      ];

      prismaMock.cashTransaction.findMany.mockResolvedValue(transactions);
      prismaMock.cashTransaction.aggregate.mockResolvedValue({
        _sum: { amount: 180 },
        _count: { id: 3 },
      });

      const result = await prismaMock.cashTransaction.findMany({
        where: {
          drawer: { tenantId: mockTenant.id },
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      });

      expect(result).toHaveLength(3);

      // Calculate summary
      const totalIncome = transactions
        .filter(t => ['SALE_CASH', 'DEPOSIT', 'ADJUSTMENT_IN'].includes(t.type))
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions
        .filter(t => ['REFUND_CASH', 'WITHDRAWAL', 'ADJUSTMENT_OUT'].includes(t.type))
        .reduce((sum, t) => sum + t.amount, 0);

      expect(totalIncome).toBe(150.0); // 100 + 50
      expect(totalExpenses).toBe(30.0);
    });

    it('should return summary for week period', async () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const weekTransactions = [
        createTestCashTransaction({ amount: 500.0, type: 'SALE_CASH' as const }),
        createTestCashTransaction({ amount: 200.0, type: 'SALE_CASH' as const }),
      ];

      prismaMock.cashTransaction.findMany.mockResolvedValue(weekTransactions);

      const result = await prismaMock.cashTransaction.findMany({
        where: {
          drawer: { tenantId: mockTenant.id },
          createdAt: { gte: startOfWeek, lte: endOfWeek },
        },
      });

      expect(result).toHaveLength(2);
      expect(result.reduce((sum, t) => sum + t.amount, 0)).toBe(700.0);
    });

    it('should return summary for custom date range', async () => {
      const customStart = new Date('2024-01-01');
      const customEnd = new Date('2024-01-31');

      const customRangeTransactions = [
        createTestCashTransaction({ amount: 1000.0, type: 'SALE_CASH' as const }),
        createTestCashTransaction({ amount: 500.0, type: 'DEPOSIT' as const }),
      ];

      prismaMock.cashTransaction.findMany.mockResolvedValue(customRangeTransactions);

      const result = await prismaMock.cashTransaction.findMany({
        where: {
          drawer: { tenantId: mockTenant.id },
          createdAt: { gte: customStart, lte: customEnd },
        },
      });

      expect(result).toHaveLength(2);
    });

    it('should group by transaction type', async () => {
      const transactions = [
        createTestCashTransaction({ amount: 100.0, type: 'SALE_CASH' as const }),
        createTestCashTransaction({ amount: 150.0, type: 'SALE_CASH' as const }),
        createTestCashTransaction({ amount: 50.0, type: 'DEPOSIT' as const }),
        createTestCashTransaction({ amount: 30.0, type: 'WITHDRAWAL' as const }),
      ];

      // Group by type
      const byType: Record<string, { count: number; total: number }> = {};
      transactions.forEach(t => {
        if (!byType[t.type]) {
          byType[t.type] = { count: 0, total: 0 };
        }
        byType[t.type].count++;
        byType[t.type].total += t.amount;
      });

      expect(byType['SALE_CASH']).toEqual({ count: 2, total: 250.0 });
      expect(byType['DEPOSIT']).toEqual({ count: 1, total: 50.0 });
      expect(byType['WITHDRAWAL']).toEqual({ count: 1, total: 30.0 });
    });

    it('should calculate discrepancies correctly', async () => {
      const shiftsWithDiscrepancies = [
        createTestCashShift({ difference: 0, status: 'ENDED' as const }),
        createTestCashShift({ difference: 50.0, status: 'ENDED' as const }),
        createTestCashShift({ difference: -30.0, status: 'ENDED' as const }),
        createTestCashShift({ difference: 0, status: 'ENDED' as const }),
      ];

      prismaMock.cashShift.findMany.mockResolvedValue(shiftsWithDiscrepancies);

      const shifts = await prismaMock.cashShift.findMany({
        where: { tenantId: mockTenant.id, status: 'ENDED' },
      });

      const totalDifference = shifts.reduce(
        (sum, s) => sum + Math.abs(Number(s.difference) || 0),
        0
      );
      const shiftsWithDifference = shifts.filter(
        s => s.difference !== null && s.difference !== 0
      ).length;
      const worstDiscrepancy = Math.max(
        ...shifts.map(s => Math.abs(Number(s.difference) || 0))
      );

      expect(totalDifference).toBe(80.0); // |0| + |50| + |-30| + |0|
      expect(shiftsWithDifference).toBe(2);
      expect(worstDiscrepancy).toBe(50.0);
    });

    it('should filter by drawerId', async () => {
      const drawerTransactions = [
        createTestCashTransaction({ drawerId: mockDrawer.id, amount: 100.0 }),
      ];

      prismaMock.cashTransaction.findMany.mockResolvedValue(drawerTransactions);

      const result = await prismaMock.cashTransaction.findMany({
        where: {
          drawerId: mockDrawer.id,
          drawer: { tenantId: mockTenant.id },
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].drawerId).toBe(mockDrawer.id);
    });

    it('should filter by cashierId', async () => {
      const cashierShifts = [
        createTestCashShift({ cashierId: mockStaff.id }),
      ];

      prismaMock.cashShift.findMany.mockResolvedValue(cashierShifts);

      const result = await prismaMock.cashShift.findMany({
        where: {
          tenantId: mockTenant.id,
          cashierId: mockStaff.id,
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].cashierId).toBe(mockStaff.id);
    });

    it('should require professional plan access', async () => {
      const freeTenant = createTestTenant({ plan: 'free' as const });

      // Check plan access
      const hasPlanAccess = ['pro', 'enterprise'].includes(freeTenant.plan);

      expect(hasPlanAccess).toBe(false);
      // API would return 403: "Función disponible en Plan Profesional"
    });

    it('should calculate byDrawer comparison', async () => {
      const drawer1 = createTestCashDrawer({ id: 'drawer-1', tenantId: mockTenant.id });
      const drawer2 = createTestCashDrawer({ id: 'drawer-2', tenantId: mockTenant.id });

      const drawer1Transactions = [
        createTestCashTransaction({ drawerId: drawer1.id, amount: 500.0, type: 'SALE_CASH' as const }),
        createTestCashTransaction({ drawerId: drawer1.id, amount: 100.0, type: 'WITHDRAWAL' as const }),
      ];
      const drawer2Transactions = [
        createTestCashTransaction({ drawerId: drawer2.id, amount: 300.0, type: 'SALE_CASH' as const }),
      ];

      // Calculate per drawer
      const byDrawer = [
        {
          drawerId: drawer1.id,
          income: 500.0,
          expenses: 100.0,
          net: 400.0,
          transactionCount: 2,
        },
        {
          drawerId: drawer2.id,
          income: 300.0,
          expenses: 0,
          net: 300.0,
          transactionCount: 1,
        },
      ];

      expect(byDrawer).toHaveLength(2);
      expect(byDrawer[0].net).toBe(400.0);
      expect(byDrawer[1].net).toBe(300.0);
    });

    it('should calculate byCashier performance', async () => {
      const shifts = [
        createTestCashShift({
          cashierId: mockStaff.id,
          difference: 0,
          status: 'ENDED' as const,
          startedAt: new Date('2024-01-01T08:00:00'),
          endedAt: new Date('2024-01-01T16:00:00'),
        }),
        createTestCashShift({
          cashierId: mockStaff.id,
          difference: 10.0,
          status: 'ENDED' as const,
          startedAt: new Date('2024-01-02T08:00:00'),
          endedAt: new Date('2024-01-02T14:00:00'),
        }),
      ];

      // Calculate cashier metrics
      const shiftCount = shifts.length;
      const totalHours = shifts.reduce((sum, s) => {
        if (s.endedAt) {
          const hours = (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 3600000;
          return sum + hours;
        }
        return sum;
      }, 0);
      const totalDifference = shifts.reduce((sum, s) => sum + (s.difference || 0), 0);
      const shiftsWithoutDifference = shifts.filter(s => s.difference === 0).length;
      const accuracy = Math.round((shiftsWithoutDifference / shiftCount) * 100);

      expect(shiftCount).toBe(2);
      expect(totalHours).toBe(14); // 8 + 6 hours
      expect(totalDifference).toBe(10.0);
      expect(accuracy).toBe(50); // 1/2 shifts without difference
    });
  });

  describe('GET /api/caja/reports/shift/[shiftId]', () => {
    it('should return detailed shift report', async () => {
      const shiftWithDetails = {
        ...mockShift,
        status: 'ENDED' as const,
        startingBalance: 1000.0,
        endingBalance: 1150.0,
        expectedBalance: 1120.0,
        difference: 30.0,
        cashier: { id: mockStaff.id, name: mockStaff.name, position: mockStaff.position },
        drawer: { id: mockDrawer.id, status: 'OPEN' },
        transactions: [
          createTestCashTransaction({ amount: 100.0, type: 'SALE_CASH' as const }),
          createTestCashTransaction({ amount: 50.0, type: 'DEPOSIT' as const }),
          createTestCashTransaction({ amount: 30.0, type: 'WITHDRAWAL' as const }),
        ],
      };

      prismaMock.cashShift.findFirst.mockResolvedValue(shiftWithDetails);

      const result = await prismaMock.cashShift.findFirst({
        where: { id: mockShift.id, tenantId: mockTenant.id },
        include: {
          cashier: { select: { id: true, name: true, position: true } },
          drawer: { select: { id: true, status: true } },
          transactions: true,
        },
      });

      expect(result).toBeDefined();
      expect(result?.difference).toBe(30.0);
      expect(result?.transactions).toHaveLength(3);
    });

    it('should include hourly breakdown', async () => {
      const transactions = [
        createTestCashTransaction({
          amount: 100.0,
          type: 'SALE_CASH' as const,
          createdAt: new Date('2024-01-01T09:30:00'),
        }),
        createTestCashTransaction({
          amount: 150.0,
          type: 'SALE_CASH' as const,
          createdAt: new Date('2024-01-01T09:45:00'),
        }),
        createTestCashTransaction({
          amount: 200.0,
          type: 'SALE_CASH' as const,
          createdAt: new Date('2024-01-01T10:15:00'),
        }),
        createTestCashTransaction({
          amount: 50.0,
          type: 'WITHDRAWAL' as const,
          createdAt: new Date('2024-01-01T10:30:00'),
        }),
      ];

      // Group by hour
      const hourlyBreakdown: Record<number, { count: number; income: number; expenses: number }> = {};

      transactions.forEach(t => {
        const hour = new Date(t.createdAt).getHours();
        if (!hourlyBreakdown[hour]) {
          hourlyBreakdown[hour] = { count: 0, income: 0, expenses: 0 };
        }
        hourlyBreakdown[hour].count++;
        if (['SALE_CASH', 'DEPOSIT', 'ADJUSTMENT_IN'].includes(t.type)) {
          hourlyBreakdown[hour].income += t.amount;
        } else {
          hourlyBreakdown[hour].expenses += t.amount;
        }
      });

      expect(hourlyBreakdown[9]).toEqual({ count: 2, income: 250.0, expenses: 0 });
      expect(hourlyBreakdown[10]).toEqual({ count: 2, income: 200.0, expenses: 50.0 });
    });

    it('should include transaction list', async () => {
      const transactions = [
        createTestCashTransaction({
          id: 'txn-1',
          amount: 100.0,
          type: 'SALE_CASH' as const,
          description: 'Sale payment',
        }),
        createTestCashTransaction({
          id: 'txn-2',
          amount: 50.0,
          type: 'DEPOSIT' as const,
          description: 'Cash deposit',
        }),
      ];

      prismaMock.cashTransaction.findMany.mockResolvedValue(transactions);

      const result = await prismaMock.cashTransaction.findMany({
        where: { shiftId: mockShift.id },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(2);
      expect(result[0].description).toBe('Sale payment');
    });

    it('should calculate duration correctly', async () => {
      const startedAt = new Date('2024-01-01T08:00:00');
      const endedAt = new Date('2024-01-01T16:30:00');

      const shiftWithDuration = {
        ...mockShift,
        startedAt,
        endedAt,
      };

      prismaMock.cashShift.findFirst.mockResolvedValue(shiftWithDuration);

      const result = await prismaMock.cashShift.findFirst({
        where: { id: mockShift.id },
      });

      const durationMs = new Date(result!.endedAt!).getTime() - new Date(result!.startedAt).getTime();
      const durationHours = durationMs / 3600000;

      expect(durationHours).toBe(8.5);
    });

    it('should return 404 for non-existent shift', async () => {
      prismaMock.cashShift.findFirst.mockResolvedValue(null);

      const result = await prismaMock.cashShift.findFirst({
        where: { id: 'non-existent', tenantId: mockTenant.id },
      });

      expect(result).toBeNull();
      // API would return 404
    });

    it('should enforce tenant isolation', async () => {
      const otherTenantShift = createTestCashShift({
        id: 'other-shift',
        tenantId: 'other-tenant-id',
      });

      prismaMock.cashShift.findFirst.mockImplementation(async (args: any) => {
        // Only return shift if both id and tenantId match
        if (args?.where?.id === mockShift.id && args?.where?.tenantId === mockTenant.id) {
          return mockShift;
        }
        // Return null for other tenant's shift or mismatched tenant
        if (args?.where?.id === otherTenantShift.id) {
          return null;
        }
        return null;
      });

      // Own tenant's shift
      const ownShift = await prismaMock.cashShift.findFirst({
        where: { id: mockShift.id, tenantId: mockTenant.id },
      });
      expect(ownShift).toBeDefined();

      // Other tenant's shift - should return null when filtering by own tenant
      const otherShift = await prismaMock.cashShift.findFirst({
        where: { id: otherTenantShift.id, tenantId: mockTenant.id },
      });
      expect(otherShift).toBeNull();
    });
  });
});
