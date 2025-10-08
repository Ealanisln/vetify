import { getPlanLimits, getPlanUsageStats, type PlanLimits, type PlanUsageStats } from './plan-limits';
import { COMPLETE_PLANS } from './pricing-config';

// Extended plan limits that may include API access
interface ExtendedPlanLimits {
  maxPets: number;
  maxUsers: number;
  maxMonthlyWhatsApp: number;
  maxStorageGB: number;
  canUseAutomations: boolean;
  canUseAdvancedReports: boolean;
  canUseMultiDoctor: boolean;
  canUseSMSReminders: boolean;
  canUseApiAccess?: boolean;
}

export interface DowngradeValidation {
  canDowngrade: boolean;
  warnings: DowngradeWarning[];
  blockers: DowngradeBlocker[];
  targetPlan: {
    key: string;
    name: string;
    limits: PlanLimits;
  };
  currentUsage: PlanUsageStats;
}

export interface DowngradeWarning {
  type: 'feature_loss';
  feature: string;
  description: string;
}

export interface DowngradeBlocker {
  type: 'limit_exceeded';
  resource: 'pets' | 'users' | 'storage';
  current: number;
  newLimit: number;
  excess: number;
  message: string;
  suggestion?: string;
}

/**
 * Valida si un tenant puede hacer downgrade a un plan inferior
 */
export async function validateDowngrade(
  tenantId: string, 
  targetPlanKey: string
): Promise<DowngradeValidation> {
  
  // Obtener límites del plan objetivo
  const targetPlanConfig = COMPLETE_PLANS[targetPlanKey.toUpperCase() as keyof typeof COMPLETE_PLANS];
  if (!targetPlanConfig) {
    throw new Error(`Plan objetivo "${targetPlanKey}" no encontrado`);
  }

  // Obtener uso actual y límites del plan objetivo
  const [currentUsage, targetLimits] = await Promise.all([
    getPlanUsageStats(tenantId),
    getTargetPlanLimits(targetPlanConfig)
  ]);

  const warnings: DowngradeWarning[] = [];
  const blockers: DowngradeBlocker[] = [];

  // Validar límites de mascotas
  if (targetLimits.maxPets !== Number.MAX_SAFE_INTEGER && currentUsage.currentPets > targetLimits.maxPets) {
    blockers.push({
      type: 'limit_exceeded',
      resource: 'pets',
      current: currentUsage.currentPets,
      newLimit: targetLimits.maxPets,
      excess: currentUsage.currentPets - targetLimits.maxPets,
      message: `Tienes ${currentUsage.currentPets} mascotas, pero el plan ${targetPlanConfig.name} solo permite ${targetLimits.maxPets}`,
      suggestion: `Debes eliminar ${currentUsage.currentPets - targetLimits.maxPets} mascotas antes del downgrade`
    });
  }

  // Validar límites de usuarios
  if (currentUsage.currentUsers > targetLimits.maxUsers) {
    blockers.push({
      type: 'limit_exceeded',
      resource: 'users',
      current: currentUsage.currentUsers,
      newLimit: targetLimits.maxUsers,
      excess: currentUsage.currentUsers - targetLimits.maxUsers,
      message: `Tienes ${currentUsage.currentUsers} usuarios, pero el plan ${targetPlanConfig.name} solo permite ${targetLimits.maxUsers}`,
      suggestion: `Debes remover ${currentUsage.currentUsers - targetLimits.maxUsers} usuarios antes del downgrade`
    });
  }

  // Validar límites de almacenamiento
  const currentStorageGB = currentUsage.currentStorageBytes / (1024 * 1024 * 1024);
  if (currentStorageGB > targetLimits.maxStorageGB) {
    blockers.push({
      type: 'limit_exceeded',
      resource: 'storage',
      current: Math.round(currentStorageGB * 100) / 100,
      newLimit: targetLimits.maxStorageGB,
      excess: Math.round((currentStorageGB - targetLimits.maxStorageGB) * 100) / 100,
      message: `Usas ${Math.round(currentStorageGB * 100) / 100}GB, pero el plan ${targetPlanConfig.name} solo permite ${targetLimits.maxStorageGB}GB`,
      suggestion: `Debes liberar ${Math.round((currentStorageGB - targetLimits.maxStorageGB) * 100) / 100}GB de almacenamiento`
    });
  }

  // Agregar advertencias sobre pérdida de funcionalidades
  addFeatureLossWarnings(targetPlanConfig, warnings);

  return {
    canDowngrade: blockers.length === 0,
    warnings,
    blockers,
    targetPlan: {
      key: targetPlanConfig.key,
      name: targetPlanConfig.name,
      limits: targetLimits
    },
    currentUsage
  };
}

