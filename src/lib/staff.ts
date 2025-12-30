import { prisma } from './prisma';
import { z } from 'zod';

// Type definitions
type StaffWhereInput = {
  tenantId: string;
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    email?: { contains: string; mode: 'insensitive' };
    phone?: { contains: string; mode: 'insensitive' };
    position?: { contains: string; mode: 'insensitive' };
  }>;
  position?: { contains: string; mode: 'insensitive' };
  isActive?: boolean;
  staffLocations?: {
    some: {
      locationId: string;
    };
  };
};

// TODO: Remove these when analytics functions are fixed
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type StaffActivityData = {
  staffId: string;
  _count: { id: number };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type StaffDetails = {
  id: string;
  name: string;
  position: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type StaffPerformanceData = {
  id: string;
  name: string;
  position: string;
  appointments: unknown[];
  medicalOrders: unknown[];
  Sale: SaleData[];
};

type SaleData = {
  total: number | string;
};

// Validation schemas
export const createStaffSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  position: z.string().min(2, 'La posición debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  licenseNumber: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateStaffSchema = createStaffSchema.partial();

export const staffFiltersSchema = z.object({
  search: z.string().optional(),
  position: z.string().optional(),
  isActive: z.boolean().optional(),
  locationId: z.string().optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
});

export type CreateStaffData = z.infer<typeof createStaffSchema>;
export type UpdateStaffData = z.infer<typeof updateStaffSchema>;
export type StaffFilters = z.infer<typeof staffFiltersSchema>;

// Staff service functions
export async function createStaff(tenantId: string, data: CreateStaffData) {
  // Check if email already exists for this tenant
  if (data.email) {
    const existingStaff = await prisma.staff.findFirst({
      where: {
        tenantId,
        email: data.email,
        isActive: true
      }
    });

    if (existingStaff) {
      throw new Error('Ya existe un miembro del personal con este email');
    }
  }

  const staff = await prisma.staff.create({
    data: {
      ...data,
      tenantId,
    },
    include: {
      _count: {
        select: {
          appointments: true,
          medicalHistories: true,
          medicalOrders: true,
          Sale: true,
        }
      }
    }
  });

  return staff;
}

export async function getStaffByTenant(tenantId: string, filters: Partial<StaffFilters> = {}) {
  const { search, position, isActive, locationId, page, limit } = staffFiltersSchema.parse(filters);

  const where: StaffWhereInput = {
    tenantId,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { position: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (position) {
    where.position = { contains: position, mode: 'insensitive' };
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (locationId) {
    where.staffLocations = {
      some: {
        locationId,
      },
    };
  }

  const [staff, total] = await Promise.all([
    prisma.staff.findMany({
      where,
      include: {
        _count: {
          select: {
            appointments: true,
            medicalHistories: true,
            medicalOrders: true,
            Sale: true,
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' }
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.staff.count({ where })
  ]);

  return {
    staff,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  };
}

export async function getStaffById(tenantId: string, staffId: string) {
  // PERFORMANCE FIX: Use select instead of include to avoid N+1 queries
  // Only fetch the fields we actually need for display
  const staff = await prisma.staff.findFirst({
    where: {
      id: staffId,
      tenantId,
    },
    include: {
      appointments: {
        select: {
          id: true,
          dateTime: true,
          status: true,
          reason: true,
          pet: {
            select: {
              id: true,
              name: true,
              species: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                }
              }
            }
          }
        },
        orderBy: { dateTime: 'desc' },
        take: 10
      },
      medicalHistories: {
        select: {
          id: true,
          createdAt: true,
          diagnosis: true,
          pet: {
            select: {
              id: true,
              name: true,
              species: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      Sale: {
        select: {
          id: true,
          createdAt: true,
          total: true,
          status: true,
          customer: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: {
          appointments: true,
          medicalHistories: true,
          medicalOrders: true,
          Sale: true,
          inventoryMovements: true,
          treatmentRecords: true,
        }
      }
    }
  });

  if (!staff) {
    throw new Error('Personal no encontrado');
  }

  return staff;
}

export async function updateStaff(tenantId: string, staffId: string, data: UpdateStaffData) {
  // Check if staff exists and belongs to tenant
  const existingStaff = await prisma.staff.findFirst({
    where: {
      id: staffId,
      tenantId,
    }
  });

  if (!existingStaff) {
    throw new Error('Personal no encontrado');
  }

  // Check if email is being updated and if it conflicts with another staff member
  if (data.email && data.email !== existingStaff.email) {
    const emailConflict = await prisma.staff.findFirst({
      where: {
        tenantId,
        email: data.email,
        id: { not: staffId },
        isActive: true
      }
    });

    if (emailConflict) {
      throw new Error('Ya existe un miembro del personal con este email');
    }
  }

  const updatedStaff = await prisma.staff.update({
    where: { id: staffId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
    include: {
      _count: {
        select: {
          appointments: true,
          medicalHistories: true,
          medicalOrders: true,
          Sale: true,
        }
      }
    }
  });

  return updatedStaff;
}

export async function deleteStaff(tenantId: string, staffId: string) {
  // Check if staff exists and belongs to tenant
  const existingStaff = await prisma.staff.findFirst({
    where: {
      id: staffId,
      tenantId,
    }
  });

  if (!existingStaff) {
    throw new Error('Personal no encontrado');
  }

  // Check if staff has any related records
  const relatedRecords = await prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      _count: {
        select: {
          appointments: true,
          medicalHistories: true,
          medicalOrders: true,
          Sale: true,
          inventoryMovements: true,
          treatmentRecords: true,
        }
      }
    }
  });

  const hasRelatedRecords = relatedRecords?._count && Object.values(relatedRecords._count).some((count: unknown) => Number(count) > 0);

  if (hasRelatedRecords) {
    // Soft delete - just mark as inactive
    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      }
    });
    return { staff: updatedStaff, isHardDelete: false };
  } else {
    // Hard delete if no related records
    await prisma.staff.delete({
      where: { id: staffId }
    });
    return { staff: null, isHardDelete: true };
  }
}

// TODO: Fix type issues with Prisma generated types
// Temporarily commented out to fix build
export async function getStaffStats(tenantId: string) {
  const [totalStaff, activeStaff] = await Promise.all([
    // Total staff count
    prisma.staff.count({
      where: { tenantId }
    }),

    // Active staff count
    prisma.staff.count({
      where: { tenantId, isActive: true }
    }),
  ]);

  return {
    totalStaff,
    activeStaff,
    inactiveStaff: totalStaff - activeStaff,
    positions: [], // Temporarily empty
    recentActivity: [] // Temporarily empty
  };
}

export async function getActiveStaffForSelect(tenantId: string) {
  return await prisma.staff.findMany({
    where: {
      tenantId,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      position: true,
      email: true
    },
    orderBy: { name: 'asc' }
  });
}

// TODO: Fix type issues with Prisma generated types
// Temporarily commented out to fix build
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getStaffPerformance(tenantId: string, startDate?: Date, endDate?: Date) {
  // Return empty performance data temporarily
  return [];
} 