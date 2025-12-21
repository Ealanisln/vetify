import { prisma } from './prisma';
import { serializeTenant } from './serializers';
import { hasActiveSubscription } from './auth';

interface PlanFeatures {
  whatsappMessages?: number;
  automations?: boolean;
  advancedReports?: boolean;
  advancedInventory?: boolean;
  multiLocation?: boolean;
  multiDoctor?: boolean;
  smsReminders?: boolean;
  apiAccess?: boolean;
  shiftManagement?: boolean;
}

export interface PlanLimits {
  maxPets: number;
  maxUsers: number;
  maxMonthlyWhatsApp: number;
  maxStorageGB: number;
  maxCashRegisters: number;
  canUseAutomations: boolean;
  canUseAdvancedReports: boolean;
  canUseAdvancedInventory: boolean;
  canUseMultiLocation: boolean;
  canUseMultiDoctor: boolean;
  canUseSMSReminders: boolean;
  canUseApiAccess?: boolean;
  canUseShiftManagement: boolean;
}

export interface PlanUsageStats {
  currentPets: number;
  currentUsers: number;
  currentMonthlyWhatsApp: number;
  currentStorageBytes: number;
}

/**
 * Get plan limits for a tenant
 * Falls back to PROFESIONAL plan limits if no subscription exists (30-day trial)
 * CRITICAL: Returns zero limits if trial expired and no active subscription
 */
export async function getPlanLimits(tenantId: string): Promise<PlanLimits> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      tenantSubscription: {
        include: { plan: true }
      }
    }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // CRITICAL FIX: Check if tenant has active subscription or valid trial
  // If trial expired and no active subscription, return zero limits
  if (!hasActiveSubscription(tenant)) {
    return {
      maxPets: 0,
      maxUsers: 0,
      maxMonthlyWhatsApp: 0,
      maxStorageGB: 0,
      maxCashRegisters: 0,
      canUseAutomations: false,
      canUseAdvancedReports: false,
      canUseAdvancedInventory: false,
      canUseMultiLocation: false,
      canUseMultiDoctor: false,
      canUseSMSReminders: false,
      canUseApiAccess: false,
      canUseShiftManagement: false
    };
  }

  // If no tenant subscription exists, return BASICO plan limits (30-day trial)
  // This will only execute if trial is still valid (checked above)
  if (!tenant?.tenantSubscription?.plan) {
    return {
      maxPets: 300,
      maxUsers: 3,
      maxMonthlyWhatsApp: -1, // ilimitado
      maxStorageGB: 5,
      maxCashRegisters: 1,
      canUseAutomations: false, // FUTURE FEATURE
      canUseAdvancedReports: false,
      canUseAdvancedInventory: false,
      canUseMultiLocation: false,
      canUseMultiDoctor: true,
      canUseSMSReminders: true,
      canUseApiAccess: false,
      canUseShiftManagement: false // Only for PROFESIONAL+
    };
  }

  const plan = tenant.tenantSubscription.plan;
  const features = plan.features as PlanFeatures;

  return {
    maxPets: plan.maxPets === -1 ? Number.MAX_SAFE_INTEGER : plan.maxPets,
    maxUsers: plan.maxUsers,
    maxMonthlyWhatsApp: features?.whatsappMessages === -1 ? Number.MAX_SAFE_INTEGER : (features?.whatsappMessages || 0),
    maxStorageGB: plan.storageGB,
    maxCashRegisters: plan.maxCashRegisters === -1 ? Number.MAX_SAFE_INTEGER : (plan.maxCashRegisters || 1),
    canUseAutomations: features?.automations || false,
    canUseAdvancedReports: features?.advancedReports || false,
    canUseAdvancedInventory: features?.advancedInventory || false,
    canUseMultiLocation: features?.multiLocation || false,
    canUseMultiDoctor: features?.multiDoctor || false,
    canUseSMSReminders: features?.smsReminders || false,
    canUseApiAccess: features?.apiAccess || false,
    canUseShiftManagement: features?.shiftManagement || false
  };
}

