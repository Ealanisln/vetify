import { prisma } from '@/lib/prisma';
import { TenantStatus } from '@prisma/client';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

interface RecentTenant {
  id: string;
  name: string;
  status: TenantStatus;
  createdAt: Date;
  tenantSubscription: {
    plan: {
      name: string;
      key: string;
    };
  } | null;
  _count: {
    users: number;
    pets: number;
    appointments: number;
  };
}

interface PlanDistribution {
  planName: string;
  count: number;
  percentage: number;
}

interface RevenueData {
  month: string;
  revenue: number;
}

export interface AdminStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  recentTenants: RecentTenant[];
  planDistribution: PlanDistribution[];
  revenueData: RevenueData[];
  systemHealth: SystemHealth;
}

export interface SystemHealth {
  uptime: number;
  databaseStatus: 'healthy' | 'warning' | 'error';
  activeConnections: number;
  responseTime: number;
}

/**
 * Get comprehensive admin statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
  const [
    totalTenants,
    activeTenants,
    suspendedTenants,
    totalUsers,
    totalRevenue,
    monthlyRevenue,
    recentTenants,
    planDistribution,
    revenueData
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: 'ACTIVE' } }),
    prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
    prisma.user.count(),
    getTotalRevenue(),
    getMonthlyRevenue(),
    getRecentTenants(),
    getPlanDistribution(),
    getRevenueData()
  ]);

  return {
    totalTenants,
    activeTenants,
    suspendedTenants,
    totalUsers,
    totalRevenue,
    monthlyRevenue,
    recentTenants,
    planDistribution,
    revenueData,
    systemHealth: await getSystemHealth()
  };
}

/**
 * Get total revenue from active subscriptions
 */
async function getTotalRevenue(): Promise<number> {
  const subscriptions = await prisma.tenantSubscription.findMany({
    where: {
      status: 'ACTIVE'
    },
    include: {
      plan: true
    }
  });
  
  return subscriptions.reduce((total, sub) => {
    return total + Number(sub.plan.monthlyPrice);
  }, 0);
}

/**
 * Get monthly revenue for current month
 */
async function getMonthlyRevenue(): Promise<number> {
  const startDate = startOfMonth(new Date());
  const endDate = endOfMonth(new Date());

  const subscriptions = await prisma.tenantSubscription.findMany({
    where: {
      status: 'ACTIVE',
      currentPeriodStart: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      plan: true
    }
  });
  
  return subscriptions.reduce((total, sub) => {
    return total + Number(sub.plan.monthlyPrice);
  }, 0);
}

/**
 * Get recent tenants with their subscription info
 */
async function getRecentTenants() {
  const tenants = await prisma.tenant.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      tenantSubscription: {
        include: { plan: true }
      },
      _count: {
        select: {
          users: true,
          pets: true,
          appointments: true
        }
      }
    }
  });

  // Serialize the data to convert Decimal objects to numbers
  return tenants.map(tenant => ({
    ...tenant,
    tenantSubscription: tenant.tenantSubscription ? {
      ...tenant.tenantSubscription,
      plan: {
        ...tenant.tenantSubscription.plan,
        monthlyPrice: Number(tenant.tenantSubscription.plan.monthlyPrice),
        annualPrice: Number(tenant.tenantSubscription.plan.annualPrice)
      }
    } : null
  }));
}

/**
 * Get plan distribution statistics
 */
async function getPlanDistribution(): Promise<PlanDistribution[]> {
  const distribution = await prisma.tenantSubscription.groupBy({
    by: ['planId'],
    _count: {
      planId: true
    }
  });

  return Promise.all(
    distribution.map(async (item) => {
      const plan = await prisma.plan.findUnique({
        where: { id: item.planId }
      });
      return {
        planName: plan?.name || 'Unknown',
        count: item._count.planId,
        percentage: 0 // Calculate in frontend
      };
    })
  );
}

/**
 * Get revenue data for the last 12 months
 */
