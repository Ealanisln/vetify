import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '@/lib/prisma';
import { checkShiftManagementAccess } from '@/lib/plan-limits';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ shiftId: string }>;
}

// Transaction types for income/expense classification
const INCOME_TYPES = ['SALE_CASH', 'DEPOSIT', 'ADJUSTMENT_IN'];
const EXPENSE_TYPES = ['REFUND_CASH', 'WITHDRAWAL', 'ADJUSTMENT_OUT'];

/**
 * GET /api/caja/reports/shift/[shiftId]
 * Get comprehensive shift report with hourly breakdown
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
            finalAmount: true,
            locationId: true
          }
        },
        handedOffTo: { select: { id: true, name: true } },
        transactions: {
          orderBy: { createdAt: 'asc' },
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

    // Calculate transaction summary
    let totalIncome = 0;
    let totalExpenses = 0;
    const byTransactionType: Record<string, { count: number; total: number }> = {};
    const hourlyBreakdown: Record<number, { count: number; income: number; expenses: number }> = {};

    // Initialize hourly breakdown with zeros for all hours in shift duration
    const shiftStart = new Date(shift.startedAt);
    const shiftEnd = shift.endedAt ? new Date(shift.endedAt) : new Date();
    const startHour = shiftStart.getHours();
    const endHour = shiftEnd.getHours();

    for (let h = startHour; h <= endHour; h++) {
      hourlyBreakdown[h] = { count: 0, income: 0, expenses: 0 };
    }

    // Process transactions
    shift.transactions.forEach(t => {
      const amount = parseFloat(t.amount.toString());
      const hour = new Date(t.createdAt).getHours();
      const type = t.type;

      // Update transaction type breakdown
      if (!byTransactionType[type]) {
        byTransactionType[type] = { count: 0, total: 0 };
      }
      byTransactionType[type].count++;
      byTransactionType[type].total += amount;

      // Update income/expense totals
      if (INCOME_TYPES.includes(type)) {
        totalIncome += amount;
        if (hourlyBreakdown[hour]) {
          hourlyBreakdown[hour].income += amount;
        }
      } else if (EXPENSE_TYPES.includes(type)) {
        totalExpenses += amount;
        if (hourlyBreakdown[hour]) {
          hourlyBreakdown[hour].expenses += amount;
        }
      }

      // Update hourly count
      if (hourlyBreakdown[hour]) {
        hourlyBreakdown[hour].count++;
      }
    });

    const netTotal = totalIncome - totalExpenses;
    const startingBalance = parseFloat(shift.startingBalance.toString());
    const expectedBalance = startingBalance + netTotal;
    const actualBalance = shift.endingBalance ? parseFloat(shift.endingBalance.toString()) : null;
    const difference = actualBalance !== null ? actualBalance - expectedBalance : null;

    // Calculate shift duration in minutes
    const durationMinutes = Math.round((shiftEnd.getTime() - shiftStart.getTime()) / 60000);
    const durationHours = Math.round(durationMinutes / 60 * 10) / 10;

    // Format transactions for response
    const formattedTransactions = shift.transactions.map(t => ({
      id: t.id,
      type: t.type,
      amount: parseFloat(t.amount.toString()),
      description: t.description,
      createdAt: t.createdAt,
      relatedId: t.relatedId,
      relatedType: t.relatedType,
      saleInfo: t.SalePayment?.sale ? {
        saleNumber: t.SalePayment.sale.saleNumber,
        customerName: t.SalePayment.sale.customer?.name
      } : null
    }));

    // Convert hourly breakdown to array sorted by hour
    const hourlyBreakdownArray = Object.entries(hourlyBreakdown)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        ...data,
        net: data.income - data.expenses
      }))
      .sort((a, b) => a.hour - b.hour);

    return NextResponse.json({
      shift: {
        id: shift.id,
        status: shift.status,
        startedAt: shift.startedAt,
        endedAt: shift.endedAt,
        durationMinutes,
        durationHours,
        notes: shift.notes,
        handoffNotes: shift.handoffNotes,
        handedOffAt: shift.handedOffAt,
        cashier: shift.cashier,
        drawer: shift.drawer,
        handedOffTo: shift.handedOffTo
      },
      summary: {
        startingBalance,
        totalIncome,
        totalExpenses,
        netTotal,
        expectedBalance,
        actualBalance,
        difference,
        transactionCount: shift.transactions.length
      },
      byTransactionType,
      hourlyBreakdown: hourlyBreakdownArray,
      transactions: formattedTransactions
    });
  } catch (error) {
    console.error('Error fetching shift report:', error);
    return NextResponse.json(
      { error: 'Error al obtener reporte del turno' },
      { status: 500 }
    );
  }
}
