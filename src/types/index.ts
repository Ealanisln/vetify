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
  user: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;
  appointments: Awaited<ReturnType<typeof prisma.appointment.findMany>>;
  medicalHistories: Awaited<ReturnType<typeof prisma.medicalHistory.findMany>>;
};

export type AppointmentWithDetails = NonNullable<Awaited<ReturnType<typeof prisma.appointment.findUnique>>> & {
  pet: NonNullable<Awaited<ReturnType<typeof prisma.pet.findUnique>>> & {
    user: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;
  };
  user: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;
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