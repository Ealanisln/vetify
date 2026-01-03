import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/super-admin';
import {
  getAllPromotions,
  createPromotion,
  getPromotionStats,
  getPromotionByCode,
} from '@/lib/promotions/queries';
import { clearPromotionCache } from '@/lib/pricing-config';
import { z } from 'zod';

// Validation schema for creating a promotion
const createPromotionSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z
    .string()
    .min(1, 'El código es requerido')
    .regex(/^[A-Z0-9_-]+$/, 'El código solo puede contener letras mayúsculas, números, guiones y guiones bajos'),
  isActive: z.boolean().default(false),
  discountPercent: z.number().int().min(1).max(100),
  durationMonths: z.number().int().min(1).max(24),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  stripeCouponId: z.string().optional().nullable(),
  badgeText: z.string().min(1, 'El texto del badge es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  applicablePlans: z.array(z.string()).default([]),
});

/**
 * GET - List all promotions with optional stats
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';

    const promotions = await getAllPromotions();

    if (includeStats) {
      const stats = await getPromotionStats();
      return NextResponse.json({
        success: true,
        data: promotions,
        stats,
      });
    }

    return NextResponse.json({
      success: true,
      data: promotions,
    });
  } catch (error) {
    console.error('Error listing promotions:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener las promociones' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new promotion
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireSuperAdmin();

    const body = await request.json();

    // Validate input
    const validationResult = createPromotionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if code already exists
    const existingPromotion = await getPromotionByCode(data.code);
    if (existingPromotion) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una promoción con ese código' },
        { status: 400 }
      );
    }

    // Validate date range
    if (data.startDate >= data.endDate) {
      return NextResponse.json(
        { success: false, error: 'La fecha de inicio debe ser anterior a la fecha de fin' },
        { status: 400 }
      );
    }

    // Create promotion
    const promotion = await createPromotion({
      ...data,
      createdBy: user.id,
    });

    // Clear promotion cache so new promotion is visible immediately
    clearPromotionCache();

    return NextResponse.json({
      success: true,
      data: promotion,
      message: 'Promoción creada exitosamente',
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la promoción' },
      { status: 500 }
    );
  }
}
