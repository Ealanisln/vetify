import { prisma } from './prisma';
import { DashboardStats } from '@/types';
import { serializePets, serializeObject } from './serializers';
import type { Tenant } from '@prisma/client';

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
    upcomingAppointments
  ] = await Promise.all([
    prisma.pet.count({ where: { tenantId } }),
    prisma.appointment.count({ where: { tenantId } }),
    // Optimized: Only select fields needed for dashboard display
    prisma.pet.findMany({
      where: { tenantId },
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
        dateTime: { gte: new Date() }
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
    planLimits: {
      maxPets: plan?.maxPets || 150, // Default STARTER plan
      maxUsers: plan?.maxUsers || 2,
      storageGB: plan?.storageGB || 2
    }
  };
} 