async function getRevenueData(): Promise<RevenueData[]> {
  const data: RevenueData[] = [];
  
  for (let i = 11; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);

    const subscriptions = await prisma.tenantSubscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodStart: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        plan: true
      }
    });

    const revenue = subscriptions.reduce((total, sub) => {
      return total + Number(sub.plan.monthlyPrice);
    }, 0);

    data.push({
      month: format(date, 'MMM yyyy'),
      revenue
    });
  }

  return data;
}

/**
 * Get system health metrics
 */
async function getSystemHealth(): Promise<SystemHealth> {
  const startTime = Date.now();
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    return {
      uptime: process.uptime(),
      databaseStatus: responseTime < 1000 ? 'healthy' : responseTime < 3000 ? 'warning' : 'error',
      activeConnections: 0, // Would need monitoring setup for real data
      responseTime
    };
  } catch {
    return {
      uptime: process.uptime(),
      databaseStatus: 'error',
      activeConnections: 0,
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Get all tenants with pagination and filters
 */
export async function getAllTenants(
  page: number = 1,
  limit: number = 20,
  status?: TenantStatus,
  search?: string
) {
  const skip = (page - 1) * limit;
  
  const where: Record<string, unknown> = {};
  
  if (status) {
    where.status = status;
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        tenantSubscription: {
          include: { plan: true }
        },
        _count: {
          select: {
            users: true,
            pets: true,
            appointments: true
          }
        }
      }
    }),
    prisma.tenant.count({ where })
  ]);

  // Serialize the data to convert Decimal objects to numbers
  const serializedTenants = tenants.map(tenant => ({
    ...tenant,
    tenantSubscription: tenant.tenantSubscription ? {
      ...tenant.tenantSubscription,
      plan: {
        ...tenant.tenantSubscription.plan,
        monthlyPrice: Number(tenant.tenantSubscription.plan.monthlyPrice),
        annualPrice: Number(tenant.tenantSubscription.plan.annualPrice)
      }
    } : null
  }));

  return {
    tenants: serializedTenants,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  };
}

/**
 * Suspend a tenant
 */
export async function suspendTenant(tenantId: string) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { 
      status: 'SUSPENDED',
      // Note: Add suspensionReason field to schema if needed
    }
  });
}

/**
 * Activate a tenant
 */
export async function activateTenant(tenantId: string) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { 
      status: 'ACTIVE'
    }
  });
}

/**
 * Delete a tenant (soft delete)
 */
export async function deleteTenant(tenantId: string) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { 
      status: 'CANCELLED'
    }
  });
}

/**
 * Get tenant details by ID
 */
export async function getTenantDetails(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      tenantSubscription: {
        include: { plan: true }
      },
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          isActive: true
        }
      },
      _count: {
        select: {
          pets: true,
          appointments: true,
          customers: true,
          sales: true
        }
      }
    }
  });

  if (!tenant) return null;

  // Serialize the data to convert Decimal objects to numbers
  return {
    ...tenant,
    tenantSubscription: tenant.tenantSubscription ? {
      ...tenant.tenantSubscription,
      plan: {
        ...tenant.tenantSubscription.plan,
        monthlyPrice: Number(tenant.tenantSubscription.plan.monthlyPrice),
        annualPrice: Number(tenant.tenantSubscription.plan.annualPrice)
      }
    } : null
  };
}

/**
 * Update tenant plan
 */
export async function updateTenantPlan(tenantId: string, planId: string) {
  return prisma.tenantSubscription.upsert({
    where: { tenantId },
    update: { planId },
    create: {
      tenantId,
      planId,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  });
}

/**
 * Get usage statistics for a tenant
 */
export async function getTenantUsage(tenantId: string) {
  const [pets, users, appointments, sales] = await Promise.all([
    prisma.pet.count({ where: { tenantId } }),
    prisma.user.count({ where: { tenantId } }),
    prisma.appointment.count({ where: { tenantId } }),
    prisma.sale.count({ where: { tenantId } })
  ]);

  return {
    pets,
    users,
    appointments,
    sales
  };
} 