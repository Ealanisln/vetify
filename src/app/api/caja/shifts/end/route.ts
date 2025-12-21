import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '@/lib/prisma';
import { checkShiftManagementAccess } from '@/lib/plan-limits';

export const dynamic = 'force-dynamic';

/**
 * POST /api/caja/shifts/end
 * End a shift with reconciliation
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
    const { shiftId, endingBalance, notes } = body;

    // Validate required fields
    if (!shiftId) {
      return NextResponse.json({ error: 'Se requiere shiftId' }, { status: 400 });
    }

    if (endingBalance === undefined || endingBalance < 0) {
      return NextResponse.json(
        { error: 'El balance final debe ser mayor o igual a 0' },
        { status: 400 }
      );
    }

    // Verify shift exists and is ACTIVE
    const shift = await prisma.cashShift.findFirst({
      where: { id: shiftId, tenantId, status: 'ACTIVE' }
    });

    if (!shift) {
      return NextResponse.json(
        { error: 'El turno no existe o no está activo' },
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
    const expectedBalance = Number(shift.startingBalance) + netTotal;
    const difference = endingBalance - expectedBalance;

    // Update the shift
    const updatedShift = await prisma.cashShift.update({
      where: { id: shiftId },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
        endingBalance,
        expectedBalance,
        difference,
        notes: notes || null
      },
      include: {
        cashier: { select: { id: true, name: true, position: true } },
        drawer: { select: { id: true, status: true, openedAt: true, initialAmount: true } }
      }
    });

    return NextResponse.json({
      shift: updatedShift,
      reconciliation: {
        startingBalance: Number(shift.startingBalance),
        totalIncome,
        totalExpenses,
        netTotal,
        expectedBalance,
        actualBalance: endingBalance,
        difference,
        status: difference === 0 ? 'exact' : difference > 0 ? 'surplus' : 'shortage'
      }
    });
  } catch (error) {
    console.error('Error ending shift:', error);
    return NextResponse.json(
      { error: 'Error al terminar turno' },
      { status: 500 }
    );
  }
}
