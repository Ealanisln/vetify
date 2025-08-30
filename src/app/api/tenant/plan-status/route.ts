import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { getPlanStatus } from '../../../../lib/plan-limits';

/**
 * GET /api/tenant/plan-status
 * Get comprehensive plan status for the current tenant
 */
export async function GET() {
  try {
    const { tenant } = await requireAuth();
    
    const planStatus = await getPlanStatus(tenant.id);
    
    return NextResponse.json(planStatus);
  } catch (error) {
    console.error('Error fetching plan status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan status' },
      { status: 500 }
    );
  }
} 