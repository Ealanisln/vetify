import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
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

    // Verificar que no haya una caja abierta para esta ubicación
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingDrawer = await prisma.cashDrawer.findFirst({
      where: {
        tenantId,
        ...(locationId && { locationId }),
        status: 'OPEN',
        openedAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (existingDrawer) {
      return NextResponse.json(
        { error: 'Ya hay una caja abierta para esta ubicación hoy' },
        { status: 400 }
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