/**
 * Convierte la configuración del plan a límites del sistema
 */
function getTargetPlanLimits(planConfig: typeof COMPLETE_PLANS[keyof typeof COMPLETE_PLANS]): Promise<PlanLimits> {
  return Promise.resolve({
    maxPets: planConfig.limits.maxPets === -1 ? Number.MAX_SAFE_INTEGER : planConfig.limits.maxPets,
    maxUsers: planConfig.limits.maxUsers,
    maxMonthlyWhatsApp: planConfig.limits.maxMonthlyWhatsApp === -1 ? Number.MAX_SAFE_INTEGER : planConfig.limits.maxMonthlyWhatsApp,
    maxStorageGB: planConfig.limits.maxStorageGB,
    canUseAutomations: planConfig.limits.canUseAutomations,
    canUseAdvancedReports: planConfig.limits.canUseAdvancedReports,
    canUseMultiDoctor: planConfig.limits.canUseMultiDoctor,
    canUseSMSReminders: planConfig.limits.canUseSMSReminders,
    canUseApiAccess: (planConfig.limits as ExtendedPlanLimits).canUseApiAccess ?? false
  });
}

/**
 * Agrega advertencias sobre funcionalidades que se perderán
 */
function addFeatureLossWarnings(
  targetPlan: typeof COMPLETE_PLANS[keyof typeof COMPLETE_PLANS], 
  warnings: DowngradeWarning[]
): void {
  
  // Advertencias específicas por plan
  if (targetPlan.key === 'PROFESIONAL') {
    warnings.push(
      {
        type: 'feature_loss',
        feature: 'Multi-sucursal',
        description: 'Perderás la capacidad de manejar múltiples sucursales'
      },
      {
        type: 'feature_loss', 
        feature: 'Reportes avanzados',
        description: 'Solo tendrás acceso a reportes básicos'
      },
      {
        type: 'feature_loss',
        feature: 'API personalizada',
        description: 'No tendrás acceso a la API para integraciones'
      }
    );
  } else if (targetPlan.key === 'CLINICA') {
    warnings.push({
      type: 'feature_loss',
      feature: 'API personalizada', 
      description: 'No tendrás acceso a la API para integraciones'
    });
  }
}

/**
 * Obtiene sugerencias para resolver blockers de downgrade
 */
export function getDowngradeResolutionSteps(validation: DowngradeValidation): string[] {
  const steps: string[] = [];
  
  validation.blockers.forEach(blocker => {
    if (blocker.suggestion) {
      steps.push(blocker.suggestion);
    }
  });

  if (steps.length > 0) {
    steps.push('Una vez completados estos pasos, podrás proceder con el downgrade');
  }

  return steps;
}

/**
 * Verifica si un plan es un downgrade respecto al plan actual
 */
export function isPlanDowngrade(currentPlanKey: string, targetPlanKey: string): boolean {
  const planHierarchy = ['PROFESIONAL', 'CLINICA', 'EMPRESA'];
  const currentIndex = planHierarchy.indexOf(currentPlanKey.toUpperCase());
  const targetIndex = planHierarchy.indexOf(targetPlanKey.toUpperCase());
  
  return currentIndex > targetIndex;
}