/**
 * Get current usage statistics for a tenant
 */
export async function getPlanUsageStats(tenantId: string): Promise<PlanUsageStats> {
  const [
    currentPets,
    currentUsers,
    currentMonthlyWhatsApp,
    usageStats
  ] = await Promise.all([
    prisma.pet.count({
      where: { tenantId, isDeceased: false }
    }),
    prisma.user.count({
      where: { tenantId, isActive: true }
    }),
    getMonthlyWhatsAppUsage(tenantId),
    prisma.tenantUsageStats.findUnique({
      where: { tenantId }
    })
  ]);

  return {
    currentPets,
    currentUsers,
    currentMonthlyWhatsApp,
    currentStorageBytes: Number(usageStats?.storageUsedBytes || 0)
  };
}

/**
 * Get monthly WhatsApp usage for current month
 */
async function getMonthlyWhatsAppUsage(tenantId: string): Promise<number> {
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  
  return await prisma.automationLog.count({
    where: {
      tenantId,
      workflowType: { contains: 'WHATSAPP' },
      createdAt: { gte: thisMonth }
    }
  });
}

/**
 * Check if tenant can add a new pet
 */
export async function checkPetLimit(tenantId: string): Promise<{
  canAdd: boolean;
  current: number;
  limit: number;
  remaining: number;
}> {
  const [limits, usage] = await Promise.all([
    getPlanLimits(tenantId),
    getPlanUsageStats(tenantId)
  ]);
  
  // Handle unlimited pets (EMPRESA plan)
  if (limits.maxPets === Number.MAX_SAFE_INTEGER) {
    return {
      canAdd: true,
      current: usage.currentPets,
      limit: -1, // Represent unlimited as -1 in response
      remaining: -1
    };
  }
  
  const remaining = limits.maxPets - usage.currentPets;
  
  return {
    canAdd: usage.currentPets < limits.maxPets,
    current: usage.currentPets,
    limit: limits.maxPets,
    remaining: Math.max(0, remaining)
  };
}

/**
 * Check if tenant can add a new user
 */
export async function checkUserLimit(tenantId: string): Promise<{
  canAdd: boolean;
  current: number;
  limit: number;
  remaining: number;
}> {
  const [limits, usage] = await Promise.all([
    getPlanLimits(tenantId),
    getPlanUsageStats(tenantId)
  ]);
  
  const remaining = limits.maxUsers - usage.currentUsers;
  
  return {
    canAdd: usage.currentUsers < limits.maxUsers,
    current: usage.currentUsers,
    limit: limits.maxUsers,
    remaining: Math.max(0, remaining)
  };
}

/**
 * Check if tenant can send WhatsApp messages
 */
export async function checkWhatsAppLimit(tenantId: string): Promise<{
  canSend: boolean;
  current: number;
  limit: number;
  remaining: number;
}> {
  const [limits, usage] = await Promise.all([
    getPlanLimits(tenantId),
    getPlanUsageStats(tenantId)
  ]);
  
  // Handle unlimited WhatsApp messages (all B2B plans)
  if (limits.maxMonthlyWhatsApp === Number.MAX_SAFE_INTEGER) {
    return {
      canSend: true,
      current: usage.currentMonthlyWhatsApp,
      limit: -1, // Represent unlimited as -1 in response
      remaining: -1
    };
  }
  
  const remaining = limits.maxMonthlyWhatsApp - usage.currentMonthlyWhatsApp;
  
  return {
    canSend: usage.currentMonthlyWhatsApp < limits.maxMonthlyWhatsApp,
    current: usage.currentMonthlyWhatsApp,
    limit: limits.maxMonthlyWhatsApp,
    remaining: Math.max(0, remaining)
  };
}

/**
 * Check if tenant can add a new cash drawer/register
 */
