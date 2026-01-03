import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/super-admin';
import {
  getPromotionById,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
  getPromotionByCode,
} from '@/lib/promotions/queries';
import { clearPromotionCache } from '@/lib/pricing-config';
import { z } from 'zod';

// Validation schema for updating a promotion
const updatePromotionSchema = z.object({
  name: z.string().min(1).optional(),
  code: z
    .string()
    .regex(/^[A-Z0-9_-]+$/, 'El código solo puede contener letras mayúsculas, números, guiones y guiones bajos')
    .optional(),
  isActive: z.boolean().optional(),
  discountPercent: z.number().int().min(1).max(100).optional(),
  durationMonths: z.number().int().min(1).max(24).optional(),
  startDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  endDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  stripeCouponId: z.string().optional().nullable(),
  badgeText: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  applicablePlans: z.array(z.string()).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - Get a single promotion by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin();

    const { id } = await params;
    const promotion = await getPromotionById(id);

    if (!promotion) {
      return NextResponse.json(
        { success: false, error: 'Promoción no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: promotion,
    });
  } catch (error) {
    console.error('Error getting promotion:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la promoción' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update a promotion
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await requireSuperAdmin();

    const { id } = await params;
    const body = await request.json();

    // Check if promotion exists
    const existingPromotion = await getPromotionById(id);
    if (!existingPromotion) {
      return NextResponse.json(
        { success: false, error: 'Promoción no encontrada' },
        { status: 404 }
      );
    }

    // Handle toggle action
    if (body.action === 'toggle') {
      const promotion = await togglePromotionStatus(id);
      // Clear promotion cache so changes are visible immediately
      clearPromotionCache();
      return NextResponse.json({
        success: true,
        data: promotion,
        message: promotion.isActive
          ? 'Promoción activada exitosamente'
          : 'Promoción desactivada exitosamente',
      });
    }

    // Validate input
    const validationResult = updatePromotionSchema.safeParse(body);
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

    // If changing code, check it doesn't conflict with another promotion
    if (data.code && data.code !== existingPromotion.code) {
      const codeExists = await getPromotionByCode(data.code);
      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Ya existe una promoción con ese código' },
          { status: 400 }
        );
      }
    }

    // Validate date range if both dates provided
    const startDate = data.startDate || existingPromotion.startDate;
    const endDate = data.endDate || existingPromotion.endDate;
    if (startDate >= endDate) {
      return NextResponse.json(
        { success: false, error: 'La fecha de inicio debe ser anterior a la fecha de fin' },
        { status: 400 }
      );
    }

    // Update promotion
    const promotion = await updatePromotion(id, {
      ...data,
      createdBy: user.id, // Track who made the update
    });

    // Clear promotion cache so changes are visible immediately
    clearPromotionCache();

    return NextResponse.json({
      success: true,
      data: promotion,
      message: 'Promoción actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error updating promotion:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar la promoción' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a promotion
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin();

    const { id } = await params;

    // Check if promotion exists
    const existingPromotion = await getPromotionById(id);
    if (!existingPromotion) {
      return NextResponse.json(
        { success: false, error: 'Promoción no encontrada' },
        { status: 404 }
      );
    }

    // Prevent deleting active promotions
    if (existingPromotion.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se puede eliminar una promoción activa. Desactívala primero.',
        },
        { status: 400 }
      );
    }

    await deletePromotion(id);

    // Clear promotion cache
    clearPromotionCache();

    return NextResponse.json({
      success: true,
      message: 'Promoción eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la promoción' },
      { status: 500 }
    );
  }
}
