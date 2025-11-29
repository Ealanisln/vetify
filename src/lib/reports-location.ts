import 'server-only';
import { prisma } from './prisma';
import {
  startOfMonth,
  startOfWeek,
  startOfDay,
  endOfDay,
  subDays,
  subMonths,
  format,
} from 'date-fns';
import { getStaffLocationIds } from './locations';

// ============================================================================
// Types
// ============================================================================

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface LocationRevenueAnalytics {
  todaySales: { total: number; count: number };
  weekSales: { total: number; count: number };
  monthSales: { total: number; count: number };
  yearSales: { total: number; count: number };
  monthlyGrowth: number;
  averageTicket: number;
  dailySales: Array<{ date: string; total: number; count: number }>;
  monthlySales: Array<{ month: string; total: number; count: number }>;
}

export interface LocationInventoryAnalytics {
  totalItems: number;
  inventoryValue: number;
  lowStockCount: number;
  topProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    quantitySold: number;
    profit: number;
  }>;
  categories: Array<{
    category: string;
    count: number;
    value: number;
  }>;
}

export interface LocationPerformanceMetrics {
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    completionRate: number;
  };
  customers: {
    total: number;
    new: number;
    active: number;
    retentionRate: number;
  };
  staff: {
    total: number;
    active: number;
    appointmentsPerStaff: number;
  };
}

export interface LocationComparison {
  locationId: string;
  locationName: string;
  revenue: number;
  appointments: number;
  customers: number;
  inventoryValue: number;
  averageTicket: number;
  rank: number;
}

// ============================================================================
// Revenue Analytics by Location
// ============================================================================

