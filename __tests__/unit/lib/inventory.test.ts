/**
 * Inventory Library Tests
 * Tests for low stock post-filter logic after minStock bug fix.
 *
 * Bug: Prisma doesn't support column-to-column comparisons in `where`.
 * Fix: Fetch candidates with minStock set, then post-filter in JS.
 */

const mockFindMany = jest.fn();
const mockCount = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    inventoryItem: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

import { getLowStockItems, getInventoryStats } from '@/lib/inventory';

describe('Inventory - Low Stock Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLowStockItems', () => {
    it('returns only items where quantity <= minStock', async () => {
      mockFindMany.mockResolvedValue([
        { id: '1', name: 'Item A', quantity: 3, minStock: 5, _count: { saleItems: 0 } },
        { id: '2', name: 'Item B', quantity: 10, minStock: 5, _count: { saleItems: 2 } },
        { id: '3', name: 'Item C', quantity: 5, minStock: 5, _count: { saleItems: 1 } },
        { id: '4', name: 'Item D', quantity: 0, minStock: 2, _count: { saleItems: 0 } },
      ]);

      const result = await getLowStockItems('tenant-1');

      // Items A (3 <= 5), C (5 <= 5), D (0 <= 2) should be returned
      // Item B (10 > 5) should be excluded
      expect(result).toHaveLength(3);
      expect(result.map(i => i.id)).toEqual(['1', '3', '4']);
    });

    it('returns empty array when all items are above threshold', async () => {
      mockFindMany.mockResolvedValue([
        { id: '1', name: 'Item A', quantity: 10, minStock: 5, _count: { saleItems: 0 } },
        { id: '2', name: 'Item B', quantity: 20, minStock: 5, _count: { saleItems: 0 } },
      ]);

      const result = await getLowStockItems('tenant-1');

      expect(result).toHaveLength(0);
    });

    it('returns empty array when no items have minStock set', async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await getLowStockItems('tenant-1');

      expect(result).toHaveLength(0);
    });

    it('queries with correct tenant and status filters', async () => {
      mockFindMany.mockResolvedValue([]);

      await getLowStockItems('tenant-123');

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-123',
            status: 'ACTIVE',
            minStock: { not: null },
          }),
        })
      );
    });
  });

  describe('getInventoryStats', () => {
    it('lowStockItems count is correct after post-filter', async () => {
      // The getInventoryStats calls Promise.all with multiple queries
      // The low stock query (index 2) now uses findMany + filter
      mockCount
        .mockResolvedValueOnce(10) // totalItems
        .mockResolvedValueOnce(8)  // activeItems
        .mockResolvedValueOnce(2)  // outOfStockItems
        .mockResolvedValueOnce(1); // expiringSoon

      // This is the findMany for low stock (called via .then)
      mockFindMany.mockResolvedValue([
        { quantity: 3, minStock: 5 },  // low stock
        { quantity: 10, minStock: 5 }, // NOT low stock
        { quantity: 1, minStock: 2 },  // low stock
      ]);

      const result = await getInventoryStats('tenant-1');

      expect(result.lowStockItems).toBe(2);
      expect(result.totalItems).toBe(10);
      expect(result.activeItems).toBe(8);
    });
  });
});
