// Tipos B2B
type PlanType = 'PROFESIONAL' | 'CLINICA' | 'EMPRESA';

interface PlanFeature {
  name: string;
  description: string;
  profesional: string | number | boolean;
  clinica: string | number | boolean;
  empresa: string | number | boolean;
}

interface PlanPricing {
  monthly: number;
  annual: number;
}

export interface Plan {
  type: PlanType;
  name: string;
  description: string;
  pricing: PlanPricing;
  features: PlanFeature[];
  recommended?: boolean;
}

// Datos de planes B2B
const planFeatures: PlanFeature[] = [
  {
    name: 'Usuarios Staff',
    description: 'Número de usuarios de staff que pueden acceder al sistema',
    profesional: 3,
    clinica: 8,
    empresa: 20
  },
  {
    name: 'Mascotas Activas',
    description: 'Número máximo de mascotas activas en el sistema',
    profesional: 300,
    clinica: 1000,
    empresa: 'Ilimitado'
  },
  {
    name: 'WhatsApp',
    description: 'Mensajes de WhatsApp para comunicación con clientes',
    profesional: 'Ilimitado',
    clinica: 'Ilimitado',
    empresa: 'Ilimitado'
  },
  {
    name: 'Automatizaciones',
    description: 'Automatización de recordatorios y procesos',
    profesional: 'Básica',
    clinica: 'Completa',
    empresa: 'Avanzada'
  },
  {
    name: 'Reportes',
    description: 'Reportes de operaciones y finanzas',
    profesional: 'Básicos',
    clinica: 'Avanzados',
    empresa: 'Avanzados'
  },
  {
    name: 'Multi-Doctor',
    description: 'Gestión de múltiples doctores y staff',
    profesional: true,
    clinica: true,
    empresa: true
  },
  {
    name: 'Recordatorios SMS',
    description: 'Recordatorios por SMS para clientes',
    profesional: true,
    clinica: true,
    empresa: true
  },
  {
    name: 'Multi-sucursal',
    description: 'Gestión de múltiples sucursales',
    profesional: false,
    clinica: true,
    empresa: true
  },
  {
    name: 'API Access',
    description: 'Acceso a API para integraciones personalizadas',
    profesional: false,
    clinica: false,
    empresa: true
  },
  {
    name: 'Almacenamiento',
    description: 'Espacio para archivos e imágenes',
    profesional: '5 GB',
    clinica: '20 GB',
    empresa: '100 GB'
  },
  {
    name: 'Soporte Técnico',
    description: 'Asistencia técnica y atención al cliente',
    profesional: 'Email',
    clinica: 'Email + Chat',
    empresa: '24/7'
  }
];

const planPricing: Record<PlanType, PlanPricing> = {
  'PROFESIONAL': {
    monthly: 599,
    annual: 479,
  },
  'CLINICA': {
    monthly: 999,
    annual: 799,
  },
  'EMPRESA': {
    monthly: 1799,
    annual: 1439,
  }
};

export const plans: Plan[] = [
  {
    type: 'PROFESIONAL',
    name: 'Plan Profesional',
    description: 'Ideal para clínicas establecidas que buscan profesionalizar su operación',
    pricing: planPricing['PROFESIONAL'],
    features: planFeatures,
  },
  {
    type: 'CLINICA',
    name: 'Plan Clínica',
    description: 'Perfecto para clínicas en crecimiento con múltiples sucursales',
    pricing: planPricing['CLINICA'],
    features: planFeatures,
    recommended: true
  },
  {
    type: 'EMPRESA',
    name: 'Plan Empresa',
    description: 'Solución integral para grandes organizaciones veterinarias',
    pricing: planPricing['EMPRESA'],
    features: planFeatures,
  }
];