export const PRICING_CONFIG = {
  // Precios regulares (después del periodo promocional)
  REGULAR: {
    BASIC: {
      monthly: 599,
      yearly: 399, // mensual facturado anualmente
      features: ['300 mascotas', '3 usuarios', 'WhatsApp ilimitado', 'Automatización completa'],
      limits: { pets: 300, users: 3, whatsappMessages: -1 }
    },
    PROFESSIONAL: {
      monthly: 1199,
      yearly: 799,
      features: ['1000 mascotas', '8 usuarios', 'Multi-sucursal', 'Reportes avanzados'],
      limits: { pets: 1000, users: 8, whatsappMessages: -1, multiLocation: true }
    }
  },
  
  // Precios promocionales MVP (primeros 6 meses)
  PROMOTIONAL: {
    BASIC: {
      monthly: 449,
      yearly: 349,
      originalMonthly: 599,
      originalYearly: 399,
      discount: 25
    },
    PROFESSIONAL: {
      monthly: 899,
      yearly: 649,
      originalMonthly: 1199,
      originalYearly: 799,
      discount: 25
    }
  },

  // Control de feature flags
  FEATURES: {
    usePromotionalPricing: true,
    showOriginalPrices: true,
    promotionEndDate: new Date('2025-08-01'),
    enableABTesting: false
  }
};

