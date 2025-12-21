import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

const closeDrawerSchema = z.object({
  tenantId: z.string(),
  drawerId: z.string(), // Requerido: especificar cuál caja cerrar
  locationId: z.string().optional(), // Deprecated: solo para compatibilidad
  finalAmount: z.number().min(0)
});

export async function POST(request: Request) {
  try {
    const { user, tenant } = await requireAuth();
    const body = await request.json();

    const { tenantId, drawerId, finalAmount } = closeDrawerSchema.parse(body);

    // Verificar que el tenant coincida
    if (tenantId !== tenant.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Buscar la caja específica por drawerId
    const openDrawer = await prisma.cashDrawer.findFirst({
      where: {
        id: drawerId,
        tenantId,
        status: 'OPEN'
      }
    });

    if (!openDrawer) {
      return NextResponse.json(
        { error: 'No se encontró la caja especificada o ya está cerrada' },
        { status: 400 }
      );
    }

    // Calcular ventas en efectivo del día (filtradas por ubicación si aplica)
    const cashPayments = await prisma.salePayment.aggregate({
      where: {
        paymentMethod: 'CASH',
        paymentDate: {
          gte: openDrawer.openedAt,
          lt: new Date()
        },
        sale: {
          tenantId,
          status: 'COMPLETED',
          ...(openDrawer.locationId && { locationId: openDrawer.locationId })
        }
      },
      _sum: {
        amount: true
      }
    });

    const totalCashSales = Number(cashPayments._sum.amount || 0);
    const expectedAmount = Number(openDrawer.initialAmount) + totalCashSales;
    const difference = finalAmount - expectedAmount;

    // Cerrar la caja
    const closedDrawer = await prisma.cashDrawer.update({
      where: { id: openDrawer.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedById: user.id,
        finalAmount,
        expectedAmount,
        difference
      },
      include: {
        openedBy: {
          select: { name: true }
        },
        closedBy: {
          select: { name: true }
        }
      }
    });

    // Auto-cerrar turnos activos de esta caja
    const closedShifts = await prisma.cashShift.updateMany({
      where: {
        drawerId: openDrawer.id,
        status: 'ACTIVE'
      },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
        endingBalance: finalAmount,
        expectedBalance: expectedAmount,
        difference: difference
      }
    });

    return NextResponse.json({
      ...closedDrawer,
      closedShiftsCount: closedShifts.count
    });
  } catch (error) {
    console.error('Error en POST /api/caja/close:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 