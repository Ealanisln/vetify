/**
 * Seed script for initial promotion data
 * Run with: pnpm tsx scripts/seed-promotions.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPromotions() {
  console.log('Seeding initial promotion data...');

  // Check if promotion already exists
  const existingPromo = await prisma.systemPromotion.findUnique({
    where: { code: 'LAUNCH_2025' },
  });

  if (existingPromo) {
    console.log('Promotion LAUNCH_2025 already exists, skipping seed.');
    return;
  }

  // Seed the initial launch promotion from hardcoded config
  // This is intentionally set as inactive since the original promotion expired Dec 31, 2025
  const promotion = await prisma.systemPromotion.create({
    data: {
      name: 'Oferta de Lanzamiento 2025',
      code: 'LAUNCH_2025',
      isActive: false, // Inactive since it has expired
      discountPercent: 25,
      durationMonths: 6,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      stripeCouponId: 'u62SRvcw', // Live Stripe coupon
      badgeText: '🎉 Oferta de Lanzamiento',
      description: '25% de descuento los primeros 6 meses',
      applicablePlans: ['BASICO', 'PROFESIONAL'],
    },
  });

  console.log('Created promotion:', promotion.name);
  console.log('Promotion ID:', promotion.id);
  console.log('');
  console.log('Note: The promotion is set as INACTIVE since the original promo expired.');
  console.log('Use the admin panel at /admin/promotions to create new promotions.');
}

async function main() {
  try {
    await seedPromotions();
    console.log('\nSeed completed successfully!');
  } catch (error) {
    console.error('Error seeding promotions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