// Plan completo con todas las características
export const COMPLETE_PLANS = {
  FREE: {
    key: 'FREE',
    name: 'Plan Gratis',
    description: 'Ideal para veterinarios independientes o consultorios muy pequeños.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    badge: 'GRATIS',
    badgeColor: 'bg-vetify-accent-500 text-white',
    popular: false,
    icon: 'Star',
    features: [
      { name: 'Mascotas Activas: 50', included: true, highlight: true },
      { name: 'Usuarios Veterinarios: 1', included: true },
      { name: 'WhatsApp Básico: 50 msg/mes', included: true, highlight: true },
      { name: 'Soporte: Soporte comunidad', included: true },
      { name: 'Expedientes básicos', included: true },
      { name: 'Citas básicas', included: true },
      { name: 'Automatización', included: false },
      { name: 'Inventario', included: false },
      { name: 'Reportes avanzados', included: false },
      { name: 'Multi-sucursal', included: false },
    ],
    limits: {
      maxPets: 50,
      maxUsers: 1,
      maxMonthlyWhatsApp: 50,
      maxStorageGB: 1,
      canUseAutomations: false,
      canUseAdvancedReports: false,
      canUseMultiDoctor: false,
      canUseSMSReminders: false
    },
    cta: 'Comenzar Gratis'
  },
  BASIC: {
    key: 'BASIC',
    name: 'Plan Básico',
    description: 'Ideal para clínicas pequeñas o que recién comienzan.',
    monthlyPrice: PRICING_CONFIG.FEATURES.usePromotionalPricing 
      ? PRICING_CONFIG.PROMOTIONAL.BASIC.monthly 
      : PRICING_CONFIG.REGULAR.BASIC.monthly,
    yearlyPrice: PRICING_CONFIG.FEATURES.usePromotionalPricing 
      ? PRICING_CONFIG.PROMOTIONAL.BASIC.yearly 
      : PRICING_CONFIG.REGULAR.BASIC.yearly,
    originalMonthlyPrice: PRICING_CONFIG.FEATURES.usePromotionalPricing 
      ? PRICING_CONFIG.PROMOTIONAL.BASIC.originalMonthly 
      : undefined,
    originalYearlyPrice: PRICING_CONFIG.FEATURES.usePromotionalPricing 
      ? PRICING_CONFIG.PROMOTIONAL.BASIC.originalYearly 
      : undefined,
    discount: PRICING_CONFIG.FEATURES.usePromotionalPricing 
      ? PRICING_CONFIG.PROMOTIONAL.BASIC.discount 
      : 0,
    badge: 'BÁSICO',
    badgeColor: 'bg-vetify-slate-500 text-white',
    popular: false,
    icon: 'Users',
    features: [
      { name: 'Mascotas Activas: 300', included: true, highlight: true },
      { name: 'Usuarios Veterinarios: 3', included: true },
      { name: 'Automatización: Automatización completa', included: true, highlight: true },
      { name: 'Inventario: Inventario básico', included: true, highlight: true },
      { name: 'WhatsApp ilimitado', included: true },
      { name: 'Expedientes completos', included: true },
      { name: 'Citas avanzadas', included: true },
      { name: 'Soporte por email', included: true },
      { name: 'Reportes básicos', included: true },
      { name: 'Multi-sucursal', included: false },
    ],
    limits: {
      maxPets: 300,
      maxUsers: 3,
      maxMonthlyWhatsApp: -1, // ilimitado
      maxStorageGB: 5,
      canUseAutomations: true,
      canUseAdvancedReports: false,
      canUseMultiDoctor: false,
      canUseSMSReminders: true
    },
    cta: 'Elegir Plan'
  },
  PROFESSIONAL: {
    key: 'PROFESSIONAL',
    name: 'Plan Profesional',
    description: 'Perfecto para clínicas establecidas con múltiples veterinarios.',
    monthlyPrice: PRICING_CONFIG.FEATURES.usePromotionalPricing 
      ? PRICING_CONFIG.PROMOTIONAL.PROFESSIONAL.monthly 
      : PRICING_CONFIG.REGULAR.PROFESSIONAL.monthly,
    yearlyPrice: PRICING_CONFIG.FEATURES.usePromotionalPricing 
      ? PRICING_CONFIG.PROMOTIONAL.PROFESSIONAL.yearly 
      : PRICING_CONFIG.REGULAR.PROFESSIONAL.yearly,
    originalMonthlyPrice: PRICING_CONFIG.FEATURES.usePromotionalPricing 
      ? PRICING_CONFIG.PROMOTIONAL.PROFESSIONAL.originalMonthly 
      : undefined,
    originalYearlyPrice: PRICING_CONFIG.FEATURES.usePromotionalPricing 
      ? PRICING_CONFIG.PROMOTIONAL.PROFESSIONAL.originalYearly 
      : undefined,
    discount: PRICING_CONFIG.FEATURES.usePromotionalPricing 
      ? PRICING_CONFIG.PROMOTIONAL.PROFESSIONAL.discount 
      : 0,
    badge: 'MÁS POPULAR',
    badgeColor: 'bg-gradient-to-r from-vetify-blush-400 to-vetify-blush-500 text-white',
    popular: true,
    icon: 'Building',
    features: [
      { name: 'Mascotas Activas: 1000', included: true, highlight: true },
      { name: 'Usuarios Veterinarios: 8', included: true },
      { name: 'Reportes Avanzados: Reportes avanzados', included: true, highlight: true },
      { name: 'Multi-sucursal: Multi-sucursal', included: true, highlight: true },
      { name: 'Todo del plan Básico', included: true },
      { name: 'Automatización avanzada', included: true },
      { name: 'Inventario completo', included: true },
      { name: 'Analytics y métricas', included: true },
      { name: 'Soporte prioritario', included: true },
      { name: 'Integraciones avanzadas', included: true },
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
    cta: 'Elegir Plan'
  }
};

// Helper functions
export function getCurrentPrice(planKey: 'BASIC' | 'PROFESSIONAL', billingInterval: 'monthly' | 'yearly') {
  const plan = PRICING_CONFIG.FEATURES.usePromotionalPricing 
    ? PRICING_CONFIG.PROMOTIONAL[planKey]
    : PRICING_CONFIG.REGULAR[planKey];
  
  return billingInterval === 'yearly' ? plan.yearly : plan.monthly;
}

export function getOriginalPrice(planKey: 'BASIC' | 'PROFESSIONAL', billingInterval: 'monthly' | 'yearly') {
  if (!PRICING_CONFIG.FEATURES.usePromotionalPricing) return null;
  
  const plan = PRICING_CONFIG.PROMOTIONAL[planKey];
  return billingInterval === 'yearly' ? plan.originalYearly : plan.originalMonthly;
}

export function getDiscount(planKey: 'BASIC' | 'PROFESSIONAL') {
  if (!PRICING_CONFIG.FEATURES.usePromotionalPricing) return 0;
  return PRICING_CONFIG.PROMOTIONAL[planKey].discount;
}

export function isPromotionActive() {
  return PRICING_CONFIG.FEATURES.usePromotionalPricing && 
         new Date() < PRICING_CONFIG.FEATURES.promotionEndDate;
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Types
export interface PricingFeature {
  name: string;
  included: boolean;
  highlight?: boolean;
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