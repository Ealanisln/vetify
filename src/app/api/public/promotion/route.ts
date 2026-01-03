import { NextResponse } from 'next/server';
import { getActivePromotion } from '@/lib/promotions/queries';

/**
 * GET - Get the currently active promotion (public endpoint)
 * Returns null if no promotion is active
 */
export async function GET() {
  try {
    const promotion = await getActivePromotion();

    if (!promotion) {
      return NextResponse.json({
        success: true,
        active: false,
        promotion: null,
      });
    }

    // Return only public-facing promotion data
    return NextResponse.json({
      success: true,
      active: true,
      promotion: {
        code: promotion.code,
        discountPercent: promotion.discountPercent,
        durationMonths: promotion.durationMonths,
        badgeText: promotion.badgeText,
        description: promotion.description,
        applicablePlans: promotion.applicablePlans,
        stripeCouponId: promotion.stripeCouponId,
      },
    });
  } catch (error) {
    console.error('Error fetching active promotion:', error);
    return NextResponse.json({
      success: false,
      active: false,
      promotion: null,
    });
  }
}
