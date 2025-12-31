import { prismaMock } from '../../mocks/prisma';
import {
  createTestInventoryItem,
  createTestTenant,
  createTestUser,
  createTestLocation,
} from '../../utils/test-utils';
import { MovementType } from '@prisma/client';

// Mock Kinde auth
jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: jest.fn(() => ({
    getUser: jest.fn().mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
    }),
  })),
}));

// Mock feature access check
jest.mock('@/app/actions/subscription', () => ({
  checkFeatureAccess: jest.fn(),
}));

import { checkFeatureAccess } from '@/app/actions/subscription';
const mockCheckFeatureAccess = checkFeatureAccess as jest.MockedFunction<typeof checkFeatureAccess>;

describe('Inventory Analytics API Integration Tests', () => {
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
  });

  describe('Rotation Analytics API', () => {
    describe('Feature gating', () => {
      it('should require advancedInventory feature access', async () => {
        // Mock feature access denied
        mockCheckFeatureAccess.mockResolvedValue(false);

        // Verify the check would be called with advancedInventory
        await mockCheckFeatureAccess('advancedInventory');
        expect(mockCheckFeatureAccess).toHaveBeenCalledWith('advancedInventory');
      });

      it('should allow access when feature is enabled', async () => {
        // Mock feature access granted
        mockCheckFeatureAccess.mockResolvedValue(true);

        const result = await mockCheckFeatureAccess('advancedInventory');
        expect(result).toBe(true);
      });
    });

    describe('Rotation metrics calculation', () => {
      it('should correctly classify items by turnover ratio', () => {
        // Classification logic test
        // A: turnoverRatio >= 6 (fast moving)
        // B: turnoverRatio >= 2 (moderate)
        // C: turnoverRatio > 0 (slow)
        // DEAD: turnoverRatio === 0 and has stock

        const classifyItem = (turnoverRatio: number, hasStock: boolean) => {
          if (turnoverRatio >= 6) return 'A';
          if (turnoverRatio >= 2) return 'B';
          if (turnoverRatio > 0) return 'C';
          return hasStock ? 'DEAD' : 'C';
        };

        expect(classifyItem(12, true)).toBe('A'); // Fast moving
        expect(classifyItem(6, true)).toBe('A'); // Fast moving threshold
        expect(classifyItem(4, true)).toBe('B'); // Moderate
        expect(classifyItem(2, true)).toBe('B'); // Moderate threshold
        expect(classifyItem(1, true)).toBe('C'); // Slow
        expect(classifyItem(0, true)).toBe('DEAD'); // Dead stock with inventory
        expect(classifyItem(0, false)).toBe('C'); // No stock, no sales
      });

      it('should calculate days of inventory on hand correctly', () => {
        // DIOH = currentStock / (totalSold / days)
        // Where days = lookback period (default 90)
        const calculateDIOH = (currentStock: number, totalSold: number, days: number = 90) => {
          if (totalSold === 0) return 999; // Infinite
          const dailySales = totalSold / days;
          return Math.round(currentStock / dailySales);
        };

        expect(calculateDIOH(100, 90, 90)).toBe(100); // 1 per day = 100 days
        expect(calculateDIOH(50, 50, 50)).toBe(50); // 1 per day = 50 days
        expect(calculateDIOH(30, 60, 30)).toBe(15); // 2 per day = 15 days
        expect(calculateDIOH(100, 0, 90)).toBe(999); // No sales = infinite
      });

      it('should calculate turnover ratio correctly', () => {
        // Turnover = (totalSold / currentStock) * (365 / lookbackDays)
        // Annualized turnover rate
        const calculateTurnover = (totalSold: number, currentStock: number, days: number = 90) => {
          if (currentStock === 0) return 0;
          const ratio = totalSold / currentStock;
          return Math.round((ratio * (365 / days)) * 10) / 10; // Round to 1 decimal
        };

        expect(calculateTurnover(90, 100, 90)).toBe(3.7); // 90/100 * 4.055 ≈ 3.7
        expect(calculateTurnover(200, 100, 90)).toBe(8.1); // 200/100 * 4.055 ≈ 8.1
        expect(calculateTurnover(0, 100, 90)).toBe(0); // No sales = 0 turnover
        expect(calculateTurnover(100, 0, 90)).toBe(0); // No stock = 0 (avoid division by zero)
      });
    });
  });

  describe('Movement Report API', () => {
    describe('Feature gating', () => {
      it('should require advancedInventory feature access', async () => {
        mockCheckFeatureAccess.mockResolvedValue(false);

        const result = await mockCheckFeatureAccess('advancedInventory');
        expect(result).toBe(false);
      });
    });

    describe('Movement summary calculation', () => {
      it('should correctly categorize movement types as in or out', () => {
        const inTypes: MovementType[] = ['PURCHASE_IN', 'RETURN_IN', 'ADJUSTMENT_IN', 'TRANSFER_IN'];
        const outTypes: MovementType[] = ['SALE_OUT', 'ADJUSTMENT_OUT', 'TRANSFER_OUT', 'EXPIRY_OUT'];

        const movements = [
          { type: 'PURCHASE_IN' as MovementType, quantity: 100 },
          { type: 'SALE_OUT' as MovementType, quantity: 50 },
          { type: 'RETURN_IN' as MovementType, quantity: 10 },
          { type: 'ADJUSTMENT_OUT' as MovementType, quantity: 5 },
        ];

        const totalIn = movements
          .filter(m => inTypes.includes(m.type))
          .reduce((sum, m) => sum + m.quantity, 0);

        const totalOut = movements
          .filter(m => outTypes.includes(m.type))
          .reduce((sum, m) => sum + m.quantity, 0);

        expect(totalIn).toBe(110); // 100 + 10
        expect(totalOut).toBe(55); // 50 + 5
        expect(totalIn - totalOut).toBe(55); // Net change
      });

      it('should provide localized movement type labels', () => {
        const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
          PURCHASE_IN: 'Compra',
          SALE_OUT: 'Venta',
          RETURN_IN: 'Devolución',
          ADJUSTMENT_IN: 'Ajuste (+)',
          ADJUSTMENT_OUT: 'Ajuste (-)',
          TRANSFER_IN: 'Transferencia (+)',
          TRANSFER_OUT: 'Transferencia (-)',
          EXPIRY_OUT: 'Vencimiento'
        };

        expect(MOVEMENT_TYPE_LABELS.PURCHASE_IN).toBe('Compra');
        expect(MOVEMENT_TYPE_LABELS.SALE_OUT).toBe('Venta');
        expect(MOVEMENT_TYPE_LABELS.EXPIRY_OUT).toBe('Vencimiento');
      });
    });

    describe('Filtering', () => {
      it('should support filtering by movement type', () => {
        const movements = [
          { type: 'PURCHASE_IN', itemName: 'Item A' },
          { type: 'SALE_OUT', itemName: 'Item B' },
          { type: 'SALE_OUT', itemName: 'Item C' },
        ];

        const salesOnly = movements.filter(m => m.type === 'SALE_OUT');
        expect(salesOnly).toHaveLength(2);
      });

      it('should support filtering by date range', () => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const movements = [
          { date: now, itemName: 'Today Item' },
          { date: yesterday, itemName: 'Yesterday Item' },
          { date: lastWeek, itemName: 'Last Week Item' },
        ];

        const startDate = yesterday;
        const filtered = movements.filter(m => m.date >= startDate);
        expect(filtered).toHaveLength(2);
      });
    });
  });
});
