import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '../../../../lib/prisma';
import { stripe } from '../../../../lib/payments/stripe';

export async function GET() {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();

    if (!isAuthenticated() || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener el tenant del usuario
    const tenant = await prisma.tenant.findFirst({
      where: {
        users: {
          some: {
            id: user.id
          }
        }
      },
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
        trialEndsAt: true,
        status: true
      }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      );
    }

    // Si hay una suscripción de Stripe, obtener detalles adicionales
    let subscriptionDetails = null;
    if (tenant.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
        
        subscriptionDetails = {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          items: subscription.items.data.map(item => ({
            priceId: item.price.id,
            quantity: item.quantity,
            interval: item.price.recurring?.interval,
            intervalCount: item.price.recurring?.interval_count
          }))
        };
      } catch (error) {
        console.error('Error retrieving subscription from Stripe:', error);
      }
    }

    // Calcular días restantes de trial
    let trialDaysRemaining = null;
    if (tenant.isTrialPeriod && tenant.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(tenant.trialEndsAt);
      const diffTime = trialEnd.getTime() - now.getTime();
      trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Calcular días restantes de suscripción
    let subscriptionDaysRemaining = null;
    if (tenant.subscriptionEndsAt) {
      const now = new Date();
      const subscriptionEnd = new Date(tenant.subscriptionEndsAt);
      const diffTime = subscriptionEnd.getTime() - now.getTime();
      subscriptionDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const response = {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        status: tenant.status
      },
      subscription: {
        status: tenant.subscriptionStatus,
        planName: tenant.planName,
        isTrialPeriod: tenant.isTrialPeriod,
        trialDaysRemaining,
        subscriptionDaysRemaining,
        endsAt: tenant.subscriptionEndsAt,
        trialEndsAt: tenant.trialEndsAt
      },
      stripe: {
        customerId: tenant.stripeCustomerId,
        subscriptionId: tenant.stripeSubscriptionId,
        productId: tenant.stripeProductId,
        details: subscriptionDetails
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 