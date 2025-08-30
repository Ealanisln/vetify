import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { getStaffStats, getStaffPerformance } from '../../../../lib/staff';

export async function GET(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const includePerformance = searchParams.get('includePerformance') === 'true';
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const [stats, performance] = await Promise.all([
      getStaffStats(tenant.id as string),
      includePerformance ? getStaffPerformance(tenant.id as string, startDate, endDate) : Promise.resolve([])
    ]);
    
    return NextResponse.json({
      stats,
      performance: includePerformance ? performance : undefined
    });
  } catch (error) {
    console.error('Error fetching staff stats:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 