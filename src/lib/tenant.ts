import { prisma } from './prisma';

/**
 * Create a new tenant with all necessary related records
 */
export async function createTenantWithDefaults(data: {
  name: string;
  slug: string;
  userId: string;
  phone?: string;
  address?: string;
}) {
  // Get or create the basic plan
  let basicPlan = await prisma.plan.findFirst({
    where: { key: 'basic' }
  });

  if (!basicPlan) {
    basicPlan = await prisma.plan.create({
      data: {
        key: 'basic',
        name: 'Plan Básico',
        description: 'Plan gratuito para comenzar',
        monthlyPrice: 0,
        annualPrice: 0,
        features: {
          pets: 50,
          users: 1,
          storage: 1,
          appointments: true,
          medicalRecords: true,
          reminders: false,
          reports: false,
          api: false
        },
        maxUsers: 1,
        maxPets: 50,
        storageGB: 1,
        isRecommended: false,
        isActive: true,
        isMvp: true
      }
    });
  }

  return await prisma.$transaction(async (tx) => {
    // Create tenant
    const tenant = await tx.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        planType: 'BASIC',
        status: 'ACTIVE',
        isTrialPeriod: true,
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }
    });

    // Create tenant subscription
    await tx.tenantSubscription.create({
      data: {
        tenantId: tenant.id,
        planId: basicPlan.id,
        status: 'TRIALING',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }
    });

    // Create tenant settings
    await tx.tenantSettings.create({
      data: {
        tenantId: tenant.id,
        timezone: 'UTC',
        dateFormat: 'DD/MM/YYYY',
        enableEmailReminders: true,
        enableSmsReminders: false,
        taxRate: 0,
        currencyCode: 'USD',
        currencySymbol: '$',
        appointmentDuration: 30,
      }
    });

    // Create tenant usage stats
    await tx.tenantUsageStats.create({
      data: {
        tenantId: tenant.id,
        totalUsers: 1,
        totalPets: 0,
        totalAppointments: 0,
        totalSales: 0,
        storageUsedBytes: 0,
        lastUpdated: new Date(),
      }
    });

    // Create default roles for the tenant
    const adminRole = await tx.role.create({
      data: {
        tenantId: tenant.id,
        key: 'admin',
        name: 'Administrador',
        isSystem: true,
      }
    });

    await tx.role.create({
      data: {
        tenantId: tenant.id,
        key: 'veterinarian',
        name: 'Veterinario',
        isSystem: true,
      }
    });

    await tx.role.create({
      data: {
        tenantId: tenant.id,
        key: 'assistant',
        name: 'Asistente',
        isSystem: true,
      }
    });

    // Update user with tenant and contact info
    const updatedUser = await tx.user.update({
      where: { id: data.userId },
      data: {
        tenantId: tenant.id,
        phone: data.phone,
        address: data.address,
      },
      include: {
        tenant: {
          include: {
            tenantSubscription: {
              include: { plan: true }
            }
          }
        }
      }
    });

    // Assign admin role to the user
    await tx.userRole.create({
      data: {
        userId: data.userId,
        roleId: adminRole.id,
      }
    });

    return { tenant, user: updatedUser };
  });
}

/**
 * Check if a slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug }
  });
  return !existingTenant;
}

/**
 * Generate a unique slug from a name
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Generate a unique slug with fallback numbers if needed
 */
export async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = generateSlugFromName(name);
  let slug = baseSlug;
  let counter = 1;

  while (!(await isSlugAvailable(slug))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
} 