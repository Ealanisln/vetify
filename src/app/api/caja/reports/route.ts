import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '@/lib/prisma';
import { checkShiftManagementAccess } from '@/lib/plan-limits';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';

// Transaction types for income/expense classification
const INCOME_TYPES = ['SALE_CASH', 'DEPOSIT', 'ADJUSTMENT_IN'];
const EXPENSE_TYPES = ['REFUND_CASH', 'WITHDRAWAL', 'ADJUSTMENT_OUT'];

/**
 * GET /api/caja/reports
 * Get comprehensive cash drawer reports with various filters and groupings
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

    // Check feature access (same as shift management)
    const hasAccess = await checkShiftManagementAccess(tenantId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Esta función requiere Plan Profesional o superior' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'day';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const drawerId = searchParams.get('drawerId');
    const cashierId = searchParams.get('cashierId');
    const groupBy = searchParams.get('groupBy');

    // Calculate date range based on period
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (period) {
      case 'week':
        periodStart = startOfWeek(now, { weekStartsOn: 1 });
        periodEnd = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        periodStart = startOfMonth(now);
        periodEnd = endOfMonth(now);
        break;
      case 'lastMonth':
        periodStart = startOfMonth(subMonths(now, 1));
        periodEnd = endOfMonth(subMonths(now, 1));
        break;
      case 'custom':
        if (!startDateParam || !endDateParam) {
          return NextResponse.json(
            { error: 'Se requiere startDate y endDate para período custom' },
            { status: 400 }
          );
        }
        periodStart = startOfDay(new Date(startDateParam));
        periodEnd = endOfDay(new Date(endDateParam));
        break;
      default: // 'day'
        periodStart = startOfDay(now);
        periodEnd = endOfDay(now);
    }

    // Build transaction where clause
    const transactionWhere: {
      drawer: { tenantId: string; id?: string };
      createdAt: { gte: Date; lte: Date };
      shift?: { cashierId: string };
    } = {
      drawer: { tenantId },
      createdAt: { gte: periodStart, lte: periodEnd }
    };

    if (drawerId) {
      transactionWhere.drawer.id = drawerId;
    }
    if (cashierId) {
      transactionWhere.shift = { cashierId };
    }

    // Get all transactions in period
    const transactions = await prisma.cashTransaction.findMany({
      where: transactionWhere,
      include: {
        drawer: { select: { id: true, locationId: true, openedAt: true } },
        shift: { select: { id: true, cashierId: true, cashier: { select: { id: true, name: true } } } }
      }
    });

    // Calculate summary
    const totalIncome = transactions
      .filter(t => INCOME_TYPES.includes(t.type))
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const totalExpenses = transactions
      .filter(t => EXPENSE_TYPES.includes(t.type))
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const netTotal = totalIncome - totalExpenses;
    const transactionCount = transactions.length;
    const avgTransactionValue = transactionCount > 0 ? netTotal / transactionCount : 0;

    // Group by transaction type
    const byTransactionType: Record<string, { count: number; total: number }> = {};
    transactions.forEach(t => {
      const type = t.type;
      if (!byTransactionType[type]) {
        byTransactionType[type] = { count: 0, total: 0 };
      }
      byTransactionType[type].count++;
      byTransactionType[type].total += parseFloat(t.amount.toString());
    });

    // Get shifts in period for discrepancy analysis
    const shiftWhere: {
      tenantId: string;
      drawerId?: string;
      cashierId?: string;
      startedAt: { gte: Date; lte: Date };
      status: { in: ('ENDED' | 'HANDED_OFF')[] };
    } = {
      tenantId,
      startedAt: { gte: periodStart, lte: periodEnd },
      status: { in: ['ENDED', 'HANDED_OFF'] }
    };

    if (drawerId) shiftWhere.drawerId = drawerId;
    if (cashierId) shiftWhere.cashierId = cashierId;

    const shifts = await prisma.cashShift.findMany({
      where: shiftWhere,
      include: {
        cashier: { select: { id: true, name: true } },
        drawer: { select: { id: true, locationId: true } },
        _count: { select: { transactions: true } }
      }
    });

    // Calculate discrepancies
    const discrepancies = {
      totalDifference: shifts.reduce((sum, s) => sum + (parseFloat(s.difference?.toString() || '0')), 0),
      shiftsWithDifference: shifts.filter(s => s.difference && parseFloat(s.difference.toString()) !== 0).length,
      worstDiscrepancy: shifts.reduce((worst, s) => {
        const diff = Math.abs(parseFloat(s.difference?.toString() || '0'));
        return diff > Math.abs(worst) ? (parseFloat(s.difference?.toString() || '0')) : worst;
      }, 0)
    };

    // Group by drawer if requested
    let byDrawer: Array<{
      drawerId: string;
      locationId: string | null;
      income: number;
      expenses: number;
      net: number;
      transactionCount: number;
      shiftCount: number;
      totalDifference: number;
    }> | undefined;

    if (groupBy === 'drawer' || !groupBy) {
      const drawerMap = new Map<string, {
        locationId: string | null;
        income: number;
        expenses: number;
        net: number;
        transactionCount: number;
        shiftCount: number;
        totalDifference: number;
      }>();

      transactions.forEach(t => {
        const did = t.drawer.id;
        if (!drawerMap.has(did)) {
          drawerMap.set(did, {
            locationId: t.drawer.locationId,
            income: 0,
            expenses: 0,
            net: 0,
            transactionCount: 0,
            shiftCount: 0,
            totalDifference: 0
          });
        }
        const d = drawerMap.get(did)!;
        const amount = parseFloat(t.amount.toString());
        if (INCOME_TYPES.includes(t.type)) {
          d.income += amount;
        } else if (EXPENSE_TYPES.includes(t.type)) {
          d.expenses += amount;
        }
        d.transactionCount++;
      });

      shifts.forEach(s => {
        const did = s.drawerId;
        if (!drawerMap.has(did)) {
          drawerMap.set(did, {
            locationId: s.drawer.locationId,
            income: 0,
            expenses: 0,
            net: 0,
            transactionCount: 0,
            shiftCount: 0,
            totalDifference: 0
          });
        }
        const d = drawerMap.get(did)!;
        d.shiftCount++;
        d.totalDifference += parseFloat(s.difference?.toString() || '0');
      });

      byDrawer = Array.from(drawerMap.entries()).map(([drawerId, data]) => ({
        drawerId,
        ...data,
        net: data.income - data.expenses
      }));
    }

    // Group by cashier if requested
    let byCashier: Array<{
      cashierId: string;
      cashierName: string;
      shiftCount: number;
      totalHours: number;
      transactionCount: number;
      totalDifference: number;
      accuracy: number;
    }> | undefined;

    if (groupBy === 'cashier' || !groupBy) {
      const cashierMap = new Map<string, {
        cashierName: string;
        shiftCount: number;
        totalMinutes: number;
        transactionCount: number;
        totalDifference: number;
        shiftsWithNoDifference: number;
      }>();

      shifts.forEach(s => {
        const cid = s.cashierId;
        if (!cashierMap.has(cid)) {
          cashierMap.set(cid, {
            cashierName: s.cashier.name,
            shiftCount: 0,
            totalMinutes: 0,
            transactionCount: 0,
            totalDifference: 0,
            shiftsWithNoDifference: 0
          });
        }
        const c = cashierMap.get(cid)!;
        c.shiftCount++;
        c.transactionCount += s._count.transactions;
        c.totalDifference += parseFloat(s.difference?.toString() || '0');
        if (s.endedAt) {
          const minutes = (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000;
          c.totalMinutes += minutes;
        }
        if (!s.difference || parseFloat(s.difference.toString()) === 0) {
          c.shiftsWithNoDifference++;
        }
      });

      byCashier = Array.from(cashierMap.entries()).map(([cashierId, data]) => ({
        cashierId,
        cashierName: data.cashierName,
        shiftCount: data.shiftCount,
        totalHours: Math.round(data.totalMinutes / 60 * 10) / 10,
        transactionCount: data.transactionCount,
        totalDifference: data.totalDifference,
        accuracy: data.shiftCount > 0 ? Math.round((data.shiftsWithNoDifference / data.shiftCount) * 100) : 100
      }));
    }

    // Group by day if requested
    let byDay: Array<{
      date: string;
      income: number;
      expenses: number;
      net: number;
      transactionCount: number;
    }> | undefined;

    if (groupBy === 'day') {
      const dayMap = new Map<string, {
        income: number;
        expenses: number;
        transactionCount: number;
      }>();

      transactions.forEach(t => {
        const dateKey = t.createdAt.toISOString().split('T')[0];
        if (!dayMap.has(dateKey)) {
          dayMap.set(dateKey, { income: 0, expenses: 0, transactionCount: 0 });
        }
        const d = dayMap.get(dateKey)!;
        const amount = parseFloat(t.amount.toString());
        if (INCOME_TYPES.includes(t.type)) {
          d.income += amount;
        } else if (EXPENSE_TYPES.includes(t.type)) {
          d.expenses += amount;
        }
        d.transactionCount++;
      });

      byDay = Array.from(dayMap.entries())
        .map(([date, data]) => ({
          date,
          income: data.income,
          expenses: data.expenses,
          net: data.income - data.expenses,
          transactionCount: data.transactionCount
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    return NextResponse.json({
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString()
      },
      summary: {
        totalIncome,
        totalExpenses,
        netTotal,
        transactionCount,
        avgTransactionValue
      },
      byTransactionType,
      discrepancies,
      byDrawer,
      byCashier,
      byDay,
      shifts: shifts.map(s => ({
        id: s.id,
        cashier: s.cashier,
        drawer: s.drawer,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        startingBalance: s.startingBalance,
        endingBalance: s.endingBalance,
        expectedBalance: s.expectedBalance,
        difference: s.difference,
        status: s.status,
        transactionCount: s._count.transactions
      }))
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Error al obtener reportes' },
      { status: 500 }
    );
  }
}
