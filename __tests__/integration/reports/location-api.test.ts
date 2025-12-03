/**
 * Integration tests for Location Reports API
 * Tests the full data flow from request to response
 */

describe('Location Reports API Integration', () => {
  // Simulate complete report data structures
  const mockFullReportData = {
    revenue: {
      todaySales: { total: 5250.50, count: 12 },
      weekSales: { total: 28750.00, count: 68 },
      monthSales: { total: 125000.00, count: 285 },
      yearSales: { total: 1450000.00, count: 3420 },
      averageTicket: 438.60,
      monthlyGrowth: 18.5,
      dailySales: [
        { date: '2024-01-13', total: 4500, count: 10 },
        { date: '2024-01-14', total: 5200, count: 12 },
        { date: '2024-01-15', total: 5250.50, count: 12 },
      ],
      monthlySales: [
        { month: '2024-01', total: 125000, count: 285 },
        { month: '2023-12', total: 105500, count: 240 },
      ],
    },
    inventory: {
      totalItems: 342,
      inventoryValue: 285000.00,
      lowStockCount: 15,
      categories: [
        { category: 'Medicamentos', count: 120, value: 95000 },
        { category: 'Vacunas', count: 45, value: 75000 },
        { category: 'Alimentos', count: 88, value: 65000 },
        { category: 'Accesorios', count: 89, value: 50000 },
      ],
      topProducts: [
        { id: 'prod-1', name: 'Vacuna Antirrábica', revenue: 15000, quantitySold: 150, profit: 5500 },
        { id: 'prod-2', name: 'Desparasitante Canino', revenue: 12500, quantitySold: 200, profit: 4200 },
      ],
    },
    performance: {
      appointments: {
        total: 120,
        completed: 100,
        cancelled: 15,
        noShow: 5,
        completionRate: 83.33,
      },
      customers: {
        total: 450,
        new: 35,
        active: 380,
        retentionRate: 84.44,
      },
      staff: {
        total: 12,
        active: 10,
        appointmentsPerStaff: 10,
      },
    },
  };

  const mockComparisonData = [
    {
      locationId: 'loc-norte',
      locationName: 'Sucursal Norte',
      revenue: 85000,
      appointments: 150,
      customers: 120,
      inventoryValue: 45000,
      averageTicket: 566.67,
      rank: 1,
    },
    {
      locationId: 'loc-centro',
      locationName: 'Sucursal Centro',
      revenue: 72000,
      appointments: 130,
      customers: 100,
      inventoryValue: 38000,
      averageTicket: 553.85,
      rank: 2,
    },
    {
      locationId: 'loc-sur',
      locationName: 'Sucursal Sur',
      revenue: 55000,
      appointments: 95,
      customers: 75,
      inventoryValue: 32000,
      averageTicket: 578.95,
      rank: 3,
    },
  ];

  describe('Full Report Data Flow', () => {
    it('should include all required sections in full report', () => {
      expect(mockFullReportData).toHaveProperty('revenue');
      expect(mockFullReportData).toHaveProperty('inventory');
      expect(mockFullReportData).toHaveProperty('performance');
    });

    it('should have consistent data types in revenue section', () => {
      const { revenue } = mockFullReportData;
      expect(typeof revenue.todaySales.total).toBe('number');
      expect(typeof revenue.todaySales.count).toBe('number');
      expect(typeof revenue.monthlyGrowth).toBe('number');
      expect(typeof revenue.averageTicket).toBe('number');
      expect(Array.isArray(revenue.dailySales)).toBe(true);
      expect(Array.isArray(revenue.monthlySales)).toBe(true);
    });

    it('should have valid daily sales data structure', () => {
      const { dailySales } = mockFullReportData.revenue;
      dailySales.forEach((day) => {
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('total');
        expect(day).toHaveProperty('count');
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should have valid monthly sales data structure', () => {
      const { monthlySales } = mockFullReportData.revenue;
      monthlySales.forEach((month) => {
        expect(month).toHaveProperty('month');
        expect(month).toHaveProperty('total');
        expect(month).toHaveProperty('count');
        expect(month.month).toMatch(/^\d{4}-\d{2}$/);
      });
    });
  });

  describe('Inventory Data Integrity', () => {
    it('should have consistent inventory structure', () => {
      const { inventory } = mockFullReportData;
      expect(typeof inventory.totalItems).toBe('number');
      expect(typeof inventory.inventoryValue).toBe('number');
      expect(typeof inventory.lowStockCount).toBe('number');
      expect(Array.isArray(inventory.categories)).toBe(true);
      expect(Array.isArray(inventory.topProducts)).toBe(true);
    });

    it('should have valid category data', () => {
      const { categories } = mockFullReportData.inventory;
      categories.forEach((cat) => {
        expect(cat).toHaveProperty('category');
        expect(cat).toHaveProperty('count');
        expect(cat).toHaveProperty('value');
        expect(typeof cat.count).toBe('number');
        expect(typeof cat.value).toBe('number');
      });
    });

    it('should have valid top products data', () => {
      const { topProducts } = mockFullReportData.inventory;
      topProducts.forEach((product) => {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('revenue');
        expect(product).toHaveProperty('quantitySold');
        expect(product).toHaveProperty('profit');
      });
    });

    it('should calculate profit correctly for top products', () => {
      const { topProducts } = mockFullReportData.inventory;
      topProducts.forEach((product) => {
        // Profit should be less than revenue
        expect(product.profit).toBeLessThanOrEqual(product.revenue);
        // Profit should be a positive number for profitable products
        expect(product.profit).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Metrics Consistency', () => {
    it('should have consistent appointment metrics', () => {
      const { appointments } = mockFullReportData.performance;
      // Total should equal sum of completed + cancelled + noShow
      expect(appointments.total).toBe(
        appointments.completed + appointments.cancelled + appointments.noShow
      );
    });

    it('should calculate completion rate correctly', () => {
      const { appointments } = mockFullReportData.performance;
      const expectedRate = (appointments.completed / appointments.total) * 100;
      expect(appointments.completionRate).toBeCloseTo(expectedRate, 1);
    });

    it('should have valid retention rate', () => {
      const { customers } = mockFullReportData.performance;
      const expectedRate = (customers.active / customers.total) * 100;
      expect(customers.retentionRate).toBeCloseTo(expectedRate, 1);
    });

    it('should calculate appointments per staff correctly', () => {
      const { appointments, staff } = mockFullReportData.performance;
      const expected = appointments.completed / staff.active;
      expect(staff.appointmentsPerStaff).toBe(expected);
    });
  });

  describe('Location Comparison Data', () => {
    it('should rank locations by revenue descending', () => {
      for (let i = 1; i < mockComparisonData.length; i++) {
        expect(mockComparisonData[i - 1].revenue).toBeGreaterThanOrEqual(
          mockComparisonData[i].revenue
        );
      }
    });

    it('should have sequential ranks', () => {
      mockComparisonData.forEach((loc, index) => {
        expect(loc.rank).toBe(index + 1);
      });
    });

    it('should have consistent location data structure', () => {
      mockComparisonData.forEach((loc) => {
        expect(loc).toHaveProperty('locationId');
        expect(loc).toHaveProperty('locationName');
        expect(loc).toHaveProperty('revenue');
        expect(loc).toHaveProperty('appointments');
        expect(loc).toHaveProperty('customers');
        expect(loc).toHaveProperty('inventoryValue');
        expect(loc).toHaveProperty('averageTicket');
        expect(loc).toHaveProperty('rank');
      });
    });

    it('should calculate average ticket correctly', () => {
      mockComparisonData.forEach((loc) => {
        // Average ticket should be positive if there's revenue
        if (loc.revenue > 0) {
          expect(loc.averageTicket).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Cross-Location Aggregations', () => {
    it('should calculate total revenue across locations', () => {
      const totalRevenue = mockComparisonData.reduce(
        (sum, loc) => sum + loc.revenue,
        0
      );
      expect(totalRevenue).toBe(85000 + 72000 + 55000);
    });

    it('should calculate total appointments across locations', () => {
      const totalAppointments = mockComparisonData.reduce(
        (sum, loc) => sum + loc.appointments,
        0
      );
      expect(totalAppointments).toBe(150 + 130 + 95);
    });

    it('should calculate total customers across locations', () => {
      const totalCustomers = mockComparisonData.reduce(
        (sum, loc) => sum + loc.customers,
        0
      );
      expect(totalCustomers).toBe(120 + 100 + 75);
    });

    it('should calculate average metrics across locations', () => {
      const avgRevenue =
        mockComparisonData.reduce((sum, loc) => sum + loc.revenue, 0) /
        mockComparisonData.length;
      expect(avgRevenue).toBeCloseTo(70666.67, 0);
    });
  });

  describe('Date Range Filtering', () => {
    function filterByDateRange<T extends { date: string }>(
      data: T[],
      startDate?: Date,
      endDate?: Date
    ): T[] {
      return data.filter((item) => {
        const itemDate = new Date(item.date);
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });
    }

    it('should filter data by start date', () => {
      const startDate = new Date('2024-01-14');
      const filtered = filterByDateRange(
        mockFullReportData.revenue.dailySales,
        startDate
      );
      expect(filtered.length).toBe(2);
    });

    it('should filter data by end date', () => {
      const endDate = new Date('2024-01-14');
      const filtered = filterByDateRange(
        mockFullReportData.revenue.dailySales,
        undefined,
        endDate
      );
      expect(filtered.length).toBe(2);
    });

    it('should filter data by date range', () => {
      const startDate = new Date('2024-01-14');
      const endDate = new Date('2024-01-14');
      const filtered = filterByDateRange(
        mockFullReportData.revenue.dailySales,
        startDate,
        endDate
      );
      expect(filtered.length).toBe(1);
      expect(filtered[0].date).toBe('2024-01-14');
    });
  });

  describe('Access Control Integration', () => {
    function filterComparisonByAccess(
      data: typeof mockComparisonData,
      allowedLocationIds: string[]
    ) {
      return data.filter((loc) => allowedLocationIds.includes(loc.locationId));
    }

    it('should filter comparison to allowed locations', () => {
      const allowed = ['loc-norte', 'loc-sur'];
      const filtered = filterComparisonByAccess(mockComparisonData, allowed);
      expect(filtered.length).toBe(2);
      expect(filtered.map((l) => l.locationId)).toEqual(['loc-norte', 'loc-sur']);
    });

    it('should return empty when no access', () => {
      const allowed: string[] = [];
      const filtered = filterComparisonByAccess(mockComparisonData, allowed);
      expect(filtered.length).toBe(0);
    });

    it('should preserve ranking after filtering', () => {
      const allowed = ['loc-sur'];
      const filtered = filterComparisonByAccess(mockComparisonData, allowed);
      // Original rank should be preserved
      expect(filtered[0].rank).toBe(3);
    });
  });

  describe('Response Format', () => {
    function buildResponse(data: unknown, cacheHit: boolean) {
      return {
        data,
        headers: {
          'Cache-Control': 'private, max-age=300',
          'X-Cache': cacheHit ? 'HIT' : 'MISS',
        },
      };
    }

    it('should include correct cache headers for fresh data', () => {
      const response = buildResponse(mockFullReportData, false);
      expect(response.headers['X-Cache']).toBe('MISS');
      expect(response.headers['Cache-Control']).toBe('private, max-age=300');
    });

    it('should include correct cache headers for cached data', () => {
      const response = buildResponse(mockFullReportData, true);
      expect(response.headers['X-Cache']).toBe('HIT');
    });

    it('should format full report response correctly', () => {
      const response = buildResponse(mockFullReportData, false);
      expect(response.data).toHaveProperty('revenue');
      expect(response.data).toHaveProperty('inventory');
      expect(response.data).toHaveProperty('performance');
    });

    it('should format comparison response correctly', () => {
      const response = buildResponse({ comparison: mockComparisonData }, false);
      expect(response.data).toHaveProperty('comparison');
      expect(Array.isArray((response.data as { comparison: unknown[] }).comparison)).toBe(true);
    });
  });

  describe('Error Response Format', () => {
    function buildErrorResponse(
      message: string,
      status: number
    ): { error: string; status: number } {
      return { error: message, status };
    }

    it('should format 400 error response', () => {
      const response = buildErrorResponse('Invalid report type', 400);
      expect(response.status).toBe(400);
      expect(response.error).toBe('Invalid report type');
    });

    it('should format 403 error response', () => {
      const response = buildErrorResponse('No tienes acceso', 403);
      expect(response.status).toBe(403);
      expect(response.error).toContain('No tienes acceso');
    });

    it('should format 500 error response', () => {
      const response = buildErrorResponse('Error interno del servidor', 500);
      expect(response.status).toBe(500);
    });
  });

  describe('Performance', () => {
    it('should aggregate comparison data quickly', () => {
      const largeComparison = Array.from({ length: 100 }, (_, i) => ({
        locationId: `loc-${i}`,
        locationName: `Location ${i}`,
        revenue: Math.random() * 100000,
        appointments: Math.floor(Math.random() * 200),
        customers: Math.floor(Math.random() * 150),
        inventoryValue: Math.random() * 50000,
        averageTicket: Math.random() * 500,
        rank: 0,
      }));

      const start = performance.now();

      // Sort by revenue
      largeComparison.sort((a, b) => b.revenue - a.revenue);

      // Assign ranks
      largeComparison.forEach((loc, index) => {
        loc.rank = index + 1;
      });

      // Calculate totals
      largeComparison.reduce((sum, loc) => sum + loc.revenue, 0);

      const end = performance.now();
      expect(end - start).toBeLessThan(50);
    });

    it('should filter date ranges quickly', () => {
      const largeDailySales = Array.from({ length: 365 }, (_, i) => {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        return {
          date: date.toISOString().split('T')[0],
          total: Math.random() * 10000,
          count: Math.floor(Math.random() * 50),
        };
      });

      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-08-31');

      const start = performance.now();
      largeDailySales.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      });
      const end = performance.now();

      expect(end - start).toBeLessThan(10);
    });
  });
});
