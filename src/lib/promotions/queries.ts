import { prisma } from '@/lib/prisma';
import type { SystemPromotion, Prisma } from '@prisma/client';

export type PromotionCreateInput = Omit<
  Prisma.SystemPromotionCreateInput,
  'id' | 'createdAt' | 'updatedAt'
>;

export type PromotionUpdateInput = Partial<PromotionCreateInput>;

/**
 * Get the currently active promotion (only one can be active at a time)
 * Checks both isActive flag and date range
 */
export async function getActivePromotion(): Promise<SystemPromotion | null> {
  const now = new Date();

  return prisma.systemPromotion.findFirst({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get all promotions for admin listing
 */
export async function getAllPromotions(): Promise<SystemPromotion[]> {
  return prisma.systemPromotion.findMany({
    orderBy: [
      { isActive: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

/**
 * Get a single promotion by ID
 */
export async function getPromotionById(id: string): Promise<SystemPromotion | null> {
  return prisma.systemPromotion.findUnique({
    where: { id },
  });
}

/**
 * Get a promotion by code
 */
export async function getPromotionByCode(code: string): Promise<SystemPromotion | null> {
  return prisma.systemPromotion.findUnique({
    where: { code },
  });
}

/**
 * Create a new promotion
 * If isActive is true, deactivates all other promotions first
 */
export async function createPromotion(
  data: PromotionCreateInput
): Promise<SystemPromotion> {
  // If this promotion should be active, deactivate others first
  if (data.isActive) {
    await prisma.systemPromotion.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  }

  return prisma.systemPromotion.create({
    data,
  });
}

/**
 * Update an existing promotion
 * If setting isActive to true, deactivates all other promotions first
 */
export async function updatePromotion(
  id: string,
  data: PromotionUpdateInput
): Promise<SystemPromotion> {
  // If activating this promotion, deactivate others first
  if (data.isActive === true) {
    await prisma.systemPromotion.updateMany({
      where: {
        isActive: true,
        id: { not: id },
      },
      data: { isActive: false },
    });
  }

  return prisma.systemPromotion.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

/**
 * Delete a promotion
 */
export async function deletePromotion(id: string): Promise<SystemPromotion> {
  return prisma.systemPromotion.delete({
    where: { id },
  });
}

/**
 * Activate a specific promotion (deactivates all others)
 */
export async function activatePromotion(id: string): Promise<SystemPromotion> {
  // Deactivate all other promotions
  await prisma.systemPromotion.updateMany({
    where: {
      isActive: true,
      id: { not: id },
    },
    data: { isActive: false },
  });

  // Activate the specified promotion
  return prisma.systemPromotion.update({
    where: { id },
    data: {
      isActive: true,
      updatedAt: new Date(),
    },
  });
}

/**
 * Deactivate a specific promotion
 */
export async function deactivatePromotion(id: string): Promise<SystemPromotion> {
  return prisma.systemPromotion.update({
    where: { id },
    data: {
      isActive: false,
      updatedAt: new Date(),
    },
  });
}

/**
 * Toggle promotion active status
 */
export async function togglePromotionStatus(id: string): Promise<SystemPromotion> {
  const promotion = await getPromotionById(id);

  if (!promotion) {
    throw new Error('Promotion not found');
  }

  if (promotion.isActive) {
    return deactivatePromotion(id);
  } else {
    return activatePromotion(id);
  }
}

/**
 * Check if a promotion is currently valid (within date range)
 */
export function isPromotionValid(promotion: SystemPromotion): boolean {
  const now = new Date();
  return promotion.isActive &&
         promotion.startDate <= now &&
         promotion.endDate >= now;
}

/**
 * Get promotion statistics for admin dashboard
 */
export async function getPromotionStats(): Promise<{
  total: number;
  active: number;
  expired: number;
  upcoming: number;
}> {
  const now = new Date();

  const [total, active, expired, upcoming] = await Promise.all([
    prisma.systemPromotion.count(),
    prisma.systemPromotion.count({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    }),
    prisma.systemPromotion.count({
      where: {
        endDate: { lt: now },
      },
    }),
    prisma.systemPromotion.count({
      where: {
        startDate: { gt: now },
      },
    }),
  ]);

  return { total, active, expired, upcoming };
}
