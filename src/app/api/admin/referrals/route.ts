import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/super-admin';
import {
  getAllPartners,
  createPartner,
  getReferralStats,
} from '@/lib/referrals/queries';
import { z } from 'zod';

const createPartnerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email invalido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  commissionPercent: z.number().min(1).max(50),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';

    const partners = await getAllPartners();

    if (includeStats) {
      const stats = await getReferralStats();
      return NextResponse.json({ success: true, data: partners, stats });
    }

    return NextResponse.json({ success: true, data: partners });
  } catch (error) {
    console.error('Error listing referral partners:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los partners de referidos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireSuperAdmin();

    const body = await request.json();
    const validationResult = createPartnerSchema.safeParse(body);
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

    const partner = await createPartner({
      ...validationResult.data,
      createdBy: user.id,
    });

    return NextResponse.json({
      success: true,
      data: partner,
      message: 'Partner creado exitosamente',
    });
  } catch (error) {
    console.error('Error creating referral partner:', error);
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Ya existe un partner con ese email' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Error al crear el partner' },
      { status: 500 }
    );
  }
}
