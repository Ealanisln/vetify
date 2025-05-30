import { prisma } from './prisma';
import { DashboardStats } from '@/types';
import { serializeTenant, serializePets } from './serializers';

export async function getDashboardStats(tenantId: string): Promise<DashboardStats> {
  const [
    totalPets,
    totalAppointments,
    recentPets,
    upcomingAppointments,
    tenant
  ] = await Promise.all([
    prisma.pet.count({ where: { tenantId } }),
    prisma.appointment.count({ where: { tenantId } }),
    prisma.pet.findMany({
      where: { tenantId },
      include: { user: true, appointments: true, medicalHistories: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.appointment.findMany({
      where: { 
        tenantId,
        dateTime: { gte: new Date() }
      },
      include: { 
        pet: {
          include: {
            user: true
          }
        }, 
        user: true 
      },
      orderBy: { dateTime: 'asc' },
      take: 5
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { 
        tenantSubscription: { 
          include: { plan: true } 
        } 
      }
    })
  ]);

  // Serialize the tenant data to convert Decimal fields to numbers
  const serializedTenant = serializeTenant(tenant);
  const plan = serializedTenant?.tenantSubscription?.plan;

  // Serialize the pets data to convert Decimal fields to numbers
  const serializedRecentPets = serializePets(recentPets);

  return {
    totalPets,
    totalAppointments,
    recentPets: serializedRecentPets || [],
    upcomingAppointments,
    planLimits: {
      maxPets: plan?.maxPets || 50, // Default FREE plan
      maxUsers: plan?.maxUsers || 1,
      storageGB: plan?.storageGB || 1
    }
  };
} 