import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '@/lib/prisma';
import { checkShiftManagementAccess } from '@/lib/plan-limits';

export const dynamic = 'force-dynamic';

/**
 * POST /api/caja/shifts/handoff
 * Hand off a shift to another cashier with verified count
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
    const { shiftId, newCashierId, countedBalance, handoffNotes } = body;

    // Validate required fields
    if (!shiftId || !newCashierId) {
      return NextResponse.json(
        { error: 'Se requiere shiftId y newCashierId' },
        { status: 400 }
      );
    }

    if (countedBalance === undefined || countedBalance < 0) {
      return NextResponse.json(
        { error: 'El conteo verificado es obligatorio y debe ser mayor o igual a 0' },
        { status: 400 }
      );
    }

    // Verify shift exists and is ACTIVE
    const currentShift = await prisma.cashShift.findFirst({
      where: { id: shiftId, tenantId, status: 'ACTIVE' },
      include: { drawer: { select: { id: true, status: true } } }
    });

    if (!currentShift) {
      return NextResponse.json(
        { error: 'El turno no existe o no está activo' },
        { status: 400 }
      );
    }

    // Verify new cashier exists and is active
    const newCashier = await prisma.staff.findFirst({
      where: { id: newCashierId, tenantId, isActive: true }
    });

    if (!newCashier) {
      return NextResponse.json(
        { error: 'El nuevo cajero no existe o no está activo' },
        { status: 400 }
      );
    }

    // Check new cashier doesn't have an active shift
    const newCashierActiveShift = await prisma.cashShift.findFirst({
      where: { cashierId: newCashierId, tenantId, status: 'ACTIVE' }
    });

    if (newCashierActiveShift) {
      return NextResponse.json(
        { error: 'El nuevo cajero ya tiene un turno activo' },
        { status: 400 }
      );
    }

    // Prevent self-handoff
    if (currentShift.cashierId === newCashierId) {
      return NextResponse.json(
        { error: 'No puedes entregar el turno a ti mismo' },
        { status: 400 }
      );
    }

    // Calculate expected balance from transactions during this shift
    const transactionSummary = await prisma.cashTransaction.groupBy({
      by: ['type'],
      where: { shiftId },
      _sum: { amount: true }
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const group of transactionSummary) {
      const amount = Number(group._sum.amount || 0);
      if (['SALE_CASH', 'DEPOSIT', 'ADJUSTMENT_IN'].includes(group.type)) {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
      }
    }

    const netTotal = totalIncome - totalExpenses;
    const expectedBalance = Number(currentShift.startingBalance) + netTotal;
    const difference = countedBalance - expectedBalance;

    // Perform handoff in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // End current shift with HANDED_OFF status
      const endedShift = await tx.cashShift.update({
        where: { id: shiftId },
        data: {
          status: 'HANDED_OFF',
          endedAt: new Date(),
          endingBalance: countedBalance,
          expectedBalance,
          difference,
          handedOffToId: newCashierId,
          handedOffAt: new Date(),
          handoffNotes: handoffNotes || null
        },
        include: {
          cashier: { select: { id: true, name: true } }
        }
      });

      // Create new shift for new cashier with the counted balance
      const newShift = await tx.cashShift.create({
        data: {
          tenantId,
          drawerId: currentShift.drawerId,
          cashierId: newCashierId,
          startingBalance: countedBalance
        },
        include: {
          cashier: { select: { id: true, name: true, position: true } },
          drawer: { select: { id: true, status: true, openedAt: true } }
        }
      });

      return { previousShift: endedShift, newShift };
    });

    return NextResponse.json({
      ...result,
      reconciliation: {
        startingBalance: Number(currentShift.startingBalance),
        totalIncome,
        totalExpenses,
        netTotal,
        expectedBalance,
        countedBalance,
        difference,
        status: difference === 0 ? 'exact' : difference > 0 ? 'surplus' : 'shortage'
      }
    });
  } catch (error) {
    console.error('Error during handoff:', error);
    return NextResponse.json(
      { error: 'Error al entregar turno' },
      { status: 500 }
    );
  }
}
