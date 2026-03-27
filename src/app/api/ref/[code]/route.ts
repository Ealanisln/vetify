import { NextRequest, NextResponse } from 'next/server';
import { resolveReferralCode, incrementClickCount } from '@/lib/referrals/queries';

/**
 * Public referral redirect endpoint.
 * GET /api/ref/DRSMITH → redirects to /precios?ref=DRSMITH
 * Sets a 30-day cookie for attribution and increments click count.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vetify.pro';

  // Validate and resolve code
  const referral = await resolveReferralCode(code);
  if (!referral) {
    // Invalid code — redirect to pricing page without ref param
    return NextResponse.redirect(`${baseUrl}/precios`);
  }

  // Increment click count (non-blocking)
  incrementClickCount(referral.id).catch((err) => {
    console.error('[REF] Error incrementing click count:', err);
  });

  // Build redirect URL with ref param
  const redirectUrl = new URL('/precios', baseUrl);
  redirectUrl.searchParams.set('ref', referral.code);

  const response = NextResponse.redirect(redirectUrl.toString());

  // Set attribution cookie (30 days)
  response.cookies.set('vetify_ref', referral.code, {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    httpOnly: false, // Accessible from client-side JS for onboarding form
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return response;
}
