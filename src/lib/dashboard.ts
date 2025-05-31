import { prisma } from './prisma';
import { DashboardStats } from '@/types';
import { serializeTenant, serializePets, serializeObject } from './serializers';

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
      include: { customer: true, appointments: true, medicalHistories: true },
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
            customer: true
          }
        }, 
        customer: true,
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

  // Serialize the appointments data to convert Decimal fields to numbers
  const serializedUpcomingAppointments = serializeObject(upcomingAppointments);

  return {
    totalPets,
    totalAppointments,
    recentPets: serializedRecentPets || [],
    upcomingAppointments: serializedUpcomingAppointments || [],
    planLimits: {
      maxPets: plan?.maxPets || 50, // Default FREE plan
      maxUsers: plan?.maxUsers || 1,
      storageGB: plan?.storageGB || 1
    }
  };
} 