export async function getLocationRevenueAnalytics(
  tenantId: string,
  locationId: string | null,
  dateRange?: DateRange // Reserved for future date range filtering
): Promise<LocationRevenueAnalytics> {
  const today = new Date();
  const startOfThisMonth = startOfMonth(today);
  const startOfLastMonth = startOfMonth(subMonths(today, 1));
  const startOfThisYear = new Date(today.getFullYear(), 0, 1);

  // Build base where clause for location filtering
  const baseWhere = locationId
    ? { staff: { locationId } }
    : {};

  const [todaySales, weekSales, monthSales, yearSales, lastMonthSales] =
    await Promise.all([
      // Today's sales
      prisma.sale.aggregate({
        where: {
          tenantId,
          status: { in: ['COMPLETED', 'PAID'] },
          createdAt: {
            gte: startOfDay(today),
            lte: endOfDay(today),
          },
          ...baseWhere,
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      // This week's sales
      prisma.sale.aggregate({
        where: {
          tenantId,
          status: { in: ['COMPLETED', 'PAID'] },
          createdAt: { gte: startOfWeek(today) },
          ...baseWhere,
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      // This month's sales
      prisma.sale.aggregate({
        where: {
          tenantId,
          status: { in: ['COMPLETED', 'PAID'] },
          createdAt: { gte: startOfThisMonth },
          ...baseWhere,
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      // This year's sales
      prisma.sale.aggregate({
        where: {
          tenantId,
          status: { in: ['COMPLETED', 'PAID'] },
          createdAt: { gte: startOfThisYear },
          ...baseWhere,
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      // Last month's sales for growth calculation
      prisma.sale.aggregate({
        where: {
          tenantId,
          status: { in: ['COMPLETED', 'PAID'] },
          createdAt: {
            gte: startOfLastMonth,
            lt: startOfThisMonth,
          },
          ...baseWhere,
        },
        _sum: { total: true },
        _count: { id: true },
      }),
    ]);

  // Get daily sales for the last 30 days using raw SQL for proper date grouping
  const last30Days = subDays(today, 30);
  const dailySalesRaw = await prisma.$queryRaw<
    Array<{ date: Date; total: string; count: bigint }>
  >`
    SELECT
      DATE("createdAt") as date,
      COALESCE(SUM(total), 0) as total,
      COUNT(id) as count
    FROM "Sale"
    WHERE "tenantId" = ${tenantId}
      AND status IN ('COMPLETED', 'PAID')
      AND "createdAt" >= ${last30Days}
      ${locationId ? prisma.$queryRaw`AND "staffId" IN (SELECT id FROM "Staff" WHERE "locationId" = ${locationId})` : prisma.$queryRaw``}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  // Get monthly sales for the last 12 months using raw SQL
  const last12Months = subMonths(today, 12);
  const monthlySalesRaw = await prisma.$queryRaw<
    Array<{ month: string; total: string; count: bigint }>
  >`
    SELECT
      TO_CHAR("createdAt", 'YYYY-MM') as month,
      COALESCE(SUM(total), 0) as total,
      COUNT(id) as count
    FROM "Sale"
    WHERE "tenantId" = ${tenantId}
      AND status IN ('COMPLETED', 'PAID')
      AND "createdAt" >= ${last12Months}
      ${locationId ? prisma.$queryRaw`AND "staffId" IN (SELECT id FROM "Staff" WHERE "locationId" = ${locationId})` : prisma.$queryRaw``}
    GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
    ORDER BY month ASC
  `;

  // Process raw results
  const dailySales = dailySalesRaw.map((row) => ({
    date: format(row.date, 'yyyy-MM-dd'),
    total: Number(row.total),
    count: Number(row.count),
  }));

  const monthlySales = monthlySalesRaw.map((row) => ({
    month: row.month,
    total: Number(row.total),
    count: Number(row.count),
  }));

  // Calculate metrics
  const thisMonthTotal = Number(monthSales._sum.total || 0);
  const lastMonthTotal = Number(lastMonthSales._sum.total || 0);
  const monthlyGrowth =
    lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : thisMonthTotal > 0
        ? 100
        : 0;
  const averageTicket =
    monthSales._count.id > 0 ? thisMonthTotal / monthSales._count.id : 0;

  return {
    todaySales: {
      total: Number(todaySales._sum.total || 0),
      count: todaySales._count.id,
    },
    weekSales: {
      total: Number(weekSales._sum.total || 0),
      count: weekSales._count.id,
    },
    monthSales: {
      total: thisMonthTotal,
      count: monthSales._count.id,
    },
    yearSales: {
      total: Number(yearSales._sum.total || 0),
      count: yearSales._count.id,
    },
    monthlyGrowth,
    averageTicket,
    dailySales,
    monthlySales,
  };
}

// ============================================================================
// Inventory Analytics by Location
// ============================================================================

export async function getLocationInventoryAnalytics(
  tenantId: string,
  locationId: string | null
): Promise<LocationInventoryAnalytics> {
  const startOfThisMonth = startOfMonth(new Date());

  // Build location filter
  const locationFilter = locationId ? { locationId } : {};

  const [inventoryItems, lowStockItems, topProductsData] = await Promise.all([
    // All active inventory items
    prisma.inventoryItem.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        ...locationFilter,
      },
      select: {
        id: true,
        name: true,
        category: true,
        quantity: true,
        cost: true,
        minStock: true,
      },
    }),

    // Low stock items count
    prisma.inventoryItem.count({
      where: {
        tenantId,
        status: 'ACTIVE',
        ...locationFilter,
        quantity: { lte: prisma.inventoryItem.fields.minStock },
        minStock: { not: null },
      },
    }),

    // Top selling products this month
    prisma.saleItem.groupBy({
      by: ['itemId'],
      where: {
        itemId: { not: null },
        sale: {
          tenantId,
          status: { in: ['COMPLETED', 'PAID'] },
          createdAt: { gte: startOfThisMonth },
          ...(locationId ? { staff: { locationId } } : {}),
        },
      },
      _sum: { total: true, quantity: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    }),
  ]);

  // Calculate total inventory value
  const inventoryValue = inventoryItems.reduce((total, item) => {
    return total + Number(item.quantity) * Number(item.cost || 0);
  }, 0);

  // Calculate category breakdown
  const categoryMap = new Map<string, { count: number; value: number }>();
  for (const item of inventoryItems) {
    const cat = item.category || 'Sin categoría';
    const existing = categoryMap.get(cat) || { count: 0, value: 0 };
    categoryMap.set(cat, {
      count: existing.count + 1,
      value: existing.value + Number(item.quantity) * Number(item.cost || 0),
    });
  }
  const categories = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      value: data.value,
    }))
    .sort((a, b) => b.value - a.value);

  // Get product details for top products
  const productIds = topProductsData
    .map((p) => p.itemId)
    .filter(Boolean) as string[];
  const products =
    productIds.length > 0
      ? await prisma.inventoryItem.findMany({
          where: { id: { in: productIds } },
        })
      : [];

  const topProducts = topProductsData.map((item) => {
    const product = products.find((p) => p.id === item.itemId);
    const revenue = Number(item._sum.total || 0);
    const quantitySold = Number(item._sum.quantity || 0);
    const cost = product ? Number(product.cost || 0) : 0;
    const profit = revenue - cost * quantitySold;

    return {
      id: item.itemId || '',
      name: product?.name || 'Producto desconocido',
      revenue,
      quantitySold,
      profit,
    };
  });

  return {
    totalItems: inventoryItems.length,
    inventoryValue,
    lowStockCount: lowStockItems,
    topProducts,
    categories,
  };
}

// ============================================================================
// Performance Metrics by Location
// ============================================================================

export async function getLocationPerformanceMetrics(
  tenantId: string,
  locationId: string | null,
  dateRange?: DateRange
): Promise<LocationPerformanceMetrics> {
  const today = new Date();
  const startOfThisMonth = startOfMonth(today);
  const threeMonthsAgo = subMonths(today, 3);

  // Build location filter
  const locationFilter = locationId ? { locationId } : {};
  const appointmentDateFilter = dateRange?.startDate
    ? { dateTime: { gte: dateRange.startDate, lte: dateRange.endDate || today } }
    : { dateTime: { gte: startOfThisMonth } };

  // Appointment metrics
  const [totalAppointments, completedAppointments, cancelledAppointments, noShowAppointments] =
    await Promise.all([
      prisma.appointment.count({
        where: {
          tenantId,
          ...locationFilter,
          ...appointmentDateFilter,
        },
      }),
      prisma.appointment.count({
        where: {
          tenantId,
          ...locationFilter,
          ...appointmentDateFilter,
          status: 'COMPLETED',
        },
      }),
      prisma.appointment.count({
        where: {
          tenantId,
          ...locationFilter,
          ...appointmentDateFilter,
          status: 'CANCELLED',
        },
      }),
      prisma.appointment.count({
        where: {
          tenantId,
          ...locationFilter,
          ...appointmentDateFilter,
          status: 'NO_SHOW',
        },
      }),
    ]);

  // Customer metrics
  const [totalCustomers, newCustomers, activeCustomers] = await Promise.all([
    prisma.customer.count({
      where: {
        tenantId,
        isActive: true,
        ...(locationId ? { locationId } : {}),
      },
    }),
    prisma.customer.count({
      where: {
        tenantId,
        isActive: true,
        ...(locationId ? { locationId } : {}),
        createdAt: { gte: startOfThisMonth },
      },
    }),
    // Active = customers with sales in last 3 months
    prisma.customer.count({
      where: {
        tenantId,
        isActive: true,
        ...(locationId ? { locationId } : {}),
        sales: {
          some: {
            status: { in: ['COMPLETED', 'PAID'] },
            createdAt: { gte: threeMonthsAgo },
          },
        },
      },
    }),
  ]);

  // Staff metrics
  const [totalStaff, activeStaff] = await Promise.all([
    prisma.staff.count({
      where: {
        tenantId,
        ...locationFilter,
      },
    }),
    prisma.staff.count({
      where: {
        tenantId,
        ...locationFilter,
        isActive: true,
      },
    }),
  ]);

  const completionRate =
    totalAppointments > 0
      ? (completedAppointments / totalAppointments) * 100
      : 0;
  const retentionRate =
    totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;
  const appointmentsPerStaff =
    activeStaff > 0 ? completedAppointments / activeStaff : 0;

  return {
    appointments: {
      total: totalAppointments,
      completed: completedAppointments,
      cancelled: cancelledAppointments,
      noShow: noShowAppointments,
      completionRate,
    },
    customers: {
      total: totalCustomers,
      new: newCustomers,
      active: activeCustomers,
      retentionRate,
    },
    staff: {
      total: totalStaff,
      active: activeStaff,
      appointmentsPerStaff,
    },
  };
}

// ============================================================================
// Cross-Location Comparison
// ============================================================================

export async function getLocationComparison(
  tenantId: string,
  locationIds?: string[]
): Promise<LocationComparison[]> {
  // Get all active locations for the tenant
  const locations = await prisma.location.findMany({
    where: {
      tenantId,
      isActive: true,
      ...(locationIds?.length ? { id: { in: locationIds } } : {}),
    },
    select: {
      id: true,
      name: true,
    },
  });

  const startOfThisMonth = startOfMonth(new Date());

  // Get metrics for each location
  const comparisons = await Promise.all(
    locations.map(async (location) => {
      const [revenue, appointments, customers, inventoryValue] =
        await Promise.all([
          // Revenue this month
          prisma.sale.aggregate({
            where: {
              tenantId,
              status: { in: ['COMPLETED', 'PAID'] },
              createdAt: { gte: startOfThisMonth },
              staff: { locationId: location.id },
            },
            _sum: { total: true },
            _count: { id: true },
          }),

          // Appointments this month
          prisma.appointment.count({
            where: {
              tenantId,
              locationId: location.id,
              dateTime: { gte: startOfThisMonth },
            },
          }),

          // Customers assigned to location
          prisma.customer.count({
            where: {
              tenantId,
              locationId: location.id,
              isActive: true,
            },
          }),

          // Inventory value at location
          prisma.inventoryItem.aggregate({
            where: {
              tenantId,
              locationId: location.id,
              status: 'ACTIVE',
            },
            _sum: { cost: true },
          }),
        ]);

      const revenueTotal = Number(revenue._sum.total || 0);
      const salesCount = revenue._count.id;

      return {
        locationId: location.id,
        locationName: location.name,
        revenue: revenueTotal,
        appointments,
        customers,
        inventoryValue: Number(inventoryValue._sum.cost || 0),
        averageTicket: salesCount > 0 ? revenueTotal / salesCount : 0,
        rank: 0, // Will be set after sorting
      };
    })
  );

  // Sort by revenue and assign ranks
  comparisons.sort((a, b) => b.revenue - a.revenue);
  comparisons.forEach((c, index) => {
    c.rank = index + 1;
  });

  return comparisons;
}

// ============================================================================
// Full Location Reports Data
// ============================================================================

export interface FullLocationReportsData {
  revenue: LocationRevenueAnalytics;
  inventory: LocationInventoryAnalytics;
  performance: LocationPerformanceMetrics;
}

export async function getFullLocationReportsData(
  tenantId: string,
  locationId: string | null,
  dateRange?: DateRange
): Promise<FullLocationReportsData> {
  const [revenue, inventory, performance] = await Promise.all([
    getLocationRevenueAnalytics(tenantId, locationId, dateRange),
    getLocationInventoryAnalytics(tenantId, locationId),
    getLocationPerformanceMetrics(tenantId, locationId, dateRange),
  ]);

  return {
    revenue,
    inventory,
    performance,
  };
}

// ============================================================================
// Access Control Helper
// ============================================================================

export async function validateLocationAccess(
  staffId: string,
  locationId: string | null
): Promise<boolean> {
  // If no location specified, allow access (tenant-wide reports)
  if (!locationId) {
    return true;
  }

  // Check if staff has access to this location
  const staffLocationIds = await getStaffLocationIds(staffId);
  return staffLocationIds.includes(locationId);
}
