import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const closeDrawerSchema = z.object({
  tenantId: z.string(),
  finalAmount: z.number().min(0)
});

export async function POST(request: Request) {
  try {
    const { user, tenant } = await requireAuth();
    const body = await request.json();
    
    const { tenantId, finalAmount } = closeDrawerSchema.parse(body);

    // Verificar que el tenant coincida
    if (tenantId !== tenant.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Buscar la caja abierta
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const openDrawer = await prisma.cashDrawer.findFirst({
      where: {
        tenantId,
        status: 'OPEN',
        openedAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (!openDrawer) {
      return NextResponse.json(
        { error: 'No hay caja abierta para cerrar' },
        { status: 400 }
      );
    }

    // Calcular ventas en efectivo del día
    const cashPayments = await prisma.salePayment.aggregate({
      where: {
        paymentMethod: 'CASH',
        paymentDate: {
          gte: openDrawer.openedAt,
          lt: new Date()
        },
        sale: {
          tenantId,
          status: 'COMPLETED'
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

    return NextResponse.json(closedDrawer);
  } catch (error) {
    console.error('Error en POST /api/caja/close:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 