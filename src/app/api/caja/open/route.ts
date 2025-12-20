import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { checkCashRegisterLimit } from '../../../../lib/plan-limits';
import { z } from 'zod';

const openDrawerSchema = z.object({
  tenantId: z.string(),
  locationId: z.string().optional(),
  initialAmount: z.number().min(0)
});

export async function POST(request: Request) {
  try {
    const { user, tenant } = await requireAuth();
    const body = await request.json();

    const { tenantId, locationId, initialAmount } = openDrawerSchema.parse(body);

    // Verificar que el tenant coincida
    if (tenantId !== tenant.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verificar límite de cajas según el plan
    const limitCheck = await checkCashRegisterLimit(tenantId);
    if (!limitCheck.canAdd) {
      return NextResponse.json(
        {
          error: 'Has alcanzado el límite de cajas de tu plan',
          limit: limitCheck.limit,
          current: limitCheck.current,
          upgradeRequired: true
        },
        { status: 402 }
      );
    }

    // Crear nueva caja
    const drawer = await prisma.cashDrawer.create({
      data: {
        tenantId,
        ...(locationId && { locationId }),
        openedById: user.id,
        initialAmount,
        status: 'OPEN',
        openedAt: new Date()
      },
      include: {
        openedBy: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json(drawer, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/caja/open:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 