import { prisma } from '@/lib/prisma';
import { serializeTenant } from '@/lib/serializers';

interface PlanFeatures {
  whatsappMessages?: number;
  automations?: boolean;
  advancedReports?: boolean;
  multiDoctor?: boolean;
  smsReminders?: boolean;
}

export interface PlanLimits {
  maxPets: number;
  maxUsers: number;
  maxMonthlyWhatsApp: number;
  maxStorageGB: number;
  canUseAutomations: boolean;
  canUseAdvancedReports: boolean;
  canUseMultiDoctor: boolean;
  canUseSMSReminders: boolean;
}

export interface PlanUsageStats {
  currentPets: number;
  currentUsers: number;
  currentMonthlyWhatsApp: number;
  currentStorageBytes: number;
}

/**
 * Get plan limits for a tenant
 * Falls back to FREE plan limits if no subscription exists
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

  // If no tenant subscription exists, return FREE plan limits
  if (!tenant?.tenantSubscription?.plan) {
    return {
      maxPets: 50,
      maxUsers: 1,
      maxMonthlyWhatsApp: 50, // Updated from 25 to 50
      maxStorageGB: 1,
      canUseAutomations: false,
      canUseAdvancedReports: false,
      canUseMultiDoctor: false,
      canUseSMSReminders: false
    };
  }

  const plan = tenant.tenantSubscription.plan;
  const features = plan.features as PlanFeatures;
  
  return {
    maxPets: plan.maxPets,
    maxUsers: plan.maxUsers,
    maxMonthlyWhatsApp: features?.whatsappMessages || 0,
    maxStorageGB: plan.storageGB,
    canUseAutomations: features?.automations || false,
    canUseAdvancedReports: features?.advancedReports || false,
    canUseMultiDoctor: features?.multiDoctor || false,
    canUseSMSReminders: features?.smsReminders || false
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
  
  const remaining = limits.maxMonthlyWhatsApp - usage.currentMonthlyWhatsApp;
  
  return {
    canSend: usage.currentMonthlyWhatsApp < limits.maxMonthlyWhatsApp,
    current: usage.currentMonthlyWhatsApp,
    limit: limits.maxMonthlyWhatsApp,
    remaining: Math.max(0, remaining)
  };
}

/**
 * Check if tenant can use a specific feature
 */
export async function checkFeatureAccess(
  tenantId: string, 
  feature: 'automations' | 'advancedReports' | 'multiDoctor' | 'smsReminders'
): Promise<boolean> {
  const limits = await getPlanLimits(tenantId);
  
  switch (feature) {
    case 'automations':
      return limits.canUseAutomations;
    case 'advancedReports':
      return limits.canUseAdvancedReports;
    case 'multiDoctor':
      return limits.canUseMultiDoctor;
    case 'smsReminders':
      return limits.canUseSMSReminders;
    default:
      return false;
  }
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
      name: plan?.name || 'Plan Gratuito',
      key: plan?.key || 'FREE',
      isTrialPeriod: tenant?.isTrialPeriod || false,
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
 */
export async function validatePlanAction(
  tenantId: string,
  action: 'addPet' | 'addUser' | 'sendWhatsApp',
  quantity: number = 1
): Promise<void> {
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
  }
} 