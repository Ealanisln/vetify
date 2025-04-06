// Tipos
type PlanType = 'BASIC' | 'STANDARD';

interface PlanFeature {
  name: string;
  description: string;
  basic: string | number | boolean;
  standard: string | number | boolean;
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

// Datos de planes
const planFeatures: PlanFeature[] = [
  {
    name: 'Usuarios Staff',
    description: 'Número de usuarios de staff que pueden acceder al sistema',
    basic: 2,
    standard: 5
  },
  {
    name: 'Mascotas Activas',
    description: 'Número máximo de mascotas activas en el sistema',
    basic: 500,
    standard: 2000
  },
  {
    name: 'Historial Médico',
    description: 'Registro de historial médico de mascotas',
    basic: true,
    standard: true
  },
  {
    name: 'Administración de Inventario',
    description: 'Control de productos, medicamentos y servicios',
    basic: 'Básico',
    standard: 'Completo'
  },
  {
    name: 'Recordatorios',
    description: 'Recordatorios para clientes sobre citas, vacunas, etc.',
    basic: 'Email',
    standard: 'Email + 50 SMS'
  },
  {
    name: 'Gestión de Pagos',
    description: 'Procesamiento de pagos y facturación',
    basic: true,
    standard: true
  },
  {
    name: 'Agenda Multi-Doctor',
    description: 'Agendamiento para múltiples doctores/staff',
    basic: false,
    standard: true
  },
  {
    name: 'Reportes',
    description: 'Reportes de operaciones y finanzas',
    basic: 'Básicos',
    standard: 'Avanzados'
  },
  {
    name: 'Almacenamiento',
    description: 'Espacio para archivos e imágenes',
    basic: '1 GB',
    standard: '5 GB'
  },
  {
    name: 'Soporte Técnico',
    description: 'Asistencia técnica y atención al cliente',
    basic: 'Email',
    standard: 'Email + Chat'
  }
];

const planPricing: Record<PlanType, PlanPricing> = {
  'BASIC': {
    monthly: 349,
    annual: 279,
  },
  'STANDARD': {
    monthly: 649,
    annual: 519,
  }
};

const plans: Plan[] = [
  {
    type: 'BASIC',
    name: 'Básico',
    description: 'Perfecto para clínicas pequeñas o que están comenzando',
    pricing: planPricing['BASIC'],
    features: planFeatures,
  },
  {
    type: 'STANDARD',
    name: 'Estándar',
    description: 'Ideal para clínicas en crecimiento con múltiples servicios',
    pricing: planPricing['STANDARD'],
    features: planFeatures,
    recommended: true
  }
];