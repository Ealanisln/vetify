import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '@/lib/prisma';
import { checkShiftManagementAccess } from '@/lib/plan-limits';

export const dynamic = 'force-dynamic';

/**
 * GET /api/caja/shifts
 * List shifts for a tenant with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tenantId: true }
    });

    if (!dbUser?.tenantId) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const tenantId = dbUser.tenantId;

    // Check feature access
    const hasAccess = await checkShiftManagementAccess(tenantId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Esta función requiere Plan Profesional o superior' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const drawerId = searchParams.get('drawerId');
    const status = searchParams.get('status');
    const cashierId = searchParams.get('cashierId');
    const date = searchParams.get('date');

    // Build where clause
    const where: {
      tenantId: string;
      drawerId?: string;
      status?: 'ACTIVE' | 'ENDED' | 'HANDED_OFF';
      cashierId?: string;
      startedAt?: { gte: Date; lt: Date };
    } = { tenantId };

    if (drawerId) where.drawerId = drawerId;
    if (status && ['ACTIVE', 'ENDED', 'HANDED_OFF'].includes(status)) {
      where.status = status as 'ACTIVE' | 'ENDED' | 'HANDED_OFF';
    }
    if (cashierId) where.cashierId = cashierId;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.startedAt = { gte: startOfDay, lt: endOfDay };
    }

    const shifts = await prisma.cashShift.findMany({
      where,
      include: {
        cashier: { select: { id: true, name: true, position: true } },
        drawer: { select: { id: true, status: true, openedAt: true, initialAmount: true } },
        handedOffTo: { select: { id: true, name: true } },
        _count: { select: { transactions: true } }
      },
      orderBy: { startedAt: 'desc' }
    });

    // Get active shift count for the tenant
    const activeCount = await prisma.cashShift.count({
      where: { tenantId, status: 'ACTIVE' }
    });

    return NextResponse.json({
      shifts,
      count: shifts.length,
      activeCount
    });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json(
      { error: 'Error al obtener turnos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/caja/shifts
 * Start a new shift
 */
export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tenantId: true }
    });

    if (!dbUser?.tenantId) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const tenantId = dbUser.tenantId;

    // Check feature access
    const hasAccess = await checkShiftManagementAccess(tenantId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Esta función requiere Plan Profesional o superior' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { drawerId, cashierId, startingBalance } = body;

    // Validate required fields
    if (!drawerId || !cashierId) {
      return NextResponse.json(
        { error: 'Se requiere drawerId y cashierId' },
        { status: 400 }
      );
    }

    if (startingBalance === undefined || startingBalance < 0) {
      return NextResponse.json(
        { error: 'El balance inicial debe ser mayor o igual a 0' },
        { status: 400 }
      );
    }

    // Verify drawer exists and is OPEN
    const drawer = await prisma.cashDrawer.findFirst({
      where: { id: drawerId, tenantId, status: 'OPEN' }
    });

    if (!drawer) {
      return NextResponse.json(
        { error: 'La caja no existe o no está abierta' },
        { status: 400 }
      );
    }

    // Verify cashier exists and is active
    const cashier = await prisma.staff.findFirst({
      where: { id: cashierId, tenantId, isActive: true }
    });

    if (!cashier) {
      return NextResponse.json(
        { error: 'El cajero no existe o no está activo' },
        { status: 400 }
      );
    }

    // Check if there's already an active shift on this drawer
    const existingActiveShift = await prisma.cashShift.findFirst({
      where: { drawerId, status: 'ACTIVE' }
    });

    if (existingActiveShift) {
      return NextResponse.json(
        { error: 'Ya existe un turno activo en esta caja' },
        { status: 400 }
      );
    }

    // Check if cashier already has an active shift
    const cashierActiveShift = await prisma.cashShift.findFirst({
      where: { cashierId, tenantId, status: 'ACTIVE' }
    });

    if (cashierActiveShift) {
      return NextResponse.json(
        { error: 'El cajero ya tiene un turno activo en otra caja' },
        { status: 400 }
      );
    }

    // Create the shift
    const shift = await prisma.cashShift.create({
      data: {
        tenantId,
        drawerId,
        cashierId,
        startingBalance
      },
      include: {
        cashier: { select: { id: true, name: true, position: true } },
        drawer: { select: { id: true, status: true, openedAt: true, initialAmount: true } }
      }
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    console.error('Error starting shift:', error);
    return NextResponse.json(
      { error: 'Error al iniciar turno' },
      { status: 500 }
    );
  }
}
