/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Integration tests for the /api/reports endpoint
 * Tests data aggregation, filtering, and access control
 */

import { prismaMock } from '../../mocks/prisma';
import {
  createTestTenant,
  createTestUser,
  createTestLocation,
  createTestCustomer,
  createTestSale,
  createTestSaleItem,
  createTestService,
  createTestInventoryItem,
} from '../../utils/test-utils';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

// Mock the reports module
jest.mock('@/lib/reports', () => ({
  getFullReportsData: jest.fn(),
  getRevenueAnalytics: jest.fn(),
  getCustomerAnalytics: jest.fn(),
  getServiceAnalytics: jest.fn(),
  getInventoryAnalytics: jest.fn(),
}));

import { requireAuth } from '@/lib/auth';
import { getFullReportsData } from '@/lib/reports';
import { GET } from '@/app/api/reports/route';
import { NextRequest } from 'next/server';

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockGetFullReportsData = getFullReportsData as jest.MockedFunction<typeof getFullReportsData>;

describe('Reports API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockLocation: ReturnType<typeof createTestLocation>;

  const mockReportsData = {
    revenue: {
      todaySales: { total: 1500, count: 5 },
      weekSales: { total: 7500, count: 25 },
      monthSales: { total: 30000, count: 100 },
      yearSales: { total: 360000, count: 1200 },
      monthlyGrowth: 12.5,
      averageTicket: 300,
      dailySales: [
        { date: '2025-12-20', total: 3380.5, count: 4 },
        { date: '2025-12-31', total: 1616.36, count: 2 },
      ],
      monthlySales: [
        { month: '2025-11', total: 28000, count: 90 },
        { month: '2025-12', total: 30000, count: 100 },
      ],
    },
    customers: {
      totalCustomers: 150,
      newCustomersThisMonth: 12,
      newCustomersLastMonth: 10,
      customerGrowth: 20,
      activeCustomers: 120,
      topCustomers: [
        {
          id: 'cust-1',
          name: 'Juan Pérez',
          totalSpent: 8188.2,
          visitCount: 4,
          lastVisit: new Date('2025-10-23'),
        },
      ],
      customerRetention: 80,
    },
    services: {
      topServices: [
        {
          id: 'serv-1',
          name: 'Consulta General',
          revenue: 15000,
          count: 50,
          averagePrice: 300,
        },
      ],
      serviceCategories: [
        { category: 'CONSULTATION', revenue: 15000, count: 50 },
      ],
    },
    inventory: {
      topProducts: [
        {
          id: 'prod-1',
          name: 'Vitaminas para Perro',
          revenue: 5000,
          quantitySold: 100,
          profit: 2000,
        },
      ],
      lowStockItems: [
        {
          id: 'low-1',
          name: 'Antibióticos',
          currentStock: 5,
          minStock: 10,
        },
      ],
      inventoryValue: 150000,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockTenant = createTestTenant({ plan: 'pro' as const });
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockLocation = createTestLocation({ tenantId: mockTenant.id });
  });

  describe('GET /api/reports', () => {
    const createRequest = (params: Record<string, string> = {}) => {
      const url = new URL('http://localhost:3000/api/reports');
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      return new NextRequest(url);
    };

    describe('Authentication', () => {
      it('should return 400 when authentication fails', async () => {
        mockRequireAuth.mockRejectedValue(new Error('Not authenticated'));

        const request = createRequest();
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.message).toBe('Not authenticated');
      });

      it('should require valid tenant to access reports', async () => {
        mockRequireAuth.mockRejectedValue(new Error('Tenant not found'));

        const request = createRequest();
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.message).toBe('Tenant not found');
      });
    });

    describe('Full Report Data', () => {
      beforeEach(() => {
        mockRequireAuth.mockResolvedValue({
          user: mockUser,
          tenant: mockTenant,
        });
        mockGetFullReportsData.mockResolvedValue(mockReportsData);
      });

      it('should return all reports when type is not specified', async () => {
        const request = createRequest();
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(mockGetFullReportsData).toHaveBeenCalledWith(mockTenant.id);
        // Check structure instead of exact equality since dates get serialized
        expect(data.revenue).toBeDefined();
        expect(data.customers).toBeDefined();
        expect(data.services).toBeDefined();
        expect(data.inventory).toBeDefined();
      });

      it('should return all reports when type is "all"', async () => {
        const request = createRequest({ type: 'all' });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.revenue).toBeDefined();
        expect(data.customers).toBeDefined();
        expect(data.services).toBeDefined();
        expect(data.inventory).toBeDefined();
      });

      it('should include revenue analytics in full report', async () => {
        const request = createRequest();
        const response = await GET(request);
        const data = await response.json();

        expect(data.revenue).toBeDefined();
        expect(data.revenue.todaySales).toBeDefined();
        expect(data.revenue.weekSales).toBeDefined();
        expect(data.revenue.monthSales).toBeDefined();
        expect(data.revenue.yearSales).toBeDefined();
        expect(data.revenue.monthlyGrowth).toBeDefined();
        expect(data.revenue.averageTicket).toBeDefined();
        expect(data.revenue.dailySales).toBeDefined();
        expect(data.revenue.monthlySales).toBeDefined();
      });

      it('should include customer analytics in full report', async () => {
        const request = createRequest();
        const response = await GET(request);
        const data = await response.json();

        expect(data.customers).toBeDefined();
        expect(data.customers.totalCustomers).toBeDefined();
        expect(data.customers.newCustomersThisMonth).toBeDefined();
        expect(data.customers.customerGrowth).toBeDefined();
        expect(data.customers.activeCustomers).toBeDefined();
        expect(data.customers.topCustomers).toBeDefined();
        expect(data.customers.customerRetention).toBeDefined();
      });

      it('should include service analytics in full report', async () => {
        const request = createRequest();
        const response = await GET(request);
        const data = await response.json();

        expect(data.services).toBeDefined();
        expect(data.services.topServices).toBeDefined();
        expect(data.services.serviceCategories).toBeDefined();
      });

      it('should include inventory analytics in full report', async () => {
        const request = createRequest();
        const response = await GET(request);
        const data = await response.json();

        expect(data.inventory).toBeDefined();
        expect(data.inventory.topProducts).toBeDefined();
        expect(data.inventory.lowStockItems).toBeDefined();
        expect(data.inventory.inventoryValue).toBeDefined();
      });
    });

    describe('Filtered Reports by Type', () => {
      beforeEach(() => {
        mockRequireAuth.mockResolvedValue({
          user: mockUser,
          tenant: mockTenant,
        });
        mockGetFullReportsData.mockResolvedValue(mockReportsData);
      });

      it('should return only revenue data when type is "revenue"', async () => {
        const request = createRequest({ type: 'revenue' });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.revenue).toBeDefined();
        expect(data.customers).toBeUndefined();
        expect(data.services).toBeUndefined();
        expect(data.inventory).toBeUndefined();
      });

      it('should return only customers data when type is "customers"', async () => {
        const request = createRequest({ type: 'customers' });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.customers).toBeDefined();
        expect(data.revenue).toBeUndefined();
        expect(data.services).toBeUndefined();
        expect(data.inventory).toBeUndefined();
      });

      it('should return only services data when type is "services"', async () => {
        const request = createRequest({ type: 'services' });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.services).toBeDefined();
        expect(data.revenue).toBeUndefined();
        expect(data.customers).toBeUndefined();
        expect(data.inventory).toBeUndefined();
      });

      it('should return only inventory data when type is "inventory"', async () => {
        const request = createRequest({ type: 'inventory' });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.inventory).toBeDefined();
        expect(data.revenue).toBeUndefined();
        expect(data.customers).toBeUndefined();
        expect(data.services).toBeUndefined();
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockRequireAuth.mockResolvedValue({
          user: mockUser,
          tenant: mockTenant,
        });
      });

      it('should return 400 with error message on known errors', async () => {
        mockGetFullReportsData.mockRejectedValue(new Error('Database connection failed'));

        const request = createRequest();
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.message).toBe('Database connection failed');
      });

      it('should return 500 for internal server errors', async () => {
        // Simulate an unknown error type
        mockGetFullReportsData.mockRejectedValue({ code: 'UNKNOWN_ERROR' });

        const request = createRequest();
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.message).toBe('Error interno del servidor');
      });
    });

    describe('Tenant Isolation', () => {
      it('should pass correct tenant ID to reports function', async () => {
        const differentTenant = createTestTenant({ id: 'tenant-other', name: 'Other Clinic' });
        mockRequireAuth.mockResolvedValue({
          user: createTestUser({ tenantId: differentTenant.id }),
          tenant: differentTenant,
        });
        mockGetFullReportsData.mockResolvedValue(mockReportsData);

        const request = createRequest();
        await GET(request);

        expect(mockGetFullReportsData).toHaveBeenCalledWith('tenant-other');
      });

      it('should not allow cross-tenant data access', async () => {
        // First tenant
        mockRequireAuth.mockResolvedValue({
          user: mockUser,
          tenant: mockTenant,
        });
        mockGetFullReportsData.mockResolvedValue(mockReportsData);

        const request1 = createRequest();
        await GET(request1);

        expect(mockGetFullReportsData).toHaveBeenCalledWith(mockTenant.id);
        expect(mockGetFullReportsData).not.toHaveBeenCalledWith('other-tenant-id');
      });
    });

    describe('Data Integrity', () => {
      beforeEach(() => {
        mockRequireAuth.mockResolvedValue({
          user: mockUser,
          tenant: mockTenant,
        });
      });

      it('should return consistent data structure', async () => {
        mockGetFullReportsData.mockResolvedValue(mockReportsData);

        const request = createRequest();
        const response = await GET(request);
        const data = await response.json();

        // Verify revenue structure
        expect(typeof data.revenue.todaySales.total).toBe('number');
        expect(typeof data.revenue.todaySales.count).toBe('number');
        expect(typeof data.revenue.monthlyGrowth).toBe('number');
        expect(Array.isArray(data.revenue.dailySales)).toBe(true);

        // Verify customer structure
        expect(typeof data.customers.totalCustomers).toBe('number');
        expect(typeof data.customers.customerGrowth).toBe('number');
        expect(Array.isArray(data.customers.topCustomers)).toBe(true);

        // Verify services structure
        expect(Array.isArray(data.services.topServices)).toBe(true);
        expect(Array.isArray(data.services.serviceCategories)).toBe(true);

        // Verify inventory structure
        expect(Array.isArray(data.inventory.topProducts)).toBe(true);
        expect(Array.isArray(data.inventory.lowStockItems)).toBe(true);
        expect(typeof data.inventory.inventoryValue).toBe('number');
      });

      it('should handle empty data gracefully', async () => {
        const emptyReportsData = {
          revenue: {
            todaySales: { total: 0, count: 0 },
            weekSales: { total: 0, count: 0 },
            monthSales: { total: 0, count: 0 },
            yearSales: { total: 0, count: 0 },
            monthlyGrowth: 0,
            averageTicket: 0,
            dailySales: [],
            monthlySales: [],
          },
          customers: {
            totalCustomers: 0,
            newCustomersThisMonth: 0,
            newCustomersLastMonth: 0,
            customerGrowth: 0,
            activeCustomers: 0,
            topCustomers: [],
            customerRetention: 0,
          },
          services: {
            topServices: [],
            serviceCategories: [],
          },
          inventory: {
            topProducts: [],
            lowStockItems: [],
            inventoryValue: 0,
          },
        };

        mockGetFullReportsData.mockResolvedValue(emptyReportsData);

        const request = createRequest();
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.revenue.dailySales).toEqual([]);
        expect(data.customers.topCustomers).toEqual([]);
        expect(data.services.topServices).toEqual([]);
        expect(data.inventory.topProducts).toEqual([]);
      });
    });
  });
});
