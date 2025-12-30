import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { parsePagination } from '../../../../lib/security/validation-schemas';

interface TransactionData {
  id: string;
  type: string;
  amount: number;
  paymentMethod: string;
  description: string;
  customerName: string;
  createdAt: Date;
  status: string;
  saleId: string | null;
}

export async function GET(request: Request) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);
    // SECURITY FIX: Always use authenticated tenant ID - never allow override via query params
    const tenantId = tenant.id;
    const locationId = searchParams.get('locationId') || undefined;
    const drawerId = searchParams.get('drawerId') || undefined; // Filtrar por caja específica
    // SECURITY FIX: Use validated pagination with enforced limits
    const { limit } = parsePagination(searchParams);
    const summary = searchParams.get('summary') === 'true';

    // Si solo quieren el resumen
    if (summary) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Obtener caja (por ID específico o la más reciente)
      const currentDrawer = drawerId
        ? await prisma.cashDrawer.findFirst({
            where: { id: drawerId, tenantId }
          })
        : await prisma.cashDrawer.findFirst({
            where: {
              tenantId,
              ...(locationId && { locationId }),
              status: 'OPEN'
            },
            orderBy: { openedAt: 'desc' }
          });

      if (!currentDrawer) {
        return NextResponse.json({
          totalSales: 0,
          totalCash: 0,
          totalCard: 0,
          transactionCount: 0
        });
      }

      // Obtener transacciones de efectivo de la caja actual
      const cashTransactions = await prisma.cashTransaction.aggregate({
        where: {
          drawerId: currentDrawer.id,
          type: 'SALE_CASH'
        },
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      });

      // Obtener pagos con tarjeta del día (filtrados por ubicación si aplica)
      const cardPayments = await prisma.salePayment.aggregate({
        where: {
          paymentMethod: {
            in: ['CREDIT_CARD', 'DEBIT_CARD']
          },
          paymentDate: {
            gte: today,
            lt: tomorrow
          },
          sale: {
            tenantId,
            status: { in: ['COMPLETED', 'PAID'] },
            ...(locationId && { locationId })
          }
        },
        _sum: {
          amount: true
        }
      });

      // Obtener total de ventas del día (filtradas por ubicación si aplica)
      const totalSales = await prisma.sale.aggregate({
        where: {
          tenantId,
          status: { in: ['COMPLETED', 'PAID'] },
          createdAt: {
            gte: today,
            lt: tomorrow
          },
          ...(locationId && { locationId })
        },
        _sum: {
          total: true
        },
        _count: {
          id: true
        }
      });

      return NextResponse.json({
        totalSales: Number(totalSales._sum.total || 0),
        totalCash: Number(cashTransactions._sum.amount || 0),
        totalCard: Number(cardPayments._sum.amount || 0),
        transactionCount: totalSales._count.id
      });
    }

    // Obtener transacciones recientes (combinando cash transactions y payments)
    // Obtener caja (por ID específico o la más reciente abierta)
    const currentDrawer = drawerId
      ? await prisma.cashDrawer.findFirst({
          where: { id: drawerId, tenantId }
        })
      : await prisma.cashDrawer.findFirst({
          where: {
            tenantId,
            ...(locationId && { locationId }),
            status: 'OPEN'
          },
          orderBy: { openedAt: 'desc' }
        });

    let transactions: TransactionData[] = [];

    if (currentDrawer) {
      // Obtener transacciones de caja
      const cashTransactions = await prisma.cashTransaction.findMany({
        where: {
          drawerId: currentDrawer.id
        },
        include: {
          SalePayment: {
            include: {
              sale: {
                include: {
                  customer: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      transactions = cashTransactions.map(transaction => ({
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        paymentMethod: 'CASH',
        description: transaction.description || 'Transacción de caja',
        customerName: transaction.SalePayment?.sale.customer?.name || 'N/A',
        createdAt: transaction.createdAt,
        status: 'COMPLETED',
        saleId: transaction.SalePayment?.sale.id || null
      }));
    }

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error en GET /api/caja/transactions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 