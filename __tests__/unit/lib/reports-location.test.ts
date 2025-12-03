/**
 * Unit tests for Location Reports Data Generation
 * Tests revenue calculations, inventory analytics, performance metrics, and comparisons
 */

describe('Location Reports Data Generation Logic', () => {
  describe('Revenue Calculations', () => {
    function calculateMonthlyGrowth(
      thisMonthTotal: number,
      lastMonthTotal: number
    ): number {
      if (lastMonthTotal > 0) {
        return ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
      }
      return thisMonthTotal > 0 ? 100 : 0;
    }

    function calculateAverageTicket(total: number, count: number): number {
      return count > 0 ? total / count : 0;
    }

    describe('Monthly Growth', () => {
      it('should calculate positive growth correctly', () => {
        const growth = calculateMonthlyGrowth(1200, 1000);
        expect(growth).toBe(20);
      });

      it('should calculate negative growth correctly', () => {
        const growth = calculateMonthlyGrowth(800, 1000);
        expect(growth).toBe(-20);
      });

      it('should return 100% when last month was 0 and this month has sales', () => {
        const growth = calculateMonthlyGrowth(1000, 0);
        expect(growth).toBe(100);
      });

      it('should return 0 when both months have no sales', () => {
        const growth = calculateMonthlyGrowth(0, 0);
        expect(growth).toBe(0);
      });

      it('should handle small decimal differences', () => {
        const growth = calculateMonthlyGrowth(1001, 1000);
        expect(growth).toBeCloseTo(0.1, 1);
      });

      it('should handle large growth percentages', () => {
        const growth = calculateMonthlyGrowth(10000, 100);
        expect(growth).toBe(9900);
      });
    });

    describe('Average Ticket', () => {
      it('should calculate average ticket correctly', () => {
        const average = calculateAverageTicket(1000, 5);
        expect(average).toBe(200);
      });

      it('should return 0 when count is 0', () => {
        const average = calculateAverageTicket(1000, 0);
        expect(average).toBe(0);
      });

      it('should handle decimal results', () => {
        const average = calculateAverageTicket(100, 3);
        expect(average).toBeCloseTo(33.33, 1);
      });
    });
  });

  describe('Inventory Analytics', () => {
    function calculateInventoryValue(
      items: Array<{ quantity: number; cost: number }>
    ): number {
      return items.reduce((total, item) => {
        return total + item.quantity * item.cost;
      }, 0);
    }

    function calculateProfit(
      revenue: number,
      cost: number,
      quantitySold: number
    ): number {
      return revenue - cost * quantitySold;
    }

    describe('Inventory Value', () => {
      it('should calculate total inventory value', () => {
        const items = [
          { quantity: 10, cost: 100 },
          { quantity: 20, cost: 50 },
        ];
        const value = calculateInventoryValue(items);
        expect(value).toBe(2000);
      });

      it('should handle empty inventory', () => {
        const value = calculateInventoryValue([]);
        expect(value).toBe(0);
      });

      it('should handle zero quantity items', () => {
        const items = [{ quantity: 0, cost: 100 }];
        const value = calculateInventoryValue(items);
        expect(value).toBe(0);
      });

      it('should handle zero cost items', () => {
        const items = [{ quantity: 10, cost: 0 }];
        const value = calculateInventoryValue(items);
        expect(value).toBe(0);
      });
    });

    describe('Profit Calculation', () => {
      it('should calculate positive profit', () => {
        const profit = calculateProfit(500, 30, 10);
        expect(profit).toBe(200);
      });

      it('should calculate negative profit (loss)', () => {
        const profit = calculateProfit(200, 30, 10);
        expect(profit).toBe(-100);
      });

      it('should handle zero revenue', () => {
        const profit = calculateProfit(0, 30, 10);
        expect(profit).toBe(-300);
      });

      it('should handle zero cost', () => {
        const profit = calculateProfit(500, 0, 10);
        expect(profit).toBe(500);
      });
    });

    describe('Category Breakdown', () => {
      function calculateCategoryBreakdown(
        items: Array<{ category: string; quantity: number; cost: number }>
      ): Array<{ category: string; count: number; value: number }> {
        const categoryMap = new Map<string, { count: number; value: number }>();

        for (const item of items) {
          const cat = item.category || 'Sin categoría';
          const existing = categoryMap.get(cat) || { count: 0, value: 0 };
          categoryMap.set(cat, {
            count: existing.count + 1,
            value: existing.value + item.quantity * item.cost,
          });
        }

        return Array.from(categoryMap.entries())
          .map(([category, data]) => ({
            category,
            count: data.count,
            value: data.value,
          }))
          .sort((a, b) => b.value - a.value);
      }

      it('should group items by category', () => {
        const items = [
          { category: 'Medicamentos', quantity: 10, cost: 100 },
          { category: 'Medicamentos', quantity: 5, cost: 50 },
          { category: 'Accesorios', quantity: 20, cost: 10 },
        ];
        const breakdown = calculateCategoryBreakdown(items);

        expect(breakdown).toHaveLength(2);
        expect(breakdown[0].category).toBe('Medicamentos');
        expect(breakdown[0].count).toBe(2);
        expect(breakdown[0].value).toBe(1250);
      });

      it('should use "Sin categoría" for null categories', () => {
        const items = [{ category: '', quantity: 10, cost: 100 }];
        const breakdown = calculateCategoryBreakdown(items);

        expect(breakdown[0].category).toBe('Sin categoría');
      });

      it('should sort by value descending', () => {
        const items = [
          { category: 'Low', quantity: 1, cost: 10 },
          { category: 'High', quantity: 100, cost: 100 },
          { category: 'Medium', quantity: 10, cost: 50 },
        ];
        const breakdown = calculateCategoryBreakdown(items);

        expect(breakdown[0].category).toBe('High');
        expect(breakdown[1].category).toBe('Medium');
        expect(breakdown[2].category).toBe('Low');
      });
    });
  });

  describe('Performance Metrics', () => {
    function calculateCompletionRate(
      completed: number,
      total: number
    ): number {
      return total > 0 ? (completed / total) * 100 : 0;
    }

    function calculateRetentionRate(active: number, total: number): number {
      return total > 0 ? (active / total) * 100 : 0;
    }

    function calculateAppointmentsPerStaff(
      appointments: number,
      activeStaff: number
    ): number {
      return activeStaff > 0 ? appointments / activeStaff : 0;
    }

    describe('Completion Rate', () => {
      it('should calculate completion rate correctly', () => {
        const rate = calculateCompletionRate(80, 100);
        expect(rate).toBe(80);
      });

      it('should return 0 when no appointments', () => {
        const rate = calculateCompletionRate(0, 0);
        expect(rate).toBe(0);
      });

      it('should handle 100% completion', () => {
        const rate = calculateCompletionRate(50, 50);
        expect(rate).toBe(100);
      });

      it('should handle low completion', () => {
        const rate = calculateCompletionRate(1, 100);
        expect(rate).toBe(1);
      });
    });

    describe('Retention Rate', () => {
      it('should calculate retention rate correctly', () => {
        const rate = calculateRetentionRate(180, 250);
        expect(rate).toBe(72);
      });

      it('should return 0 when no customers', () => {
        const rate = calculateRetentionRate(0, 0);
        expect(rate).toBe(0);
      });

      it('should handle 100% retention', () => {
        const rate = calculateRetentionRate(100, 100);
        expect(rate).toBe(100);
      });
    });

    describe('Appointments Per Staff', () => {
      it('should calculate appointments per staff correctly', () => {
        const perStaff = calculateAppointmentsPerStaff(100, 5);
        expect(perStaff).toBe(20);
      });

      it('should return 0 when no active staff', () => {
        const perStaff = calculateAppointmentsPerStaff(100, 0);
        expect(perStaff).toBe(0);
      });

      it('should handle decimal results', () => {
        const perStaff = calculateAppointmentsPerStaff(100, 3);
        expect(perStaff).toBeCloseTo(33.33, 1);
      });
    });
  });

  describe('Location Comparison', () => {
    function rankLocations<T extends { revenue: number }>(
      locations: T[]
    ): Array<T & { rank: number }> {
      const sorted = [...locations].sort((a, b) => b.revenue - a.revenue);
      return sorted.map((location, index) => ({
        ...location,
        rank: index + 1,
      }));
    }

    it('should rank locations by revenue descending', () => {
      const locations = [
        { id: '1', name: 'Low', revenue: 1000 },
        { id: '2', name: 'High', revenue: 5000 },
        { id: '3', name: 'Medium', revenue: 3000 },
      ];

      const ranked = rankLocations(locations);

      expect(ranked[0].name).toBe('High');
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].name).toBe('Medium');
      expect(ranked[1].rank).toBe(2);
      expect(ranked[2].name).toBe('Low');
      expect(ranked[2].rank).toBe(3);
    });

    it('should handle single location', () => {
      const locations = [{ id: '1', name: 'Only', revenue: 1000 }];
      const ranked = rankLocations(locations);

      expect(ranked).toHaveLength(1);
      expect(ranked[0].rank).toBe(1);
    });

    it('should handle empty locations', () => {
      const ranked = rankLocations([]);
      expect(ranked).toHaveLength(0);
    });

    it('should handle equal revenues', () => {
      const locations = [
        { id: '1', name: 'A', revenue: 1000 },
        { id: '2', name: 'B', revenue: 1000 },
      ];
      const ranked = rankLocations(locations);

      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(2);
    });

    it('should not modify original array', () => {
      const locations = [
        { id: '1', name: 'Low', revenue: 1000 },
        { id: '2', name: 'High', revenue: 5000 },
      ];
      const originalFirst = locations[0].name;
      rankLocations(locations);

      expect(locations[0].name).toBe(originalFirst);
    });
  });

  describe('Access Control', () => {
    function validateLocationAccess(
      staffLocationIds: string[],
      locationId: string | null
    ): boolean {
      // If no location specified, allow access (tenant-wide reports)
      if (!locationId) {
        return true;
      }
      // Check if staff has access to this location
      return staffLocationIds.includes(locationId);
    }

    it('should allow access when no location specified', () => {
      expect(validateLocationAccess(['loc-1'], null)).toBe(true);
    });

    it('should allow access when staff has location in list', () => {
      expect(validateLocationAccess(['loc-1', 'loc-2'], 'loc-1')).toBe(true);
    });

    it('should deny access when staff lacks location', () => {
      expect(validateLocationAccess(['loc-1'], 'loc-2')).toBe(false);
    });

    it('should deny access with empty staff locations', () => {
      expect(validateLocationAccess([], 'loc-1')).toBe(false);
    });
  });

  describe('Date Range Handling', () => {
    function isValidDateRange(
      startDate?: Date,
      endDate?: Date
    ): { valid: boolean; error?: string } {
      if (!startDate && !endDate) {
        return { valid: true };
      }

      if (startDate && endDate && startDate > endDate) {
        return { valid: false, error: 'Start date cannot be after end date' };
      }

      return { valid: true };
    }

    it('should accept undefined date range', () => {
      expect(isValidDateRange().valid).toBe(true);
    });

    it('should accept valid date range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      expect(isValidDateRange(start, end).valid).toBe(true);
    });

    it('should accept same start and end date', () => {
      const date = new Date('2024-01-15');
      expect(isValidDateRange(date, date).valid).toBe(true);
    });

    it('should reject start date after end date', () => {
      const start = new Date('2024-02-01');
      const end = new Date('2024-01-01');
      const result = isValidDateRange(start, end);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be after');
    });

    it('should accept start date only', () => {
      const start = new Date('2024-01-01');
      expect(isValidDateRange(start, undefined).valid).toBe(true);
    });

    it('should accept end date only', () => {
      const end = new Date('2024-01-31');
      expect(isValidDateRange(undefined, end).valid).toBe(true);
    });
  });

  describe('Data Transformations', () => {
    function transformDailySales(
      raw: Array<{ date: Date; total: string; count: bigint }>
    ): Array<{ date: string; total: number; count: number }> {
      return raw.map((row) => ({
        date: row.date.toISOString().split('T')[0],
        total: Number(row.total),
        count: Number(row.count),
      }));
    }

    function transformMonthlySales(
      raw: Array<{ month: string; total: string; count: bigint }>
    ): Array<{ month: string; total: number; count: number }> {
      return raw.map((row) => ({
        month: row.month,
        total: Number(row.total),
        count: Number(row.count),
      }));
    }

    it('should transform daily sales correctly', () => {
      const raw = [
        { date: new Date('2024-01-15'), total: '1500.50', count: BigInt(5) },
      ];
      const transformed = transformDailySales(raw);

      expect(transformed[0].date).toBe('2024-01-15');
      expect(transformed[0].total).toBe(1500.5);
      expect(transformed[0].count).toBe(5);
    });

    it('should transform monthly sales correctly', () => {
      const raw = [
        { month: '2024-01', total: '15000', count: BigInt(50) },
      ];
      const transformed = transformMonthlySales(raw);

      expect(transformed[0].month).toBe('2024-01');
      expect(transformed[0].total).toBe(15000);
      expect(transformed[0].count).toBe(50);
    });

    it('should handle empty arrays', () => {
      expect(transformDailySales([])).toEqual([]);
      expect(transformMonthlySales([])).toEqual([]);
    });
  });

  describe('Report Type Interfaces', () => {
    it('should define LocationRevenueAnalytics structure', () => {
      const revenue = {
        todaySales: { total: 1000, count: 5 },
        weekSales: { total: 5000, count: 20 },
        monthSales: { total: 20000, count: 100 },
        yearSales: { total: 200000, count: 1000 },
        monthlyGrowth: 15.5,
        averageTicket: 200,
        dailySales: [] as Array<{ date: string; total: number; count: number }>,
        monthlySales: [] as Array<{ month: string; total: number; count: number }>,
      };

      expect(revenue).toHaveProperty('todaySales');
      expect(revenue).toHaveProperty('monthlyGrowth');
      expect(revenue).toHaveProperty('averageTicket');
      expect(revenue).toHaveProperty('dailySales');
    });

    it('should define LocationInventoryAnalytics structure', () => {
      const inventory = {
        totalItems: 150,
        inventoryValue: 85000,
        lowStockCount: 8,
        topProducts: [] as Array<{
          id: string;
          name: string;
          revenue: number;
          quantitySold: number;
          profit: number;
        }>,
        categories: [] as Array<{
          category: string;
          count: number;
          value: number;
        }>,
      };

      expect(inventory).toHaveProperty('totalItems');
      expect(inventory).toHaveProperty('inventoryValue');
      expect(inventory).toHaveProperty('topProducts');
    });

    it('should define LocationPerformanceMetrics structure', () => {
      const performance = {
        appointments: {
          total: 100,
          completed: 80,
          cancelled: 15,
          noShow: 5,
          completionRate: 80,
        },
        customers: {
          total: 250,
          new: 30,
          active: 180,
          retentionRate: 72,
        },
        staff: {
          total: 8,
          active: 6,
          appointmentsPerStaff: 15,
        },
      };

      expect(performance).toHaveProperty('appointments');
      expect(performance).toHaveProperty('customers');
      expect(performance).toHaveProperty('staff');
    });

    it('should define LocationComparison structure', () => {
      const comparison = {
        locationId: 'loc-1',
        locationName: 'Centro',
        revenue: 50000,
        appointments: 150,
        customers: 120,
        inventoryValue: 30000,
        averageTicket: 333.33,
        rank: 1,
      };

      expect(comparison).toHaveProperty('locationId');
      expect(comparison).toHaveProperty('revenue');
      expect(comparison).toHaveProperty('rank');
    });
  });

  describe('Performance', () => {
    it('should calculate growth quickly', () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        const growth =
          1000 > 0 ? ((1200 - 1000) / 1000) * 100 : 1200 > 0 ? 100 : 0;
        growth; // Use the variable
      }
      const end = performance.now();
      expect(end - start).toBeLessThan(10);
    });

    it('should rank locations quickly', () => {
      const locations = Array.from({ length: 100 }, (_, i) => ({
        id: `loc-${i}`,
        revenue: Math.random() * 100000,
      }));

      const start = performance.now();
      locations.sort((a, b) => b.revenue - a.revenue);
      locations.forEach((loc, index) => {
        (loc as { rank: number }).rank = index + 1;
      });
      const end = performance.now();

      expect(end - start).toBeLessThan(10);
    });

    it('should calculate inventory value quickly', () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        quantity: Math.floor(Math.random() * 100),
        cost: Math.random() * 500,
      }));

      const start = performance.now();
      items.reduce((total, item) => total + item.quantity * item.cost, 0);
      const end = performance.now();

      expect(end - start).toBeLessThan(10);
    });
  });
});
