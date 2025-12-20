import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { checkCashRegisterLimit } from '../../../lib/plan-limits';

export async function GET(request: Request) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || tenant.id;
    const locationId = searchParams.get('locationId') || undefined;
    const statusFilter = searchParams.get('status') || 'OPEN'; // Default: solo abiertas

    // Buscar todas las cajas (filtradas por status)
    const drawers = await prisma.cashDrawer.findMany({
      where: {
        tenantId,
        ...(locationId && { locationId }),
        ...(statusFilter !== 'ALL' && { status: statusFilter as 'OPEN' | 'CLOSED' | 'RECONCILED' })
      },
      include: {
        openedBy: {
          select: { id: true, name: true }
        },
        closedBy: {
          select: { id: true, name: true }
        },
        location: {
          select: { id: true, name: true }
        }
      },
      orderBy: { openedAt: 'desc' }
    });

    // Obtener límites del plan
    const planLimits = await checkCashRegisterLimit(tenantId);

    return NextResponse.json({
      drawers,
      count: drawers.length,
      openCount: drawers.filter(d => d.status === 'OPEN').length,
      planLimits: {
        limit: planLimits.limit,
        current: planLimits.current,
        remaining: planLimits.remaining,
        canAdd: planLimits.canAdd
      },
      // Mantener compatibilidad con código existente
      drawer: drawers.find(d => d.status === 'OPEN') || null
    });
  } catch (error) {
    console.error('Error en GET /api/caja:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 