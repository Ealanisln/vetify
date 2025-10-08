export const PRICING_CONFIG = {
  // Nueva estructura B2B - 3 planes profesionales sin plan gratuito
  PLANS: {
    PROFESIONAL: {
      monthly: 599,
      yearly: 479,
      features: ['300 mascotas', '3 usuarios', 'Historiales médicos completos', 'Gestión de citas', 'Control de inventario'],
      limits: { pets: 300, users: 3, whatsappMessages: -1 }
    },
    CLINICA: {
      monthly: 999,
      yearly: 799,
      features: ['1,000 mascotas', '8 usuarios', 'Gestión completa', 'Reportes básicos', 'Multi-sucursal'],
      limits: { pets: 1000, users: 8, whatsappMessages: -1, multiLocation: true }
    },
    EMPRESA: {
      monthly: 1799,
      yearly: 1439,
      features: ['Mascotas ilimitadas', '20 usuarios', 'Reportes avanzados', 'Soporte prioritario', 'API personalizada'],
      limits: { pets: -1, users: 20, whatsappMessages: -1, multiLocation: true, apiAccess: true }
    }
  },

  // Control de feature flags
  FEATURES: {
    trialPeriodDays: 30,
    enableTrialForAllPlans: true,
    promotionEndDate: new Date('2025-12-31'),
    enableABTesting: false
  }
};

// Plan completo con todas las características B2B
export const COMPLETE_PLANS = {
  PROFESIONAL: {
    key: 'PROFESIONAL',
    name: 'Plan Profesional',
    description: 'Ideal para clínicas establecidas que buscan profesionalizar su operación.',
    monthlyPrice: 599,
    yearlyPrice: 479,
    badge: '30 DÍAS GRATIS',
    badgeColor: 'bg-green-600 text-white border border-green-700',
    popular: false,
    icon: 'Star',
    features: [
      { name: 'Hasta 300 mascotas', included: true, highlight: true },
      { name: '3 usuarios veterinarios', included: true },
      { name: 'Historiales médicos completos', included: true, highlight: true },
      { name: 'Gestión de citas', included: true },
      { name: 'Control de inventario', included: true },
      { name: 'Registro de ventas', included: true },
      { name: 'Sistema de recordatorios', included: true },
      { name: 'Reportes básicos', included: true },
      { name: 'Soporte profesional', included: true },
      { name: 'Multi-sucursal', included: false },
      { name: 'Reportes avanzados', included: false },
      { name: 'API personalizada', included: false },
    ],
    limits: {
      maxPets: 300,
      maxUsers: 3,
      maxMonthlyWhatsApp: -1, // ilimitado
      maxStorageGB: 5,
      canUseAutomations: true,
      canUseAdvancedReports: false,
      canUseMultiDoctor: true,
      canUseSMSReminders: true
    },
    cta: 'Iniciar prueba gratuita'
  },
  CLINICA: {
    key: 'CLINICA',
    name: 'Plan Clínica',
    description: 'Perfecto para clínicas en crecimiento con múltiples sucursales.',
    monthlyPrice: 999,
    yearlyPrice: 799,
    badge: 'MÁS POPULAR',
    badgeColor: 'bg-orange-500 text-white border border-orange-600',
    popular: true,
    icon: 'Building',
    features: [
      { name: 'Hasta 1,000 mascotas', included: true, highlight: true },
      { name: '8 usuarios veterinarios', included: true },
      { name: 'Todo del plan Profesional', included: true, highlight: true },
      { name: 'Gestión multi-sucursal', included: true, highlight: true },
      { name: 'Control de inventario avanzado', included: true },
      { name: 'Reportes avanzados', included: true },
      { name: 'Gestión de personal', included: true },
      { name: 'Caja registradora', included: true },
      { name: 'Reportes de ventas', included: true },
      { name: 'Soporte prioritario', included: true },
      { name: 'API personalizada', included: false },
    ],
    limits: {
      maxPets: 1000,
      maxUsers: 8,
      maxMonthlyWhatsApp: -1, // ilimitado
      maxStorageGB: 20,
      canUseAutomations: true,
      canUseAdvancedReports: true,
      canUseMultiDoctor: true,
      canUseSMSReminders: true
    },
    cta: 'Iniciar prueba gratuita'
  },
  EMPRESA: {
    key: 'EMPRESA',
    name: 'Plan Empresa',
    description: 'Solución integral para grandes organizaciones veterinarias.',
    monthlyPrice: 1799,
    yearlyPrice: 1439,
    badge: 'EMPRESARIAL',
    badgeColor: 'bg-purple-600 text-white border border-purple-700',
    popular: false,
    icon: 'Users',
    features: [
      { name: 'Mascotas ilimitadas', included: true, highlight: true },
      { name: '20 usuarios veterinarios', included: true },
      { name: 'Todo del plan Clínica', included: true, highlight: true },
      { name: 'API personalizada', included: true, highlight: true },
      { name: 'Múltiples sucursales ilimitadas', included: true },
      { name: 'Reportes empresariales', included: true },
      { name: 'Control total de inventario', included: true },
      { name: 'Analytics avanzados', included: true },
      { name: 'Soporte 24/7', included: true },
      { name: 'Integraciones personalizadas', included: true },
      { name: 'Consultoría especializada', included: true },
    ],
    limits: {
      maxPets: -1, // ilimitado
      maxUsers: 20,
      maxMonthlyWhatsApp: -1, // ilimitado
      maxStorageGB: 100,
      canUseAutomations: true,
      canUseAdvancedReports: true,
      canUseMultiDoctor: true,
      canUseSMSReminders: true
    },
    cta: 'Contactar ventas'
  }
};

