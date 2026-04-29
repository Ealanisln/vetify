import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/super-admin';
import { getConversions } from '@/lib/referrals/queries';

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'SIGNUP' | 'CONVERTED' | 'CHURNED' | null;
    const payoutStatus = searchParams.get('payoutStatus') as 'PENDING' | 'APPROVED' | 'PAID' | 'VOID' | null;
    const partnerId = searchParams.get('partnerId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await getConversions({
      ...(status ? { status } : {}),
      ...(payoutStatus ? { payoutStatus } : {}),
      ...(partnerId ? { partnerId } : {}),
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result.conversions,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error listing referral conversions:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener las conversiones' },
      { status: 500 }
    );
  }
}
