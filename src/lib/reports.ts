import { prisma } from './prisma';
import { startOfMonth, startOfWeek, startOfDay, endOfDay, subDays, subMonths, format } from 'date-fns';

export interface RevenueAnalytics {
  todaySales: { total: number; count: number };
  weekSales: { total: number; count: number };
  monthSales: { total: number; count: number };
  yearSales: { total: number; count: number };
  monthlyGrowth: number;
  averageTicket: number;
  dailySales: Array<{ date: string; total: number; count: number }>;
  monthlySales: Array<{ month: string; total: number; count: number }>;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  newCustomersLastMonth: number;
  customerGrowth: number;
  activeCustomers: number;
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    visitCount: number;
    lastVisit: Date;
  }>;
  customerRetention: number;
}

export interface ServiceAnalytics {
  topServices: Array<{
    id: string;
    name: string;
    revenue: number;
    count: number;
    averagePrice: number;
  }>;
  serviceCategories: Array<{
    category: string;
    revenue: number;
    count: number;
  }>;
}

export interface InventoryAnalytics {
  topProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    quantitySold: number;
    profit: number;
  }>;
  lowStockItems: Array<{
    id: string;
    name: string;
    currentStock: number;
    minStock: number;
  }>;
  inventoryValue: number;
}

export async function getRevenueAnalytics(tenantId: string): Promise<RevenueAnalytics> {
  const today = new Date();
  const startOfThisMonth = startOfMonth(today);
  const startOfLastMonth = startOfMonth(subMonths(today, 1));
  const startOfThisYear = new Date(today.getFullYear(), 0, 1);
  
  // Basic aggregations
  const [todaySales, weekSales, monthSales, yearSales, lastMonthSales] = await Promise.all([
    // Today's sales
    prisma.sale.aggregate({
      where: {
        tenantId,
        status: { in: ['COMPLETED', 'PAID'] },
        createdAt: { 
          gte: startOfDay(today),
          lte: endOfDay(today)
        }
      },
      _sum: { total: true },
      _count: { id: true }
    }),

    // This week's sales
    prisma.sale.aggregate({
      where: {
        tenantId,
        status: { in: ['COMPLETED', 'PAID'] },
        createdAt: { gte: startOfWeek(today) }
      },
      _sum: { total: true },
      _count: { id: true }
    }),

    // This month's sales
    prisma.sale.aggregate({
      where: {
        tenantId,
        status: { in: ['COMPLETED', 'PAID'] },
        createdAt: { gte: startOfThisMonth }
      },
      _sum: { total: true },
      _count: { id: true }
    }),

    // This year's sales
    prisma.sale.aggregate({
      where: {
        tenantId,
        status: { in: ['COMPLETED', 'PAID'] },
        createdAt: { gte: startOfThisYear }
      },
      _sum: { total: true },
      _count: { id: true }
    }),

    // Last month's sales for growth calculation
    prisma.sale.aggregate({
      where: {
        tenantId,
        status: { in: ['COMPLETED', 'PAID'] },
        createdAt: { 
          gte: startOfLastMonth,
          lt: startOfThisMonth
        }
      },
      _sum: { total: true },
      _count: { id: true }
    })
  ]);

  // Daily sales for the last 30 days
  const last30Days = subDays(today, 30);
  const dailySalesData = await prisma.sale.groupBy({
    by: ['createdAt'],
    where: {
      tenantId,
      status: { in: ['COMPLETED', 'PAID'] },
      createdAt: { gte: last30Days }
    },
    _sum: { total: true },
    _count: { id: true }
  });

  // Monthly sales for the last 12 months
  const last12Months = subMonths(today, 12);
  const monthlySalesData = await prisma.sale.groupBy({
    by: ['createdAt'],
    where: {
      tenantId,
      status: { in: ['COMPLETED', 'PAID'] },
      createdAt: { gte: last12Months }
    },
    _sum: { total: true },
    _count: { id: true }
  });

  // Process daily sales
  const dailySales = processDailySales(dailySalesData);
  const monthlySales = processMonthlySales(monthlySalesData);

  // Calculate metrics
  const thisMonthTotal = Number(monthSales._sum.total || 0);
  const lastMonthTotal = Number(lastMonthSales._sum.total || 0);
  const monthlyGrowth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
  const averageTicket = monthSales._count.id > 0 ? thisMonthTotal / monthSales._count.id : 0;

  return {
    todaySales: {
      total: Number(todaySales._sum.total || 0),
      count: todaySales._count.id
    },
    weekSales: {
      total: Number(weekSales._sum.total || 0),
      count: weekSales._count.id
    },
    monthSales: {
      total: thisMonthTotal,
      count: monthSales._count.id
    },
    yearSales: {
      total: Number(yearSales._sum.total || 0),
      count: yearSales._count.id
    },
    monthlyGrowth,
    averageTicket,
    dailySales,
    monthlySales
  };
}