// Helper functions
export function getCurrentPrice(planKey: 'PROFESIONAL' | 'CLINICA' | 'EMPRESA', billingInterval: 'monthly' | 'yearly') {
  const plan = PRICING_CONFIG.PLANS[planKey];
  return billingInterval === 'yearly' ? plan.yearly : plan.monthly;
}

export function getDiscountPercentage(planKey: 'PROFESIONAL' | 'CLINICA' | 'EMPRESA') {
  const plan = PRICING_CONFIG.PLANS[planKey];
  const monthlyTotal = plan.monthly * 12;
  const yearlyTotal = plan.yearly * 12;
  return Math.round((1 - yearlyTotal / monthlyTotal) * 100);
}

export function formatPrice(amount: number, currency: string = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(amount);
}

export function getAvailablePlans() {
  return Object.keys(COMPLETE_PLANS);
}

export function getPlanByKey(key: string) {
  return COMPLETE_PLANS[key as keyof typeof COMPLETE_PLANS];
}

export function isTrialActive() {
  return PRICING_CONFIG.FEATURES.enableTrialForAllPlans;
}

export function getPromotionEndDate() {
  return PRICING_CONFIG.FEATURES.promotionEndDate;
}

export interface PricingPlan {
  key: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  originalMonthlyPrice?: number;
  originalYearlyPrice?: number;
  discount?: number;
  badge?: string;
  badgeColor?: string;
  popular?: boolean;
  icon: string;
  features: PricingFeature[];
  limits: {
    maxPets: number;
    maxUsers: number;
    maxMonthlyWhatsApp: number;
    maxStorageGB: number;
    canUseAutomations: boolean;
    canUseAdvancedReports: boolean;
    canUseMultiDoctor: boolean;
    canUseSMSReminders: boolean;
  };
  cta: string;
}

export interface PricingFeature {
  name: string;
  included: boolean;
  highlight?: boolean;
}

// Mapeo de migración para usuarios existentes
export const MIGRATION_MAPPING = {
  'FREE': 'PROFESIONAL',
  'STARTER': 'PROFESIONAL', 
  'STANDARD': 'CLINICA',
  'PROFESSIONAL': 'EMPRESA'
};

// Precios de grandfathering para usuarios existentes (12 meses)
export const GRANDFATHER_PRICING = {
  'FREE': { monthly: 0, yearly: 0 },
  'STARTER': { monthly: 299, yearly: 239 },
  'STANDARD': { monthly: 449, yearly: 349 },
  'PROFESSIONAL': { monthly: 899, yearly: 649 }
}; 