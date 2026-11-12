import { prisma } from './prisma';
import { DashboardStats } from '@/types';
import { serializePets, serializeObject } from './serializers';
import type { Tenant } from '@prisma/client';
import { getClinicTimeZone } from './clinic-timezone';
import { ACTIVE_OWNER_PETS } from './pets';

// Not shown as "Próximas citas": the visit is not going to happen.
const INACTIVE_APPOINTMENT_STATUSES = ['CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'] as const;

/**
 * Get dashboard statistics for a tenant
 * @param tenantId - The tenant ID
 * @param tenant - Optional tenant object (if already fetched) to avoid duplicate query
 */
export async function getDashboardStats(
  tenantId: string,
  tenant?: Tenant & {
    tenantSubscription?: {
      plan?: { maxPets?: number; maxUsers?: number; storageGB?: number }
    } | null
  }
): Promise<DashboardStats> {
  const [
    totalPets,
    totalAppointments,
    recentPets,
    upcomingAppointments,
    tenantSettings
  ] = await Promise.all([
    prisma.pet.count({ where: { tenantId, ...ACTIVE_OWNER_PETS } }),
    prisma.appointment.count({ where: { tenantId } }),
    // Optimized: Only select fields needed for dashboard display
    prisma.pet.findMany({
      where: { tenantId, ...ACTIVE_OWNER_PETS },
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        dateOfBirth: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        _count: {
          select: {
            appointments: true,
            medicalHistories: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    // Optimized: Reduce nested include depth
    prisma.appointment.findMany({
      where: {
        tenantId,
        dateTime: { gte: new Date() },
        status: { notIn: [...INACTIVE_APPOINTMENT_STATUSES] }
      },
      select: {
        id: true,
        dateTime: true,
        reason: true,
        status: true,
        notes: true,
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            customer: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true
          }
        }
      },
      orderBy: { dateTime: 'asc' },
      take: 5
    }),
    prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: { timezone: true }
    })
  ]);

  // Use provided tenant object if available (avoids duplicate query)
  const plan = tenant?.tenantSubscription?.plan;

  // Serialize the pets data to convert Decimal fields to numbers
  const serializedRecentPets = serializePets(recentPets);

  // Serialize the appointments data to convert Decimal fields to numbers
  const serializedUpcomingAppointments = serializeObject(upcomingAppointments);

  return {
    totalPets,
    totalAppointments,
    recentPets: serializedRecentPets || [],
    upcomingAppointments: serializedUpcomingAppointments || [],
    timeZone: getClinicTimeZone({ countryCode: tenant?.countryCode, tenantSettings }),
    planLimits: {
      maxPets: plan?.maxPets || 150, // Default STARTER plan
      maxUsers: plan?.maxUsers || 2,
      storageGB: plan?.storageGB || 2
    }
  };
} 