export async function checkCashRegisterLimit(tenantId: string): Promise<{
  canAdd: boolean;
  current: number;
  limit: number;
  remaining: number;
}> {
  const limits = await getPlanLimits(tenantId);

  // Count current cash drawers for this tenant
  const currentCashRegisters = await prisma.cashDrawer.count({
    where: {
      tenantId,
      status: { not: 'CLOSED' } // Count open/active drawers
    }
  });

  // Handle unlimited cash registers (PROFESIONAL+ plans)
  if (limits.maxCashRegisters === Number.MAX_SAFE_INTEGER) {
    return {
      canAdd: true,
      current: currentCashRegisters,
      limit: -1, // Represent unlimited as -1 in response
      remaining: -1
    };
  }

  const remaining = limits.maxCashRegisters - currentCashRegisters;

  return {
    canAdd: currentCashRegisters < limits.maxCashRegisters,
    current: currentCashRegisters,
    limit: limits.maxCashRegisters,
    remaining: Math.max(0, remaining)
  };
}

/**
 * Check if tenant can add a new location
 * Plan Básico: 1 location only
 * Higher plans: unlimited locations
 */
export async function checkLocationLimit(tenantId: string): Promise<{
  canAdd: boolean;
  current: number;
  limit: number;
  remaining: number;
  requiresUpgrade: boolean;
}> {
  const limits = await getPlanLimits(tenantId);

  // Count current active locations for this tenant
  const currentLocations = await prisma.location.count({
    where: {
      tenantId,
      isActive: true
    }
  });

  // Plan Básico: 1 location, Higher plans (Profesional/Corporativo): unlimited
  const maxLocations = limits.canUseMultiLocation ? Number.MAX_SAFE_INTEGER : 1;
  const canAdd = currentLocations < maxLocations;

  // Handle unlimited locations (Profesional+ plans)
  if (limits.canUseMultiLocation) {
    return {
      canAdd: true,
      current: currentLocations,
      limit: -1, // Represent unlimited as -1 in response
      remaining: -1,
      requiresUpgrade: false
    };
  }

  // Plan Básico: limited to 1 location
  const remaining = Math.max(0, 1 - currentLocations);

  return {
    canAdd,
    current: currentLocations,
    limit: 1,
    remaining,
    requiresUpgrade: !canAdd
  };
}

/**
 * Check if tenant can use a specific feature
 */
export async function checkFeatureAccess(
  tenantId: string,
  feature: 'automations' | 'advancedReports' | 'advancedInventory' | 'multiLocation' | 'multiDoctor' | 'smsReminders' | 'apiAccess' | 'shiftManagement'
): Promise<boolean> {
  const limits = await getPlanLimits(tenantId);

  switch (feature) {
    case 'automations':
      return limits.canUseAutomations;
    case 'advancedReports':
      return limits.canUseAdvancedReports;
    case 'advancedInventory':
      return limits.canUseAdvancedInventory;
    case 'multiLocation':
      return limits.canUseMultiLocation;
    case 'multiDoctor':
      return limits.canUseMultiDoctor;
    case 'smsReminders':
      return limits.canUseSMSReminders;
    case 'apiAccess':
      return limits.canUseApiAccess || false;
    case 'shiftManagement':
      return limits.canUseShiftManagement;
    default:
      return false;
  }
}

/**
 * Check if tenant has shift management access
 */
export async function checkShiftManagementAccess(tenantId: string): Promise<boolean> {
  return checkFeatureAccess(tenantId, 'shiftManagement');
}

/**
 * Get comprehensive plan status for a tenant
 */
