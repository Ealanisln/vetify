import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import { stripe, handleSubscriptionChange } from '../../../../lib/payments/stripe';
import { prisma } from '../../../../lib/prisma';
import Stripe from 'stripe';

/**
 * Checkout return handler (Stripe success_url).
 *
 * Sync-first: instead of polling up to 10s for the webhook, we check the DB
 * once and — if the webhook hasn't landed yet — run the same idempotent sync
 * the webhook performs (handleSubscriptionChange) right away. The webhook
 * remains the source of truth for asynchronous updates; this path only makes
 * the post-payment redirect immediate.
 */

async function isSubscriptionSynced(
  customerId: string,
  subscriptionId: string
): Promise<{ synced: boolean; planName: string | null }> {
  const tenant = await prisma.tenant.findUnique({
    where: { stripeCustomerId: customerId },
    select: {
      stripeSubscriptionId: true,
      planName: true,
    },
  });

  return {
    synced: tenant?.stripeSubscriptionId === subscriptionId,
    planName: tenant?.planName ?? null,
  };
}

async function manualSubscriptionSync(subscription: Stripe.Subscription): Promise<boolean> {
  console.log('Manual sync: Processing subscription manually:', subscription.id);
  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.id);
    const syncSuccess = await handleSubscriptionChange(stripeSubscription);

    if (!syncSuccess) {
      console.error('Manual sync: handleSubscriptionChange returned false — DB was not updated');
      return false;
    }

    const { synced } = await isSubscriptionSynced(
      stripeSubscription.customer as string,
      stripeSubscription.id
    );

    if (!synced) {
      console.error('Manual sync: DB verification failed — stripeSubscriptionId mismatch');
      return false;
    }

    console.log('Manual sync: Successfully processed and verified subscription');
    return true;
  } catch (error) {
    console.error('Manual sync: Error processing subscription:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    console.error('Checkout: session_id missing');
    redirect('/precios?error=session_missing');
  }

  try {
    console.log('Checkout: Retrieving session:', sessionId);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('Checkout: Session details:', {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      subscription: session.subscription,
      mode: session.mode,
      customer: session.customer
    });

    if (session.status !== 'complete') {
      console.error('Checkout: Session not complete:', session.status);
      redirect('/precios?error=session_incomplete');
      return;
    }

    if (session.mode !== 'subscription' || !session.subscription) {
      console.error('Checkout: Session missing subscription or not subscription mode:', {
        mode: session.mode,
        hasSubscription: !!session.subscription
      });
      redirect('/precios?error=subscription_missing');
      return;
    }

    const isPaid = session.payment_status === 'paid';
    const isTrial = session.payment_status === 'no_payment_required' || session.payment_status === null;

    if (!isPaid && !isTrial) {
      console.error('Checkout: Payment status invalid:', session.payment_status);
      redirect('/precios?error=payment_failed');
      return;
    }

    const successParam = isTrial ? 'trial_started' : 'subscription_created';

    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = subscription.customer as string;

    // 1. Webhook may have already processed the subscription — check once
    const { synced, planName } = await isSubscriptionSynced(customerId, subscriptionId);

    if (synced) {
      console.log('Checkout: Subscription already synced by webhook - redirecting to dashboard');
      const encodedPlanName = encodeURIComponent(planName || 'unknown');
      redirect(`/dashboard?success=${successParam}&plan=${encodedPlanName}`);
    }

    // 2. Webhook hasn't landed yet — run the same idempotent sync directly
    console.log('Checkout: Webhook not processed yet, syncing subscription directly...');
    const manualSyncSuccess = await manualSubscriptionSync(subscription);

    if (manualSyncSuccess) {
      console.log('Checkout: Direct sync successful - redirecting to dashboard');
      redirect(`/dashboard?success=${successParam}&info=manual_sync`);
    }

    // 3. Sync failed — session is complete, so let the user in with a warning
    console.warn('Checkout: Direct sync failed, but session is complete - redirecting with warning');
    Sentry.captureMessage('Checkout sync_pending: direct sync failed after checkout', {
      level: 'warning',
      tags: { category: 'payments', issue: 'sync_pending' },
      contexts: {
        checkout: {
          sessionId,
          customerId,
          subscriptionId,
          paymentStatus: session.payment_status,
        },
      },
    });
    const encodedSessionId = encodeURIComponent(sessionId);
    redirect(`/dashboard?success=${successParam}&warning=sync_pending&session_id=${encodedSessionId}`);
  } catch (error) {
    // Don't catch redirect errors - let them propagate normally
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Checkout: Error processing checkout:', error);
    redirect('/precios?error=processing_failed&details=' + encodeURIComponent(String(error)));
  }
}
