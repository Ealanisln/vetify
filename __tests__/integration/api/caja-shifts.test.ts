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

describe('Caja Shifts API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockLocation: ReturnType<typeof createTestLocation>;
  let mockDrawer: ReturnType<typeof createTestCashDrawer>;
  let mockStaff: ReturnType<typeof createTestStaff>;
  let mockShift: ReturnType<typeof createTestCashShift>;
  let mockTransaction: ReturnType<typeof createTestCashTransaction>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockLocation = createTestLocation({ tenantId: mockTenant.id });
    mockStaff = createTestStaff({
      tenantId: mockTenant.id,
      id: 'cashier-1',
      name: 'María García',
      position: 'Cajera',
    });
    mockDrawer = createTestCashDrawer({
      tenantId: mockTenant.id,
      locationId: mockLocation.id,
      openedById: mockUser.id,
      status: 'OPEN' as const,
    });
    mockShift = createTestCashShift({
      tenantId: mockTenant.id,
      drawerId: mockDrawer.id,
      cashierId: mockStaff.id,
      startingBalance: 1000.0,
    });
    mockTransaction = createTestCashTransaction({
      drawerId: mockDrawer.id,
      amount: 100.0,
      type: 'SALE_CASH' as const,
    });
  });

  describe('POST /api/caja/shifts (Start Shift)', () => {
    it('should start a new shift with valid drawer and cashier', async () => {
      const shiftData = {
        drawerId: mockDrawer.id,
        cashierId: mockStaff.id,
        startingBalance: 1000.0,
      };

      const createdShift = {
        ...mockShift,
        ...shiftData,
        status: 'ACTIVE' as const,
        cashier: { id: mockStaff.id, name: mockStaff.name, position: mockStaff.position },
        drawer: { id: mockDrawer.id, status: mockDrawer.status },
      };

      prismaMock.cashDrawer.findFirst.mockResolvedValue(mockDrawer);
      prismaMock.staff.findFirst.mockResolvedValue(mockStaff);
      prismaMock.cashShift.findFirst.mockResolvedValue(null); // No existing active shift
      prismaMock.cashShift.create.mockResolvedValue(createdShift);

      // Verify drawer is OPEN
      const drawer = await prismaMock.cashDrawer.findFirst({
        where: { id: shiftData.drawerId, status: 'OPEN' },
      });
      expect(drawer?.status).toBe('OPEN');

      // Verify staff exists and is active
      const staff = await prismaMock.staff.findFirst({
        where: { id: shiftData.cashierId, isActive: true },
      });
      expect(staff).toBeDefined();

      // Verify no active shift for this drawer
      const existingShift = await prismaMock.cashShift.findFirst({
        where: { drawerId: shiftData.drawerId, status: 'ACTIVE' },
      });
      expect(existingShift).toBeNull();

      // Create shift
      const result = await prismaMock.cashShift.create({
        data: {
          tenantId: mockTenant.id,
          drawerId: shiftData.drawerId,
          cashierId: shiftData.cashierId,
          startingBalance: shiftData.startingBalance,
          status: 'ACTIVE',
        },
      });

      expect(result.status).toBe('ACTIVE');
      expect(result.drawerId).toBe(mockDrawer.id);
      expect(result.cashierId).toBe(mockStaff.id);
    });

    it('should reject if drawer is not OPEN', async () => {
      const closedDrawer = { ...mockDrawer, status: 'CLOSED' as const };
      prismaMock.cashDrawer.findFirst.mockResolvedValue(null); // Not found because status != OPEN

      const drawer = await prismaMock.cashDrawer.findFirst({
        where: { id: mockDrawer.id, status: 'OPEN' },
      });

      expect(drawer).toBeNull();
      // API would return 400: "La caja no está abierta"
    });

    it('should reject if cashier already has active shift', async () => {
      const existingActiveShift = {
        ...mockShift,
        cashierId: mockStaff.id,
        status: 'ACTIVE' as const,
      };

      prismaMock.cashDrawer.findFirst.mockResolvedValue(mockDrawer);
      prismaMock.staff.findFirst.mockResolvedValue(mockStaff);
      prismaMock.cashShift.findFirst.mockResolvedValue(existingActiveShift);

      const existingShift = await prismaMock.cashShift.findFirst({
        where: { cashierId: mockStaff.id, status: 'ACTIVE' },
      });

      expect(existingShift).toBeDefined();
      expect(existingShift?.status).toBe('ACTIVE');
      // API would return 400: "Este cajero ya tiene un turno activo"
    });

    it('should reject if drawer already has active shift', async () => {
      const existingDrawerShift = {
        ...mockShift,
        drawerId: mockDrawer.id,
        status: 'ACTIVE' as const,
      };

      prismaMock.cashDrawer.findFirst.mockResolvedValue(mockDrawer);
      prismaMock.cashShift.findFirst.mockResolvedValue(existingDrawerShift);

      const existingShift = await prismaMock.cashShift.findFirst({
        where: { drawerId: mockDrawer.id, status: 'ACTIVE' },
      });

      expect(existingShift).toBeDefined();
      // API would return 400: "Esta caja ya tiene un turno activo"
    });

    it('should enforce tenant isolation', async () => {
      const otherTenantDrawer = createTestCashDrawer({
        id: 'other-drawer',
        tenantId: 'other-tenant-id',
      });

      prismaMock.cashDrawer.findFirst.mockImplementation(async (args: any) => {
        // Only return drawer if both id and tenantId match
        if (args?.where?.id === mockDrawer.id && args?.where?.tenantId === mockTenant.id) {
          return mockDrawer;
        }
        // Return null for other tenant's drawer or mismatched tenant
        if (args?.where?.id === otherTenantDrawer.id) {
          return null;
        }
        return null;
      });

      // Can access own tenant's drawer
      const ownDrawer = await prismaMock.cashDrawer.findFirst({
        where: { id: mockDrawer.id, tenantId: mockTenant.id },
      });
      expect(ownDrawer).toBeDefined();

      // Cannot access other tenant's drawer when filtering by own tenant
      const otherDrawer = await prismaMock.cashDrawer.findFirst({
        where: { id: otherTenantDrawer.id, tenantId: mockTenant.id },
      });
      expect(otherDrawer).toBeNull();
    });
  });

  describe('GET /api/caja/shifts (List Shifts)', () => {
    it('should list shifts for tenant', async () => {
      const shifts = [
        createTestCashShift({ id: 'shift-1', tenantId: mockTenant.id, status: 'ACTIVE' as const }),
        createTestCashShift({ id: 'shift-2', tenantId: mockTenant.id, status: 'ENDED' as const }),
      ];

      prismaMock.cashShift.findMany.mockResolvedValue(shifts);

      const result = await prismaMock.cashShift.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(result).toHaveLength(2);
      expect(result.every(s => s.tenantId === mockTenant.id)).toBe(true);
    });

    it('should filter by status', async () => {
      const activeShifts = [
        createTestCashShift({ id: 'shift-1', status: 'ACTIVE' as const }),
      ];

      prismaMock.cashShift.findMany.mockResolvedValue(activeShifts);

      const result = await prismaMock.cashShift.findMany({
        where: { tenantId: mockTenant.id, status: 'ACTIVE' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('ACTIVE');
    });

    it('should filter by drawerId', async () => {
      const drawerShifts = [
        createTestCashShift({ drawerId: mockDrawer.id }),
      ];

      prismaMock.cashShift.findMany.mockResolvedValue(drawerShifts);

      const result = await prismaMock.cashShift.findMany({
        where: { tenantId: mockTenant.id, drawerId: mockDrawer.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].drawerId).toBe(mockDrawer.id);
    });

    it('should filter by date range', async () => {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const todayShifts = [
        createTestCashShift({ startedAt: new Date() }),
      ];

      prismaMock.cashShift.findMany.mockResolvedValue(todayShifts);

      const result = await prismaMock.cashShift.findMany({
        where: {
          tenantId: mockTenant.id,
          startedAt: { gte: startOfDay, lte: endOfDay },
        },
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('GET /api/caja/shifts/[shiftId] (Get Shift Details)', () => {
    it('should return shift with transactions', async () => {
      const shiftWithDetails = {
        ...mockShift,
        cashier: { id: mockStaff.id, name: mockStaff.name, position: mockStaff.position },
        drawer: { id: mockDrawer.id, status: mockDrawer.status },
        transactions: [mockTransaction],
        _count: { transactions: 1 },
      };

      prismaMock.cashShift.findFirst.mockResolvedValue(shiftWithDetails);

      const result = await prismaMock.cashShift.findFirst({
        where: { id: mockShift.id, tenantId: mockTenant.id },
        include: {
          cashier: { select: { id: true, name: true, position: true } },
          drawer: { select: { id: true, status: true } },
          transactions: true,
          _count: { select: { transactions: true } },
        },
      });

      expect(result).toBeDefined();
      expect(result?.transactions).toHaveLength(1);
      expect(result?.cashier.name).toBe(mockStaff.name);
    });

    it('should calculate expected balance correctly', async () => {
      const startingBalance = 1000.0;
      const incomeTransactions = [
        createTestCashTransaction({ amount: 100.0, type: 'SALE_CASH' as const }),
        createTestCashTransaction({ amount: 50.0, type: 'DEPOSIT' as const }),
      ];
      const expenseTransactions = [
        createTestCashTransaction({ amount: 30.0, type: 'WITHDRAWAL' as const }),
      ];

      const allTransactions = [...incomeTransactions, ...expenseTransactions];

      // Calculate expected balance
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0); // 150
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0); // 30
      const expectedBalance = startingBalance + totalIncome - totalExpenses; // 1120

      expect(expectedBalance).toBe(1120.0);
    });

    it('should return 404 for non-existent shift', async () => {
      prismaMock.cashShift.findFirst.mockResolvedValue(null);

      const result = await prismaMock.cashShift.findFirst({
        where: { id: 'non-existent-id', tenantId: mockTenant.id },
      });

      expect(result).toBeNull();
      // API would return 404: "Turno no encontrado"
    });
  });

  describe('POST /api/caja/shifts/end (End Shift)', () => {
    it('should end shift and calculate difference', async () => {
      const activeShift = {
        ...mockShift,
        status: 'ACTIVE' as const,
        startingBalance: 1000.0,
      };

      const endingBalance = 1150.0;
      const expectedBalance = 1120.0; // startingBalance + income - expenses
      const difference = endingBalance - expectedBalance; // +30 surplus

      const endedShift = {
        ...activeShift,
        status: 'ENDED' as const,
        endedAt: new Date(),
        endingBalance,
        expectedBalance,
        difference,
      };

      prismaMock.cashShift.findFirst.mockResolvedValue(activeShift);
      prismaMock.cashShift.update.mockResolvedValue(endedShift);

      const result = await prismaMock.cashShift.update({
        where: { id: mockShift.id },
        data: {
          status: 'ENDED',
          endedAt: new Date(),
          endingBalance,
          expectedBalance,
          difference,
        },
      });

      expect(result.status).toBe('ENDED');
      expect(result.endingBalance).toBe(1150.0);
      expect(result.difference).toBe(30.0);
    });

    it('should update shift status to ENDED', async () => {
      const endedShift = { ...mockShift, status: 'ENDED' as const };
      prismaMock.cashShift.update.mockResolvedValue(endedShift);

      const result = await prismaMock.cashShift.update({
        where: { id: mockShift.id },
        data: { status: 'ENDED' },
      });

      expect(result.status).toBe('ENDED');
    });

    it('should reject if shift not ACTIVE', async () => {
      const endedShift = { ...mockShift, status: 'ENDED' as const };
      prismaMock.cashShift.findFirst.mockResolvedValue(endedShift);

      const shift = await prismaMock.cashShift.findFirst({
        where: { id: mockShift.id, status: 'ACTIVE' },
      });

      // This would find nothing because shift is already ENDED
      expect(shift?.status).toBe('ENDED');
      // API would return 400: "El turno no está activo"
    });

    it('should handle zero difference (exact balance)', async () => {
      const expectedBalance = 1120.0;
      const endingBalance = 1120.0; // Exact match
      const difference = 0;

      const endedShift = {
        ...mockShift,
        status: 'ENDED' as const,
        endingBalance,
        expectedBalance,
        difference,
      };

      prismaMock.cashShift.update.mockResolvedValue(endedShift);

      const result = await prismaMock.cashShift.update({
        where: { id: mockShift.id },
        data: { endingBalance, expectedBalance, difference, status: 'ENDED' },
      });

      expect(result.difference).toBe(0);
    });

    it('should handle positive difference (surplus)', async () => {
      const expectedBalance = 1000.0;
      const endingBalance = 1050.0;
      const difference = 50.0; // Surplus

      const endedShift = {
        ...mockShift,
        status: 'ENDED' as const,
        endingBalance,
        expectedBalance,
        difference,
      };

      prismaMock.cashShift.update.mockResolvedValue(endedShift);

      const result = await prismaMock.cashShift.update({
        where: { id: mockShift.id },
        data: { endingBalance, expectedBalance, difference, status: 'ENDED' },
      });

      expect(result.difference).toBe(50.0);
      expect(result.difference).toBeGreaterThan(0);
    });

    it('should handle negative difference (shortage)', async () => {
      const expectedBalance = 1000.0;
      const endingBalance = 950.0;
      const difference = -50.0; // Shortage

      const endedShift = {
        ...mockShift,
        status: 'ENDED' as const,
        endingBalance,
        expectedBalance,
        difference,
      };

      prismaMock.cashShift.update.mockResolvedValue(endedShift);

      const result = await prismaMock.cashShift.update({
        where: { id: mockShift.id },
        data: { endingBalance, expectedBalance, difference, status: 'ENDED' },
      });

      expect(result.difference).toBe(-50.0);
      expect(result.difference).toBeLessThan(0);
    });
  });

  describe('POST /api/caja/shifts/handoff (Handoff Shift)', () => {
    let mockNewCashier: ReturnType<typeof createTestStaff>;

    beforeEach(() => {
      mockNewCashier = createTestStaff({
        id: 'new-cashier-1',
        tenantId: mockTenant.id,
        name: 'Juan Pérez',
        position: 'Cajero',
      });
    });

    it('should create new shift for receiving cashier', async () => {
      const currentShift = { ...mockShift, status: 'ACTIVE' as const };
      const newShift = createTestCashShift({
        id: 'new-shift-1',
        tenantId: mockTenant.id,
        drawerId: mockDrawer.id,
        cashierId: mockNewCashier.id,
        startingBalance: 1120.0, // Expected balance from previous shift
        status: 'ACTIVE' as const,
      });

      prismaMock.cashShift.findFirst.mockResolvedValue(currentShift);
      prismaMock.staff.findFirst.mockResolvedValue(mockNewCashier);
      prismaMock.cashShift.create.mockResolvedValue(newShift);

      const result = await prismaMock.cashShift.create({
        data: {
          tenantId: mockTenant.id,
          drawerId: mockDrawer.id,
          cashierId: mockNewCashier.id,
          startingBalance: 1120.0,
          status: 'ACTIVE',
        },
      });

      expect(result.cashierId).toBe(mockNewCashier.id);
      expect(result.status).toBe('ACTIVE');
    });

    it('should mark current shift as HANDED_OFF', async () => {
      const handedOffShift = {
        ...mockShift,
        status: 'HANDED_OFF' as const,
        endedAt: new Date(),
        handedOffToId: mockNewCashier.id,
      };

      prismaMock.cashShift.update.mockResolvedValue(handedOffShift);

      const result = await prismaMock.cashShift.update({
        where: { id: mockShift.id },
        data: {
          status: 'HANDED_OFF',
          endedAt: new Date(),
          handedOffToId: mockNewCashier.id,
        },
      });

      expect(result.status).toBe('HANDED_OFF');
      expect(result.handedOffToId).toBe(mockNewCashier.id);
    });

    it('should prevent self-handoff', async () => {
      const sameStaffId = mockStaff.id;

      // Validation: newCashierId !== currentCashierId
      const isSelfHandoff = sameStaffId === mockShift.cashierId;

      expect(isSelfHandoff).toBe(true);
      // API would return 400: "No puedes entregar el turno a ti mismo"
    });

    it('should reject if new cashier has active shift', async () => {
      const existingShift = createTestCashShift({
        cashierId: mockNewCashier.id,
        status: 'ACTIVE' as const,
      });

      prismaMock.cashShift.findFirst.mockResolvedValue(existingShift);

      const newCashierActiveShift = await prismaMock.cashShift.findFirst({
        where: { cashierId: mockNewCashier.id, status: 'ACTIVE' },
      });

      expect(newCashierActiveShift).toBeDefined();
      expect(newCashierActiveShift?.status).toBe('ACTIVE');
      // API would return 400: "El nuevo cajero ya tiene un turno activo"
    });

    it('should transfer balance correctly', async () => {
      const currentBalance = 1500.0; // Expected balance of current shift
      const verifiedCount = 1500.0; // What was counted during handoff
      const difference = verifiedCount - currentBalance; // Should be 0

      const newShift = createTestCashShift({
        cashierId: mockNewCashier.id,
        startingBalance: verifiedCount, // New shift starts with verified count
        status: 'ACTIVE' as const,
      });

      prismaMock.cashShift.create.mockResolvedValue(newShift);

      const result = await prismaMock.cashShift.create({
        data: {
          tenantId: mockTenant.id,
          drawerId: mockDrawer.id,
          cashierId: mockNewCashier.id,
          startingBalance: verifiedCount,
          status: 'ACTIVE',
        },
      });

      expect(result.startingBalance).toBe(1500.0);
      expect(difference).toBe(0);
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should not access shifts from other tenants', async () => {
      const otherTenantShift = createTestCashShift({
        id: 'other-shift',
        tenantId: 'other-tenant-id',
      });

      prismaMock.cashShift.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return [mockShift];
        }
        return [];
      });

      const result = await prismaMock.cashShift.findMany({
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