export async function getPlanStatus(tenantId: string) {
  const [limits, usage, tenant] = await Promise.all([
    getPlanLimits(tenantId),
    getPlanUsageStats(tenantId),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        tenantSubscription: {
          include: { plan: true }
        }
      }
    })
  ]);

  const serializedTenant = serializeTenant(tenant);
  const plan = serializedTenant?.tenantSubscription?.plan;
  
  return {
    plan: {
      name: plan?.name || 'Plan Básico',
      key: plan?.key || 'STARTER',
      isTrialPeriod: tenant?.isTrialPeriod || true, // Default to trial
      trialEndsAt: tenant?.trialEndsAt
    },
    limits,
    usage,
    percentages: {
      pets: Math.round((usage.currentPets / limits.maxPets) * 100),
      users: Math.round((usage.currentUsers / limits.maxUsers) * 100),
      whatsapp: Math.round((usage.currentMonthlyWhatsApp / limits.maxMonthlyWhatsApp) * 100),
      storage: Math.round((usage.currentStorageBytes / (limits.maxStorageGB * 1024 * 1024 * 1024)) * 100)
    },
    warnings: {
      pets: usage.currentPets >= limits.maxPets * 0.8,
      users: usage.currentUsers >= limits.maxUsers * 0.8,
      whatsapp: usage.currentMonthlyWhatsApp >= limits.maxMonthlyWhatsApp * 0.8,
      storage: usage.currentStorageBytes >= (limits.maxStorageGB * 1024 * 1024 * 1024) * 0.8
    }
  };
}

/**
 * Error classes for plan limit violations
 */
export class PlanLimitError extends Error {
  constructor(
    public readonly limitType: string,
    public readonly current: number,
    public readonly limit: number,
    message?: string
  ) {
    super(message || `${limitType} limit exceeded: ${current}/${limit}`);
    this.name = 'PlanLimitError';
  }
}

/**
 * Validate action against plan limits with detailed error information
 * CRITICAL: Checks trial expiration FIRST before checking quantity limits
 */
export async function validatePlanAction(
  tenantId: string,
  action: 'addPet' | 'addUser' | 'sendWhatsApp' | 'addCashRegister',
  quantity: number = 1
): Promise<void> {
  // CRITICAL FIX: Check trial expiration BEFORE checking quantity limits
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      tenantSubscription: {
        include: { plan: true }
      }
    }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // If trial expired or no active subscription, deny all actions
  if (!hasActiveSubscription(tenant)) {
    throw new PlanLimitError(
      'subscription',
      0,
      0,
      'Tu período de prueba ha expirado. Suscríbete para continuar usando Vetify.'
    );
  }

  switch (action) {
    case 'addPet': {
      const petCheck = await checkPetLimit(tenantId);
      if (!petCheck.canAdd || petCheck.remaining < quantity) {
        throw new PlanLimitError(
          'pets',
          petCheck.current,
          petCheck.limit,
          `No puedes agregar más mascotas. Has alcanzado el límite de ${petCheck.limit} mascotas de tu plan actual.`
        );
      }
      break;
    }
    case 'addUser': {
      const userCheck = await checkUserLimit(tenantId);
      if (!userCheck.canAdd || userCheck.remaining < quantity) {
        throw new PlanLimitError(
          'users',
          userCheck.current,
          userCheck.limit,
          `No puedes agregar más usuarios. Has alcanzado el límite de ${userCheck.limit} usuarios de tu plan actual.`
        );
      }
      break;
    }
    case 'sendWhatsApp': {
      const whatsappCheck = await checkWhatsAppLimit(tenantId);
      if (!whatsappCheck.canSend || whatsappCheck.remaining < quantity) {
        throw new PlanLimitError(
          'whatsapp',
          whatsappCheck.current,
          whatsappCheck.limit,
          `No puedes enviar más mensajes de WhatsApp este mes. Has alcanzado el límite de ${whatsappCheck.limit} mensajes de tu plan actual.`
        );
      }
      break;
    }
    case 'addCashRegister': {
      const cashRegisterCheck = await checkCashRegisterLimit(tenantId);
      if (!cashRegisterCheck.canAdd || cashRegisterCheck.remaining < quantity) {
        throw new PlanLimitError(
          'cashRegisters',
          cashRegisterCheck.current,
          cashRegisterCheck.limit,
          `No puedes agregar más cajas registradoras. Tu plan ${cashRegisterCheck.limit === 1 ? 'solo permite 1 caja. Actualiza a Plan Profesional' : `permite hasta ${cashRegisterCheck.limit} cajas`}.`
        );
      }
      break;
    }
  }
} 