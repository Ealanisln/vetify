import { prisma } from '@/lib/prisma';

export type UserWithTenant = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>> & {
  tenant: TenantWithPlan | null;
};

export type TenantWithPlan = NonNullable<Awaited<ReturnType<typeof prisma.tenant.findUnique>>> & {
  tenantSubscription: {
    plan: NonNullable<Awaited<ReturnType<typeof prisma.plan.findUnique>>>;
  } | null;
};

export type PetWithOwner = NonNullable<Awaited<ReturnType<typeof prisma.pet.findUnique>>> & {
  customer: NonNullable<Awaited<ReturnType<typeof prisma.customer.findUnique>>>;
  appointments: Awaited<ReturnType<typeof prisma.appointment.findMany>>;
  medicalHistories: Awaited<ReturnType<typeof prisma.medicalHistory.findMany>>;
};

export type AppointmentWithDetails = NonNullable<Awaited<ReturnType<typeof prisma.appointment.findUnique>>> & {
  pet: NonNullable<Awaited<ReturnType<typeof prisma.pet.findUnique>>> & {
    customer: NonNullable<Awaited<ReturnType<typeof prisma.customer.findUnique>>>;
  };
  customer: NonNullable<Awaited<ReturnType<typeof prisma.customer.findUnique>>>;
  user?: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;
};

export type DashboardStats = {
  totalPets: number;
  totalAppointments: number;
  recentPets: PetWithOwner[];
  upcomingAppointments: AppointmentWithDetails[];
  planLimits: {
    maxPets: number;
    maxUsers: number;
    storageGB: number;
  };
};

// Tipos para el módulo de ventas (POS)
export type SaleWithDetails = NonNullable<Awaited<ReturnType<typeof prisma.sale.findUnique>>> & {
  customer: NonNullable<Awaited<ReturnType<typeof prisma.customer.findUnique>>>;
  pet?: NonNullable<Awaited<ReturnType<typeof prisma.pet.findUnique>>>;
  items: (NonNullable<Awaited<ReturnType<typeof prisma.saleItem.findMany>>>[0] & {
    inventoryItem?: NonNullable<Awaited<ReturnType<typeof prisma.inventoryItem.findUnique>>>;
    service?: NonNullable<Awaited<ReturnType<typeof prisma.service.findUnique>>>;
  })[];
  payments: Awaited<ReturnType<typeof prisma.salePayment.findMany>>;
};

export type SaleItemForm = {
  type: 'product' | 'service';
  itemId?: string;
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
};

export type SaleFormData = {
  customerId: string;
  petId?: string;
  items: SaleItemForm[];
  discount?: number;
  tax?: number;
  paymentMethod: string;
  amountPaid: number;
  notes?: string;
};

// Tipos para inventario
export type InventoryItemWithStock = NonNullable<Awaited<ReturnType<typeof prisma.inventoryItem.findUnique>>> & {
  movements?: Awaited<ReturnType<typeof prisma.inventoryMovement.findMany>>;
  _count?: {
    saleItems: number;
  };
};

export type InventoryFormData = {
  name: string;
  category: string;
  description?: string;
  activeCompound?: string;
  presentation?: string;
  measure?: string;
  brand?: string;
  quantity: number;
  minStock?: number;
  location?: string;
  expirationDate?: string;
  cost?: number;
  price?: number;
  batchNumber?: string;
  specialNotes?: string;
};

// Tipos para historia clínica
export type MedicalHistoryWithDetails = NonNullable<Awaited<ReturnType<typeof prisma.medicalHistory.findUnique>>> & {
  pet: NonNullable<Awaited<ReturnType<typeof prisma.pet.findUnique>>> & {
    customer: NonNullable<Awaited<ReturnType<typeof prisma.customer.findUnique>>>;
  };
  medicalOrder?: NonNullable<Awaited<ReturnType<typeof prisma.medicalOrder.findUnique>>> & {
    prescriptions: (NonNullable<Awaited<ReturnType<typeof prisma.prescription.findMany>>>[0] & {
      product: NonNullable<Awaited<ReturnType<typeof prisma.inventoryItem.findUnique>>>;
    })[];
  };
};

export type MedicalHistoryFormData = {
  petId: string;
  visitDate: string;
  reasonForVisit: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  prescriptions?: {
    productId: string;
    quantity: number;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  }[];
};

// Tipos de búsqueda para POS
export type CustomerSearchResult = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  pets: {
    id: string;
    name: string;
    species: string;
    breed: string;
  }[];
};

export type ProductSearchResult = {
  id: string;
  name: string;
  category: string;
  price?: number;
  quantity: number;
  type: 'product';
} | {
  id: string;
  name: string;
  category: string;
  price: number;
  duration?: number;
  type: 'service';
}; 