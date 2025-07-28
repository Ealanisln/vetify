import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/super-admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireSuperAdmin();

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset') || '0';
    const status = searchParams.get('status');

    // Build where clause
    const where: { status?: string } = {};
    if (status) {
      where.status = status;
    }

    // Get subscriptions with tenant and plan data
    const subscriptions = await prisma.tenantSubscription.findMany({
      where,
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

    // Transform data for frontend
    const transformedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      tenantName: sub.tenant?.name || 'N/A',
      planName: sub.plan?.name || 'N/A',
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || new Date().toISOString(),
      amount: sub.plan?.price || 0,
      currency: sub.plan?.currency || 'MXN'
    }));

    // Get total count for pagination
    const total = await prisma.tenantSubscription.count({ where });

    return NextResponse.json({
      subscriptions: transformedSubscriptions,
      total,
      limit: limit ? parseInt(limit) : total,
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 