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

    // Calculate spots remaining
    const spotsRemaining = promotion.maxRedemptions !== null
      ? Math.max(0, promotion.maxRedemptions - promotion.currentRedemptions)
      : null;
    const isSoldOut = promotion.maxRedemptions !== null
      ? promotion.currentRedemptions >= promotion.maxRedemptions
      : false;

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
        promotionType: promotion.promotionType,
        trialDays: promotion.trialDays,
        spotsRemaining,
        isSoldOut,
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
