import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/super-admin';
import {
  getPartnerById,
  updatePartner,
  deactivatePartner,
} from '@/lib/referrals/queries';
import { z } from 'zod';

const updatePartnerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  commissionPercent: z.number().min(1).max(50).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const partner = await getPartnerById(id);
    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Partner no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: partner });
  } catch (error) {
    console.error('Error getting referral partner:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el partner' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const body = await request.json();
    const validationResult = updatePartnerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos invalidos',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const partner = await updatePartner(id, validationResult.data);
    return NextResponse.json({
      success: true,
      data: partner,
      message: 'Partner actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error updating referral partner:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el partner' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    await deactivatePartner(id);
    return NextResponse.json({
      success: true,
      message: 'Partner desactivado exitosamente',
    });
  } catch (error) {
    console.error('Error deactivating referral partner:', error);
    return NextResponse.json(
      { success: false, error: 'Error al desactivar el partner' },
      { status: 500 }
    );
  }
}