export async function getCustomerAnalytics(tenantId: string): Promise<CustomerAnalytics> {
  const today = new Date();
  const startOfThisMonth = startOfMonth(today);
  const startOfLastMonth = startOfMonth(subMonths(today, 1));

  const [totalCustomers, newCustomersThisMonth, newCustomersLastMonth, topCustomersData] = await Promise.all([
    // Total customers
    prisma.customer.count({
      where: { tenantId, isActive: true }
    }),

    // New customers this month
    prisma.customer.count({
      where: {
        tenantId,
        isActive: true,
        createdAt: { gte: startOfThisMonth }
      }
    }),

    // New customers last month
    prisma.customer.count({
      where: {
        tenantId,
        isActive: true,
        createdAt: {
          gte: startOfLastMonth,
          lt: startOfThisMonth
        }
      }
    }),

    // Top customers by revenue
    prisma.customer.findMany({
      where: { tenantId, isActive: true },
      include: {
        sales: {
          where: {
            status: { in: ['COMPLETED', 'PAID'] }
          },
          select: {
            total: true,
            createdAt: true
          }
        }
      },
      take: 100 // Get more to calculate properly
    })
  ]);

  // Process top customers
  const topCustomers = topCustomersData
    .map(customer => {
      const totalSpent = customer.sales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const lastVisit = customer.sales.length > 0 
        ? new Date(Math.max(...customer.sales.map(s => s.createdAt.getTime())))
        : customer.createdAt;
      
      return {
        id: customer.id,
        name: customer.name,
        totalSpent,
        visitCount: customer.sales.length,
        lastVisit
      };
    })
    .filter(customer => customer.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // Calculate metrics
  const customerGrowth = newCustomersLastMonth > 0 
    ? ((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100 
    : 0;

  const activeCustomers = topCustomersData.filter(c => 
    c.sales.some(s => s.createdAt >= subMonths(today, 3))
  ).length;

  const customerRetention = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;

  return {
    totalCustomers,
    newCustomersThisMonth,
    newCustomersLastMonth,
    customerGrowth,
    activeCustomers,
    topCustomers,
    customerRetention
  };
}

export async function getServiceAnalytics(tenantId: string): Promise<ServiceAnalytics> {
  const startOfThisMonth = startOfMonth(new Date());

  const [serviceData, categoryData] = await Promise.all([
    // Top services
    prisma.saleItem.groupBy({
      by: ['serviceId'],
      where: {
        serviceId: { not: null },
        sale: {
          tenantId,
          status: { in: ['COMPLETED', 'PAID'] },
          createdAt: { gte: startOfThisMonth }
        }
      },
      _sum: { total: true, quantity: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10
    }),

    // Service categories
    prisma.service.groupBy({
      by: ['category'],
      where: { tenantId },
      _count: { id: true }
    })
  ]);

  // Get service details
  const serviceIds = serviceData.map(s => s.serviceId).filter(Boolean) as string[];
  const services = serviceIds.length > 0 ? await prisma.service.findMany({
    where: { id: { in: serviceIds } }
  }) : [];

  const topServices = serviceData.map(item => {
    const service = services.find(s => s.id === item.serviceId);
    const revenue = Number(item._sum.total || 0);
    const count = item._count.id;
    const averagePrice = count > 0 ? revenue / count : 0;

    return {
      id: item.serviceId || '',
      name: service?.name || 'Servicio desconocido',
      revenue,
      count,
      averagePrice
    };
  });

  // Get category sales data
  const categorySales = await Promise.all(
    categoryData.map(async (cat) => {
      const sales = await prisma.saleItem.aggregate({
        where: {
          service: { category: cat.category },
          sale: {
            tenantId,
            status: { in: ['COMPLETED', 'PAID'] },
            createdAt: { gte: startOfThisMonth }
          }
        },
        _sum: { total: true },
        _count: { id: true }
      });

      return {
        category: cat.category,
        revenue: Number(sales._sum.total || 0),
        count: sales._count.id
      };
    })
  );

  return {
    topServices,
    serviceCategories: categorySales.sort((a, b) => b.revenue - a.revenue)
  };
}

export async function getInventoryAnalytics(tenantId: string): Promise<InventoryAnalytics> {
  const startOfThisMonth = startOfMonth(new Date());

  const [productData, lowStockData] = await Promise.all([
    // Top selling products
    prisma.saleItem.groupBy({
      by: ['itemId'],
      where: {
        itemId: { not: null },
        sale: {
          tenantId,
          status: { in: ['COMPLETED', 'PAID'] },
          createdAt: { gte: startOfThisMonth }
        }
      },
      _sum: { total: true, quantity: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10
    }),

    // Low stock items
    prisma.inventoryItem.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        minStock: { not: null },
        quantity: { lte: prisma.inventoryItem.fields.minStock }
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        minStock: true
      },
      take: 10
    })
  ]);

  // Get product details and calculate profit
  const productIds = productData.map(p => p.itemId).filter(Boolean) as string[];
  const products = productIds.length > 0 ? await prisma.inventoryItem.findMany({
    where: { id: { in: productIds } }
  }) : [];

  const topProducts = productData.map(item => {
    const product = products.find(p => p.id === item.itemId);
    const revenue = Number(item._sum.total || 0);
    const quantitySold = Number(item._sum.quantity || 0);
    const cost = product ? Number(product.cost || 0) : 0;
    const profit = revenue - (cost * quantitySold);

    return {
      id: item.itemId || '',
      name: product?.name || 'Producto desconocido',
      revenue,
      quantitySold,
      profit
    };
  });

  // Calculate total inventory value (quantity * cost)
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { tenantId, status: 'ACTIVE' },
    select: { quantity: true, cost: true }
  });

  const inventoryValue = inventoryItems.reduce((total, item) => {
    return total + (Number(item.quantity) * Number(item.cost || 0));
  }, 0);

  return {
    topProducts,
    lowStockItems: lowStockData.map(item => ({
      id: item.id,
      name: item.name,
      currentStock: Number(item.quantity),
      minStock: Number(item.minStock || 0)
    })),
    inventoryValue
  };
}

