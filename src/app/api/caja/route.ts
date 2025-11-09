import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function GET(request: Request) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || tenant.id;
    const locationId = searchParams.get('locationId') || undefined;

    // Buscar la caja actual del día
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const currentDrawer = await prisma.cashDrawer.findFirst({
      where: {
        tenantId,
        ...(locationId && { locationId }),
        openedAt: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        openedBy: {
          select: { name: true }
        },
        closedBy: {
          select: { name: true }
        }
      },
      orderBy: { openedAt: 'desc' }
    });

    return NextResponse.json({ drawer: currentDrawer });
  } catch (error) {
    console.error('Error en GET /api/caja:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 