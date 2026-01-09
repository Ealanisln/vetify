import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { trackEventSchema } from '@/lib/analytics/landing-tracker';
import type { AnalyticsEventType } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/public/analytics
 *
 * Public endpoint to track analytics events for clinic landing pages.
 * Rate limited via middleware.
 *
 * Privacy:
 * - No PII stored
 * - IP addresses NOT stored
 * - Session IDs are anonymous UUIDs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const result = trackEventSchema.safeParse(body);
    if (!result.success) {
      // Return 202 anyway to not leak validation info
      // but don't store invalid data
      return NextResponse.json({ success: true }, { status: 202 });
    }

    const data = result.data;

    // Verify tenant exists and has public page enabled
    const tenant = await prisma.tenant.findFirst({
      where: {
        slug: data.tenantSlug,
        publicPageEnabled: true,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    if (!tenant) {
      // Return 202 anyway to not leak tenant existence info
      return NextResponse.json({ success: true }, { status: 202 });
    }

    // Store the event (non-blocking pattern would be ideal here)
    // For now, we await but return 202 immediately in production
    await prisma.landingPageAnalytics.create({
      data: {
        tenantId: tenant.id,
        eventType: data.eventType as AnalyticsEventType,
        eventName: data.eventName,
        pageSlug: data.pageSlug,
        referrer: data.referrer?.substring(0, 500), // Limit length
        utmSource: data.utmSource?.substring(0, 100),
        utmMedium: data.utmMedium?.substring(0, 100),
        utmCampaign: data.utmCampaign?.substring(0, 100),
        sessionId: data.sessionId,
        device: data.device,
        browser: data.browser?.substring(0, 50),
        conversionId: data.conversionId,
        // Note: We don't store country here - could be added via IP geolocation
        // but for privacy we skip it for now
      },
    });

    // Return 202 Accepted - indicates we received it and will process
    return NextResponse.json({ success: true }, { status: 202 });
  } catch (error) {
    // Log error but don't expose details
    console.error('[Analytics] Error tracking event:', error);

    // Still return 202 to not affect client behavior
    return NextResponse.json({ success: true }, { status: 202 });
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
