import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '@/lib/prisma';
import { checkShiftManagementAccess } from '@/lib/plan-limits';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ shiftId: string }>;
}

/**
 * GET /api/caja/shifts/[shiftId]
 * Get shift details including transactions
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { shiftId } = await params;
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

    const shift = await prisma.cashShift.findFirst({
      where: { id: shiftId, tenantId },
      include: {
        cashier: { select: { id: true, name: true, position: true, email: true } },
        drawer: {
          select: {
            id: true,
            status: true,
            openedAt: true,
            closedAt: true,
            initialAmount: true,
            finalAmount: true
          }
        },
        handedOffTo: { select: { id: true, name: true } },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            SalePayment: {
              include: {
                sale: {
                  select: {
                    saleNumber: true,
                    customer: { select: { name: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!shift) {
      return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });
    }

    // Calculate transaction summary for this shift
    const transactionSummary = await prisma.cashTransaction.groupBy({
      by: ['type'],
      where: { shiftId },
      _sum: { amount: true },
      _count: true
    });

    // Calculate totals
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

    return NextResponse.json({
      shift,
      summary: {
        totalIncome,
        totalExpenses,
        netTotal,
        expectedBalance,
        transactionCount: shift.transactions.length,
        byType: transactionSummary
      }
    });
  } catch (error) {
    console.error('Error fetching shift details:', error);
    return NextResponse.json(
      { error: 'Error al obtener detalles del turno' },
      { status: 500 }
    );
  }
}