// Helper functions
interface SalesGroupByData {
  createdAt: Date;
  _sum: { total: unknown };
  _count: { id: number };
}

function processDailySales(dailySalesData: SalesGroupByData[]): Array<{ date: string; total: number; count: number }> {
  const salesByDay = dailySalesData.reduce((acc, sale) => {
    const date = format(sale.createdAt, 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = { date, total: 0, count: 0 };
    }
    acc[date].total += Number(sale._sum.total || 0);
    acc[date].count += sale._count.id;
    return acc;
  }, {} as Record<string, { date: string; total: number; count: number }>);

  return Object.values(salesByDay).sort((a, b) => a.date.localeCompare(b.date));
}

function processMonthlySales(monthlySalesData: SalesGroupByData[]): Array<{ month: string; total: number; count: number }> {
  const salesByMonth = monthlySalesData.reduce((acc, sale) => {
    const month = format(sale.createdAt, 'yyyy-MM');
    if (!acc[month]) {
      acc[month] = { month, total: 0, count: 0 };
    }
    acc[month].total += Number(sale._sum.total || 0);
    acc[month].count += sale._count.id;
    return acc;
  }, {} as Record<string, { month: string; total: number; count: number }>);

  return Object.values(salesByMonth).sort((a, b) => a.month.localeCompare(b.month));
}

export async function getFullReportsData(tenantId: string) {
  const [revenueAnalytics, customerAnalytics, serviceAnalytics, inventoryAnalytics] = await Promise.all([
    getRevenueAnalytics(tenantId),
    getCustomerAnalytics(tenantId),
    getServiceAnalytics(tenantId),
    getInventoryAnalytics(tenantId)
  ]);

  return {
    revenue: revenueAnalytics,
    customers: customerAnalytics,
    services: serviceAnalytics,
    inventory: inventoryAnalytics
  };
}

// Export functionality
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (typeof window === 'undefined') return;
  
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Safely escape a value for CSV export
 * Handles strings, numbers, dates, null, undefined, and objects
 */
function escapeCSVValue(value: unknown): string {
  // Handle null and undefined
  if (value === null || value === undefined) {
    return '';
  }

  // Handle dates
  if (value instanceof Date) {
    return format(value, 'yyyy-MM-dd HH:mm:ss');
  }

  // Handle objects and arrays (convert to JSON string)
  if (typeof value === 'object') {
    const jsonStr = JSON.stringify(value);
    return `"${jsonStr.replace(/"/g, '""')}"`;
  }

  // Convert to string
  const stringValue = String(value);

  // Escape if contains special characters
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');

  const csvRows = data.map(row =>
    headers.map(header => escapeCSVValue(row[header])).join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
} 