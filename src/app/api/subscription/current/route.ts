import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from '../../../../lib/prisma';
import { NextResponse } from "next/server";

export async function GET() {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();

  if (!kindeUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Find user with tenant information
    const user = await prisma.user.findUnique({
      where: {
        id: kindeUser.id,
      },
      select: {
        id: true,
        email: true,
        tenant: {
          select: {
            id: true,
            name: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            stripeProductId: true,
            planName: true,
            subscriptionStatus: true,
            subscriptionEndsAt: true,
            isTrialPeriod: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (!user || !user.tenant) {
      return NextResponse.json({
        hasSubscription: false,
        subscriptionStatus: null,
        planName: null,
        error: "No tenant found"
      });
    }

    const tenant = user.tenant;
    
    // Determine if user has an active subscription
    const hasActiveSubscription = !!(
      tenant.stripeSubscriptionId && 
      tenant.subscriptionStatus && 
      ['ACTIVE', 'TRIALING'].includes(tenant.subscriptionStatus)
    );

    // Calculate trial status
    const isInTrial = tenant.isTrialPeriod && tenant.subscriptionStatus === 'TRIALING';
    
    // Calculate days remaining for trial or subscription
    let daysRemaining = null;
    if (tenant.subscriptionEndsAt) {
      const now = new Date();
      const endDate = new Date(tenant.subscriptionEndsAt);
      const diffTime = endDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const subscriptionInfo = {
      hasSubscription: hasActiveSubscription,
      subscriptionStatus: tenant.subscriptionStatus,
      planName: tenant.planName,
      isTrialPeriod: tenant.isTrialPeriod,
      isInTrial,
      subscriptionEndsAt: tenant.subscriptionEndsAt,
      daysRemaining,
      stripeSubscriptionId: tenant.stripeSubscriptionId,
      stripeProductId: tenant.stripeProductId,
      tenantStatus: tenant.status,
      lastUpdated: tenant.updatedAt
    };

    console.log('Subscription current API response:', subscriptionInfo);

    return NextResponse.json(subscriptionInfo);
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch subscription status',
        hasSubscription: false,
        subscriptionStatus: null,
        planName: null
      },
      { status: 500 }
    );
  }
}
