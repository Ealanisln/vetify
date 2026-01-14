/**
 * Push Subscription API
 *
 * POST /api/push/subscribe - Subscribe to push notifications
 * DELETE /api/push/subscribe - Unsubscribe from push notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '@/lib/prisma';
import { getVapidPublicKey, isPushConfigured } from '@/lib/push-notifications';

export const dynamic = 'force-dynamic';

/**
 * Subscribe to push notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Check if push is configured
    if (!isPushConfigured()) {
      return NextResponse.json(
        { error: 'Push notifications not configured' },
        { status: 503 }
      );
    }

    // Get authenticated user
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant from staff record
    const staff = await prisma.staff.findUnique({
      where: { userId: user.id },
      select: { tenantId: true, id: true },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { subscription, deviceName } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Upsert subscription (update if endpoint exists, create otherwise)
    const pushSubscription = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: request.headers.get('user-agent') || undefined,
        deviceName: deviceName || undefined,
        isActive: true,
        failCount: 0,
        updatedAt: new Date(),
      },
      create: {
        tenantId: staff.tenantId,
        staffId: staff.id,
        userId: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: request.headers.get('user-agent') || undefined,
        deviceName: deviceName || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: pushSubscription.id,
    });
  } catch (error) {
    console.error('[Push Subscribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint required' },
        { status: 400 }
      );
    }

    // Find and deactivate (soft delete) the subscription
    const subscription = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (subscription.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Soft delete by marking inactive
    await prisma.pushSubscription.update({
      where: { id: subscription.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Push Unsubscribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}

/**
 * Get VAPID public key for client-side subscription
 */
export async function GET() {
  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: 'Push notifications not configured', configured: false },
      { status: 503 }
    );
  }

  return NextResponse.json({
    configured: true,
    publicKey: getVapidPublicKey(),
  });
}
