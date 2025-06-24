import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || tenant.id;
    const limit = parseInt(searchParams.get('limit') || '20');
    const summary = searchParams.get('summary') === 'true';

    // Si solo quieren el resumen
    if (summary) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const salesStats = await prisma.sale.aggregate({
        where: {
          tenantId,
          status: 'COMPLETED',
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        _sum: {
          total: true
        },
        _count: {
          id: true
        }
      });

      const cashPayments = await prisma.salePayment.aggregate({
        where: {
          paymentMethod: 'CASH',
          paymentDate: {
            gte: today,
            lt: tomorrow
          },
          sale: {
            tenantId,
            status: 'COMPLETED'
          }
        },
        _sum: {
          amount: true
        }
      });

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
            status: 'COMPLETED'
          }
        },
        _sum: {
          amount: true
        }
      });

      return NextResponse.json({
        totalSales: Number(salesStats._sum.total || 0),
        totalCash: Number(cashPayments._sum.amount || 0),
        totalCard: Number(cardPayments._sum.amount || 0),
        transactionCount: salesStats._count.id
      });
    }

    // Obtener transacciones recientes
    const transactions = await prisma.salePayment.findMany({
      where: {
        sale: {
          tenantId
        }
      },
      include: {
        sale: {
          include: {
            customer: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      },
      take: limit
    });

    // Formatear las transacciones para el frontend
    const formattedTransactions = transactions.map(payment => ({
      id: payment.id,
      type: payment.sale.status === 'CANCELLED' ? 'REFUND' : 'SALE',
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      description: `Venta #${payment.sale.saleNumber}`,
      customerName: payment.sale.customer.name,
      createdAt: payment.paymentDate,
      status: payment.sale.status
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error('Error en GET /api/caja/transactions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 