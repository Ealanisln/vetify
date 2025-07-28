import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/super-admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireSuperAdmin();

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset') || '0';

    // Since we don't have a payments table yet, we'll simulate with subscription data
    // In a real implementation, you'd have a separate payments table or fetch from Stripe
    const subscriptions = await prisma.tenantSubscription.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'PAST_DUE']
        }
      },
      include: {
        tenant: {
          select: {
            name: true,
            id: true
          }
        },
        plan: {
          select: {
            name: true,
            price: true,
            currency: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: limit ? parseInt(limit) : undefined,
      skip: parseInt(offset)
    });

    // Transform subscription data to simulate payment history
    const payments = subscriptions.map(sub => ({
      id: `payment_${sub.id}`,
      tenantName: sub.tenant?.name || 'N/A',
      amount: sub.plan?.price || 0,
      currency: sub.plan?.currency || 'MXN',
      status: sub.status === 'ACTIVE' ? 'succeeded' : 'failed',
      createdAt: sub.updatedAt.toISOString(),
      description: `Pago de suscripción - ${sub.plan?.name || 'Plan'}`
    }));

    // Get total count
    const total = await prisma.tenantSubscription.count({
      where: {
        status: {
          in: ['ACTIVE', 'PAST_DUE']
        }
      }
    });

    return NextResponse.json({
      payments,
      total,
      limit: limit ? parseInt(limit) : total,
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 