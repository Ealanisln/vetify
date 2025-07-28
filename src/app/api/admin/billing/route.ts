import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/super-admin';
import { prisma } from '@/lib/prisma';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireSuperAdmin();

    // Calculate date ranges
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));

    // Get all tenant subscriptions
    const subscriptions = await prisma.tenantSubscription.findMany({
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
            price: true
          }
        }
      }
    });

    // Calculate metrics
    const activeSubscriptions = subscriptions.filter(
      sub => sub.status === 'ACTIVE'
    ).length;

    const totalRevenue = subscriptions
      .filter(sub => sub.status === 'ACTIVE')
      .reduce((sum, sub) => sum + (sub.plan?.price || 0), 0);

    // Calculate monthly revenue (simplified - assumes monthly billing)
    const monthlyRevenue = totalRevenue;

    // Count pending payments (simplified - could be enhanced with Stripe data)
    const pendingPayments = subscriptions.filter(
      sub => sub.status === 'PAST_DUE'
    ).length;

    // Calculate revenue growth (simplified)
    const revenueGrowth = 0; // Would need historical data for accurate calculation

    // Prepare revenue data for charts
    const revenueData = Array.from({ length: 12 }, (_, i) => {
      const month = subMonths(now, 11 - i);
      return {
        month: month.toLocaleDateString('es-MX', { month: 'short' }),
        revenue: Math.floor(Math.random() * 50000) + 10000 // Mock data - replace with real calculations
      };
    });

    const stats = {
      totalRevenue,
      monthlyRevenue,
      activeSubscriptions,
      pendingPayments,
      revenueGrowth,
      revenueData
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching billing stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 