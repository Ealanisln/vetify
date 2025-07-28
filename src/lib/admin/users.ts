import { prisma } from '@/lib/prisma';
import { User, UserRole, Role, AdminAction } from '@prisma/client';

export interface UserWithRoles extends User {
  userRoles: (UserRole & {
    role: Role;
  })[];
  tenant?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  _count?: {
    appointments: number;
    sales: number;
    medicalOrders: number;
  };
}

export interface UserFilters {
  search?: string;
  tenantId?: string;
  roleId?: string;
  isActive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  recentUsers: number; // Last 30 days
  usersWithoutTenant: number;
  superAdmins: number;
}

/**
 * Get comprehensive user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    recentUsers,
    usersWithoutTenant,
    superAdmins
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.count({ 
      where: { 
        createdAt: { gte: thirtyDaysAgo } 
      } 
    }),
    prisma.user.count({ where: { tenantId: null } }),
    // Count super admins (by role and by email domain)
    countSuperAdmins()
  ]);

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    recentUsers,
    usersWithoutTenant,
    superAdmins
  };
}

/**
 * Count super administrators
 */
async function countSuperAdmins(): Promise<number> {
  const [roleBasedSuperAdmins, emailBasedSuperAdmins] = await Promise.all([
    prisma.userRole.count({
      where: {
        role: {
          key: 'SUPER_ADMIN',
          isSystem: true
        }
      }
    }),
    prisma.user.count({
      where: {
        OR: [
          { email: { endsWith: '@vetify.pro' } },
          { email: { endsWith: '@vetify.com' } },
          { email: { endsWith: '@alanis.dev' } }
        ]
      }
    })
  ]);

  // Return the higher count to avoid double counting
  return Math.max(roleBasedSuperAdmins, emailBasedSuperAdmins);
}

/**
 * Get users with pagination and filters
 */
export async function getUsers(
  page: number = 1,
  limit: number = 20,
  filters: UserFilters = {}
): Promise<{
  users: UserWithRoles[];
  total: number;
  pages: number;
  currentPage: number;
}> {
  const skip = (page - 1) * limit;
  
  const where: Record<string, unknown> = {};
  
  // Apply filters
  if (filters.search) {
    where.OR = [
      { email: { contains: filters.search, mode: 'insensitive' } },
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.tenantId) {
    where.tenantId = filters.tenantId;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      (where.createdAt as Record<string, unknown>).gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (where.createdAt as Record<string, unknown>).lte = filters.dateTo;
    }
  }

  // Role filter requires a separate query
  let userIds: string[] | undefined;
  if (filters.roleId) {
    const usersWithRole = await prisma.userRole.findMany({
      where: { roleId: filters.roleId },
      select: { userId: true }
    });
    userIds = usersWithRole.map(ur => ur.userId);
    
    if (userIds.length === 0) {
      // No users with this role, return empty result
      return {
        users: [],
        total: 0,
        pages: 0,
        currentPage: page
      };
    }
    
    where.id = { in: userIds };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        userRoles: {
          include: {
            role: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            appointments: true,
            sales: true,
            medicalOrders: true
          }
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  return {
    users,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  };
}

/**
 * Get user by ID with full details
 */
export async function getUserById(userId: string): Promise<UserWithRoles | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: true
        }
      },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      _count: {
        select: {
          appointments: true,
          sales: true,
          medicalOrders: true,
          customers: true
        }
      }
    }
  });
}

/**
 * Create a new user
 */
export async function createUser(
  userData: {
    id: string; // Clerk user ID
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
    address?: string;
    tenantId?: string;
    isActive?: boolean;
  },
  performedBy: string
): Promise<User> {
  const user = await prisma.user.create({
    data: {
      ...userData,
      isActive: userData.isActive ?? true
    }
  });

  // Log the action
  await logAdminAction({
    action: 'ASSIGNED', // Using existing enum value
    performedBy,
    targetUserId: user.id,
    targetEmail: user.email,
    metadata: {
      action: 'CREATE_USER',
      userData: {
        email: userData.email,
        tenantId: userData.tenantId
      }
    }
  });

  return user;
}

