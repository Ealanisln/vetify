import { prisma } from './prisma';
import type { SubscriptionStatus } from '@prisma/client';
import type { ThemeId } from './themes';

/**
 * Initialize trial period for a tenant
 * Returns type-safe trial configuration
 */
function initializeTrialPeriod(days: number = 30) {
  const trialEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  return {
    isTrialPeriod: true,
    trialEndsAt,
    subscriptionStatus: 'TRIALING' as const,
  };
}

// Types for public pages
export interface PublicHours {
  weekdays?: string;
  saturday?: string;
  sunday?: string;
}

export interface PublicImages {
  hero?: string;
  gallery?: string[];
}

export interface PublicSocialMedia {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  whatsapp?: string;
}

export interface PublicService {
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  price?: string;
}

export interface PublicTenant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  publicPageEnabled: boolean;
  publicDescription: string | null;
  publicPhone: string | null;
  publicEmail: string | null;
  publicAddress: string | null;
  publicHours: PublicHours | null;
  publicServices: PublicService[] | null;
  publicImages: PublicImages | null;
  publicSocialMedia: PublicSocialMedia | null;
  publicThemeColor: string | null;
  publicTheme: ThemeId | null;
  publicBookingEnabled: boolean;
  createdAt: Date;
  tenantSubscription: {
    id: string;
    plan: {
      id: string;
      name: string;
    };
  } | null;
}

// Helper function to transform tenant data for public pages
function transformTenantForPublic(tenant: {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  publicPageEnabled: boolean;
  publicDescription: string | null;
  publicPhone: string | null;
  publicEmail: string | null;
  publicAddress: string | null;
  publicHours: unknown;
  publicServices: unknown;
  publicImages: unknown;
  publicSocialMedia: unknown;
  publicThemeColor: string | null;
  publicTheme: string | null;
  publicBookingEnabled: boolean;
  createdAt: Date;
  tenantSubscription: {
    id: string;
    plan: {
      id: string;
      name: string;
    };
  } | null;
}): PublicTenant {
  return {
    ...tenant,
    publicHours: tenant.publicHours as PublicHours | null,
    publicServices: tenant.publicServices as PublicService[] | null,
    publicImages: tenant.publicImages as PublicImages | null,
    publicSocialMedia: tenant.publicSocialMedia as PublicSocialMedia | null,
    publicTheme: tenant.publicTheme as ThemeId | null,
    tenantSubscription: tenant.tenantSubscription
  };
}

/**
 * Create a new tenant with all necessary related records
 */
export async function createTenantWithDefaults(data: {
  name: string;
  slug: string;
  userId: string;
  planKey: 'BASICO' | 'PROFESIONAL' | 'CORPORATIVO' | 'CLINICA' | 'EMPRESA'; // Support both new and legacy plan keys
  billingInterval: 'monthly' | 'yearly';
  phone?: string;
  address?: string;
}) {
  // Get the selected plan
  const plan = await prisma.plan.findFirst({
    where: { key: data.planKey, isActive: true }
  });

  if (!plan) {
    throw new Error(`Plan ${data.planKey} no encontrado. Ejecute la migración B2B primero.`);
  }

  return await prisma.$transaction(async (tx) => {
    // Create tenant with selected plan
    const tenant = await tx.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        planType: data.planKey,
        status: 'ACTIVE',
        ...initializeTrialPeriod(30),
      }
    });

    // Create subscription with trial status
    await tx.tenantSubscription.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
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
 * Remove accents and diacritics from a string
 * Converts accented characters to their ASCII equivalents
 */
export function removeAccents(str: string): string {
  const accentMap: Record<string, string> = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ú': 'u',
    'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
    'À': 'a', 'È': 'e', 'Ì': 'i', 'Ò': 'o', 'Ù': 'u',
    'ä': 'a', 'ë': 'e', 'ï': 'i', 'ö': 'o', 'ü': 'u',
    'Ä': 'a', 'Ë': 'e', 'Ï': 'i', 'Ö': 'o', 'Ü': 'u',
    'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u',
    'Â': 'a', 'Ê': 'e', 'Î': 'i', 'Ô': 'o', 'Û': 'u',
    'ã': 'a', 'õ': 'o', 'ñ': 'n',
    'Ã': 'a', 'Õ': 'o', 'Ñ': 'n',
    'ç': 'c', 'Ç': 'c'
  };

  return str.split('').map(char => accentMap[char] || char).join('');
}

/**
 * Generate a unique slug from a name
 * Removes accents and converts to URL-friendly format
 */
export function generateSlugFromName(name: string): string {
  return removeAccents(name)
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

export async function getTenantByUserId(userId: string) {
  return prisma.tenant.findFirst({
    where: {
      users: {
        some: {
          id: userId
        }
      }
    },
    include: {
      tenantSubscription: {
        include: {
          plan: true
        }
      }
    }
  });
}

export async function updateTenantSubscription(
  tenantId: string,
  data: {
    stripeSubscriptionId?: string | null;
    stripeProductId?: string | null;
    planName?: string | null;
    subscriptionStatus?: SubscriptionStatus;
    subscriptionEndsAt?: Date | null;
  }
) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data
  });
}

export async function getTenantWithSubscription(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      tenantSubscription: {
        include: {
          plan: true
        }
      }
    }
  });
}

export async function createOrUpdateStripeCustomer(
  tenantId: string,
  stripeCustomerId: string
) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      stripeCustomerId
    }
  });
}

/**
 * Get tenant by slug for public pages
 */
export async function getTenantBySlug(slug: string): Promise<PublicTenant | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { 
      slug,
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      primaryColor: true,
      secondaryColor: true,
      publicPageEnabled: true,
      publicDescription: true,
      publicPhone: true,
      publicEmail: true,
      publicAddress: true,
      publicHours: true,
      publicServices: true,
      publicImages: true,
      publicSocialMedia: true,
      publicThemeColor: true,
      publicTheme: true,
      publicBookingEnabled: true,
      createdAt: true,
      tenantSubscription: {
        select: {
          id: true,
          plan: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  return tenant ? transformTenantForPublic(tenant) : null;
} 