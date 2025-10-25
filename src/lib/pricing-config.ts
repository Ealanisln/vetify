export const PRICING_CONFIG = {
  // Nueva estructura B2B - 3 planes profesionales sincronizados con Stripe
  PLANS: {
    BASICO: {
      monthly: 599,
      yearly: 4788,
      stripeProductId: 'prod_TGDXKD2ksDenYm',
      stripePriceMonthly: 'price_1SJh6nPwxz1bHxlHQ15mCTij',
      stripePriceYearly: 'price_1SJh6oPwxz1bHxlH1gXSEuSF',
      features: ['Funcionalidades esenciales', 'Gestión básica', 'Historiales médicos', 'Gestión de citas', 'Soporte profesional'],
      limits: { pets: 500, users: 3, whatsappMessages: -1 }
    },
    PROFESIONAL: {
      monthly: 1199,
      yearly: 9588,
      stripeProductId: 'prod_TGDXLJxNFGsF9X',
      stripePriceMonthly: 'price_1SJh6oPwxz1bHxlHkJudNKvL',
      stripePriceYearly: 'price_1SJh6pPwxz1bHxlHcMip7KIU',
      features: ['Funcionalidades avanzadas', 'Multi-sucursal', 'Reportes avanzados', 'Soporte prioritario', 'Gestión completa'],
      limits: { pets: 2000, users: 8, whatsappMessages: -1, multiLocation: true }
    },
    CORPORATIVO: {
      monthly: 5000,
      yearly: 60000,
      stripeProductId: 'prod_TGDXxUkqhta3cp',
      stripePriceMonthly: 'price_1SJh6pPwxz1bHxlHY9cnLnPw',
      stripePriceYearly: 'price_1SJh6qPwxz1bHxlHd3ud2WZ3',
      features: ['Mascotas ilimitadas', '20 usuarios', 'API personalizada', 'Soporte 24/7', 'Consultoría especializada'],
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
  BASICO: {
    key: 'BASICO',
    name: 'Plan Básico',
    description: 'Ideal para clínicas pequeñas que están comenzando.',
    monthlyPrice: 599,
    yearlyPrice: 4788,  // $399/mes x 12 meses
    badge: '30 DÍAS GRATIS',
    badgeColor: 'bg-green-600 text-white border border-green-700',
    popular: false,
    icon: 'Star',
    features: [
      { name: 'Hasta 500 mascotas', included: true, highlight: true },
      { name: '3 usuarios veterinarios', included: true },
      { name: 'Historiales médicos completos', included: true, highlight: true },
      { name: 'Gestión de citas', included: true },
      { name: 'Control de inventario básico', included: true },
      { name: 'Punto de venta básico', included: true },
      { name: 'Caja registradora (1 caja)', included: true },
      { name: 'Registro de ventas', included: true },
      { name: 'Sistema de recordatorios', included: true },
      { name: 'Reportes básicos', included: true },
      { name: 'Soporte profesional', included: true },
      { name: 'Multi-sucursal', included: false },
      { name: 'Inventario avanzado', included: false },
      { name: 'Reportes avanzados', included: false },
      { name: 'API personalizada', included: false },
    ],
    limits: {
      maxPets: 500,
      maxUsers: 3,
      maxMonthlyWhatsApp: -1,
      maxStorageGB: 5,
      maxCashRegisters: 1,
      // FUTURE FEATURE: Automatizaciones - n8n integration not yet implemented
      // canUseAutomations: true,
      canUseAdvancedReports: false,
      canUseAdvancedInventory: false,
      canUseMultiLocation: false,
      canUseMultiDoctor: true,
      canUseSMSReminders: true
    },
    cta: 'Iniciar prueba gratuita'
  },
  PROFESIONAL: {
    key: 'PROFESIONAL',
    name: 'Plan Profesional',
    description: 'Perfecto para clínicas establecidas con múltiples sucursales.',
    monthlyPrice: 1199,
    yearlyPrice: 9588,  // $799/mes x 12 meses
    badge: 'MÁS POPULAR',
    badgeColor: 'bg-orange-500 text-white border border-orange-600',
    popular: true,
    icon: 'Building',
    features: [
      { name: 'Hasta 2,000 mascotas', included: true, highlight: true },
      { name: '8 usuarios veterinarios', included: true },
      { name: 'Todo del plan Básico', included: true, highlight: true },
      { name: 'Gestión multi-sucursal', included: true, highlight: true },
      { name: 'Múltiples cajas por sucursal', included: true },
      { name: 'Control de inventario avanzado', included: true },
      { name: 'Reportes avanzados', included: true },
      { name: 'Reportes de caja avanzados', included: true },
      { name: 'Gestión de personal', included: true },
      { name: 'Gestión de turnos de caja', included: true },
      { name: 'Reportes de ventas avanzados', included: true },
      { name: 'Soporte prioritario', included: true },
      { name: 'API personalizada', included: false },
    ],
    limits: {
      maxPets: 2000,
      maxUsers: 8,
      maxMonthlyWhatsApp: -1,
      maxStorageGB: 20,
      maxCashRegisters: -1, // Ilimitado
      // FUTURE FEATURE: Automatizaciones - n8n integration not yet implemented
      // canUseAutomations: true,
      canUseAdvancedReports: true,
      canUseAdvancedInventory: true,
      canUseMultiLocation: true,
      canUseMultiDoctor: true,
      canUseSMSReminders: true
    },
    cta: 'Iniciar prueba gratuita'
  },
  CORPORATIVO: {
    key: 'CORPORATIVO',
    name: 'Plan Corporativo',
    description: 'Solución personalizada para grandes organizaciones.',
    monthlyPrice: 0,      // Cotización personalizada - no se muestra precio
    yearlyPrice: 0,       // Cotización personalizada - no se muestra precio
    badge: 'EMPRESARIAL',
    badgeColor: 'bg-purple-600 text-white border border-purple-700',
    popular: false,
    icon: 'Users',
    features: [
      { name: 'Mascotas ilimitadas', included: true, highlight: true },
      { name: '20 usuarios veterinarios', included: true },
      { name: 'Todo del plan Profesional', included: true, highlight: true },
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
      maxPets: -1,
      maxUsers: 20,
      maxMonthlyWhatsApp: -1,
      maxStorageGB: 100,
      maxCashRegisters: -1, // Ilimitado
      // FUTURE FEATURE: Automatizaciones - n8n integration not yet implemented
      // canUseAutomations: true,
      canUseAdvancedReports: true,
      canUseAdvancedInventory: true,
      canUseMultiLocation: true,
      canUseMultiDoctor: true,
      canUseSMSReminders: true,
      canUseApiAccess: true
    },
    cta: 'Contactar Ventas'
  }
};

// Helper functions
export function getCurrentPrice(planKey: 'BASICO' | 'PROFESIONAL' | 'CORPORATIVO', billingInterval: 'monthly' | 'yearly') {
  const plan = PRICING_CONFIG.PLANS[planKey];
  return billingInterval === 'yearly' ? plan.yearly : plan.monthly;
}

export function getDiscountPercentage(planKey: 'BASICO' | 'PROFESIONAL' | 'CORPORATIVO') {
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
    maxCashRegisters: number;
    // FUTURE FEATURE: Automatizaciones - n8n integration not yet implemented
    // canUseAutomations?: boolean;
    canUseAdvancedReports: boolean;
    canUseAdvancedInventory: boolean;
    canUseMultiLocation: boolean;
    canUseMultiDoctor: boolean;
    canUseSMSReminders: boolean;
    canUseApiAccess?: boolean;
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
  'FREE': 'BASICO',
  'STARTER': 'BASICO',
  'STANDARD': 'PROFESIONAL',
  'PROFESSIONAL': 'PROFESIONAL',
  'CLINICA': 'PROFESIONAL',
  'EMPRESA': 'CORPORATIVO'
};

// Precios de grandfathering para usuarios existentes (12 meses)
export const GRANDFATHER_PRICING = {
  'FREE': { monthly: 0, yearly: 0 },
  'STARTER': { monthly: 299, yearly: 239 },
  'STANDARD': { monthly: 449, yearly: 349 },
  'PROFESSIONAL': { monthly: 899, yearly: 649 }
}; 