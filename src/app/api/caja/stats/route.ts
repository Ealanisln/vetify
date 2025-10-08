import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el tenant del usuario
    const userWithTenant = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tenantId: true }
    });

    if (!userWithTenant?.tenantId) {
      return NextResponse.json({ error: 'Usuario sin tenant' }, { status: 400 });
    }

    // Obtener fecha actual
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Obtener cajón abierto actual
    const currentDrawer = await prisma.cashDrawer.findFirst({
      where: {
        tenantId: userWithTenant.tenantId,
        status: 'OPEN',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!currentDrawer) {
      return NextResponse.json({
        totalIncome: 0,
        totalExpenses: 0,
        netTotal: 0,
        transactionCount: 0,
        currentBalance: 0,
        isDrawerOpen: false,
      });
    }

    // Obtener transacciones del cajón actual
    const transactions = await prisma.cashTransaction.findMany({
      where: {
        drawerId: currentDrawer.id,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    // Calcular estadísticas
    const totalIncome = transactions
      .filter(t => ['SALE_CASH', 'DEPOSIT', 'ADJUSTMENT_IN'].includes(t.type))
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const totalExpenses = transactions
      .filter(t => ['REFUND_CASH', 'WITHDRAWAL', 'ADJUSTMENT_OUT'].includes(t.type))
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const netTotal = totalIncome - totalExpenses;
    const transactionCount = transactions.length;

    // Calcular balance actual (inicial + transacciones)
    const currentBalance = parseFloat(currentDrawer.initialAmount.toString()) + netTotal;

    const stats = {
      totalIncome,
      totalExpenses,
      netTotal,
      transactionCount,
      currentBalance,
      isDrawerOpen: true,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas de caja:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 