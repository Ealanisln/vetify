import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import { findOrCreateUser } from '../../../lib/db/queries/users';

export async function GET() {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();

  if (!kindeUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Use centralized findOrCreateUser function to handle concurrent requests
  let user;
  try {
    user = await findOrCreateUser({
      id: kindeUser.id,
      email: kindeUser.email || '',
      firstName: kindeUser.given_name,
      lastName: kindeUser.family_name,
      name: `${kindeUser.given_name || ''} ${kindeUser.family_name || ''}`.trim() || kindeUser.email?.split('@')[0],
    });
    
    console.log('User synced from Kinde to local database:', user.email);
  } catch (error) {
    console.error('Error syncing user from Kinde:', error);
    return new NextResponse("Error syncing user", { status: 500 });
  }

  // Enhance response with subscription details from tenant
  const response = {
    ...user,
    subscription: user.tenant ? {
      planName: user.tenant.planName,
      subscriptionStatus: user.tenant.subscriptionStatus,
      subscriptionEndsAt: user.tenant.subscriptionEndsAt,
      isTrialPeriod: user.tenant.isTrialPeriod,
      stripeSubscriptionId: user.tenant.stripeSubscriptionId,
      stripeProductId: user.tenant.stripeProductId,
      // Legacy support for existing components
      tenantSubscription: user.tenant.tenantSubscription
    } : null
  };

  return NextResponse.json(response);
} 