/**
 * Update user information
 */
export async function updateUser(
  userId: string,
  updateData: {
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
    address?: string;
    tenantId?: string;
    isActive?: boolean;
    preferredContactMethod?: string;
  },
  performedBy: string
): Promise<User> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData
  });

  // Log the action
  await logAdminAction({
    action: 'ASSIGNED', // Using existing enum value
    performedBy,
    targetUserId: userId,
    targetEmail: user.email,
    metadata: {
      action: 'UPDATE_USER',
      updateData
    }
  });

  return user;
}

/**
 * Delete/deactivate user
 */
export async function deactivateUser(userId: string, performedBy: string): Promise<User> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false }
  });

  // Log the action
  await logAdminAction({
    action: 'REMOVED',
    performedBy,
    targetUserId: userId,
    targetEmail: user.email,
    metadata: {
      action: 'DEACTIVATE_USER'
    }
  });

  return user;
}

/**
 * Activate user
 */
export async function activateUser(userId: string, performedBy: string): Promise<User> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: true }
  });

  // Log the action
  await logAdminAction({
    action: 'ASSIGNED', // Using existing enum value
    performedBy,
    targetUserId: userId,
    targetEmail: user.email,
    metadata: {
      action: 'ACTIVATE_USER'
    }
  });

  return user;
}

/**
 * Assign role to user
 */
export async function assignUserRole(
  userId: string, 
  roleId: string, 
  performedBy: string
): Promise<UserRole> {
  // Check if role assignment already exists
  const existingRole = await prisma.userRole.findFirst({
    where: { userId, roleId }
  });

  if (existingRole) {
    throw new Error('User already has this role');
  }

  const userRole = await prisma.userRole.create({
    data: { userId, roleId }
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { name: true }
  });

  // Log the action
  await logAdminAction({
    action: 'ASSIGNED',
    performedBy,
    targetUserId: userId,
    targetEmail: user?.email || '',
    metadata: {
      action: 'ASSIGN_ROLE',
      roleId,
      roleName: role?.name
    }
  });

  return userRole;
}

/**
 * Remove role from user
 */
export async function removeUserRole(
  userId: string, 
  roleId: string, 
  performedBy: string
): Promise<void> {
  const userRole = await prisma.userRole.findFirst({
    where: { userId, roleId }
  });

  if (!userRole) {
    throw new Error('User does not have this role');
  }

  await prisma.userRole.delete({
    where: { id: userRole.id }
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { name: true }
  });

  // Log the action
  await logAdminAction({
    action: 'REMOVED',
    performedBy,
    targetUserId: userId,
    targetEmail: user?.email || '',
    metadata: {
      action: 'REMOVE_ROLE',
      roleId,
      roleName: role?.name
    }
  });
}

/**
 * Get user activity history
 */
export async function getUserActivity(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where: {
        OR: [
          { targetUserId: userId },
          { performedBy: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        performedByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            name: true
          }
        }
      }
    }),
    prisma.adminAuditLog.count({
      where: {
        OR: [
          { targetUserId: userId },
          { performedBy: userId }
        ]
      }
    })
  ]);

  return {
    activities,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  };
}

/**
 * Get all available roles for assignment
 */
export async function getAvailableRoles(tenantId?: string) {
  return prisma.role.findMany({
    where: {
      OR: [
        { tenantId }, // Tenant-specific roles
        { isSystem: true } // System roles (like SUPER_ADMIN)
      ]
    },
    orderBy: [
      { isSystem: 'desc' }, // System roles first
      { name: 'asc' }
    ]
  });
}

/**
 * Log admin action for audit trail
 */
async function logAdminAction(data: {
  action: AdminAction;
  performedBy: string;
  targetUserId: string;
  targetEmail: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.adminAuditLog.create({
    data
  });
}

/**
 * Get tenants for user assignment
 */
export async function getTenantsForUserAssignment() {
  return prisma.tenant.findMany({
    where: {
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          users: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
} 