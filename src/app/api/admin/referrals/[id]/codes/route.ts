import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/super-admin';
import {
  getPartnerCodes,
  createReferralCode,
} from '@/lib/referrals/queries';
import { z } from 'zod';

const createCodeSchema = z.object({
  code: z
    .string()
    .min(1, 'El codigo es requerido')
    .regex(/^[A-Za-z0-9_-]+$/, 'El codigo solo puede contener letras, numeros, guiones y guiones bajos'),
  discountPercent: z.number().int().min(1).max(100).optional(),
  discountMonths: z.number().int().min(1).max(12).optional(),
  stripeCouponId: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const codes = await getPartnerCodes(id);
    return NextResponse.json({ success: true, data: codes });
  } catch (error) {
    console.error('Error listing referral codes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los codigos' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const body = await request.json();
    const validationResult = createCodeSchema.safeParse(body);
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

    const code = await createReferralCode({
      ...validationResult.data,
      partnerId: id,
    });

    return NextResponse.json({
      success: true,
      data: code,
      message: 'Codigo creado exitosamente',
    });
  } catch (error) {
    console.error('Error creating referral code:', error);
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Ya existe un codigo con ese nombre' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Error al crear el codigo' },
      { status: 500 }
    );
  }
}
