import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { stripe, handleSubscriptionChange } from '@/lib/payments/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// Type for the subscription result in waitForSubscriptionCreation
type TenantSubscription = {
  id: string;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string;
  planName: string | null;
  stripeCustomerId: string | null;
};

type SubscriptionWaitResult = {
  success: boolean;
  subscription?: TenantSubscription | Stripe.Checkout.Session;
  shouldFallback?: boolean;
};

// Type guard to check if subscription is a tenant object
function isTenantSubscription(subscription: TenantSubscription | Stripe.Checkout.Session): subscription is TenantSubscription {
  return 'planName' in subscription;
}

// Helper function to manually sync subscription when webhook fails
async function manualSubscriptionSync(subscription: Stripe.Subscription) {
  console.log('Manual sync: Processing subscription manually:', subscription.id);
  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.id);
    await handleSubscriptionChange(stripeSubscription);
    console.log('Manual sync: Successfully processed subscription');
    return true;
  } catch (error) {
    console.error('Manual sync: Error processing subscription:', error);
    return false;
  }
}

// Helper function to wait for subscription to be created in database
async function waitForSubscriptionCreation(
  sessionId: string,
  maxAttempts: number = 5, // Reduced attempts for faster fallback
  delayMs: number = 2000 // Increased delay for webhook processing
): Promise<SubscriptionWaitResult> {
  console.log(`Checkout: Waiting for subscription creation, sessionId: ${sessionId}`);
  
  let sessionData;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Checkout: Attempt ${attempt}/${maxAttempts} - Checking subscription status`);
      
      // Get session to find subscription ID
      sessionData = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (!sessionData.subscription) {
        console.log('Checkout: No subscription found in session yet');
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      // Check if tenant record has been updated with subscription data
      const subscription = await stripe.subscriptions.retrieve(sessionData.subscription as string);
      const customerId = subscription.customer as string;
      
      const tenant = await prisma.tenant.findUnique({
        where: { stripeCustomerId: customerId },
        select: {
          id: true,
          stripeSubscriptionId: true,
          subscriptionStatus: true,
          planName: true,
          stripeCustomerId: true
        }
      });

      if (tenant?.stripeSubscriptionId === subscription.id) {
        console.log('Checkout: Subscription successfully created and synced to database');
        return { success: true, subscription: tenant };
      }

      console.log(`Checkout: Subscription not synced yet (attempt ${attempt}), waiting...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
    } catch (error) {
      console.error(`Checkout: Error checking subscription status (attempt ${attempt}):`, error);
      if (attempt === maxAttempts) {
        // Return session data for fallback processing
        return { 
          success: false, 
          shouldFallback: true,
          subscription: sessionData 
        };
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log('Checkout: Timeout waiting for subscription creation - will try manual sync');
  return { 
    success: false, 
    shouldFallback: true,
    subscription: sessionData 
  };
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

    // Verificar que la sesión está completa
    if (session.status !== 'complete') {
      console.error('Checkout: Session not complete:', session.status);
      redirect('/precios?error=session_incomplete');
      return;
    }

    // Para sesiones de suscripción, esperar a que se procese el webhook
    if (session.mode === 'subscription' && session.subscription) {
      console.log('Checkout: Subscription session detected, waiting for webhook processing...');
      
      const result = await waitForSubscriptionCreation(sessionId);
      
      if (result.success) {
        // Success - webhook processed the subscription
        const isPaid = session.payment_status === 'paid';
        const isTrial = session.payment_status === 'no_payment_required' || session.payment_status === null;
        
        if (isPaid || isTrial) {
          console.log('Checkout: Payment verified and subscription synced - redirecting to dashboard');
          const successParam = isTrial ? 'trial_started' : 'subscription_created';
          const planName = result.subscription && isTenantSubscription(result.subscription) 
            ? result.subscription.planName || 'unknown' 
            : 'unknown';
          // URL encode plan name to handle non-ASCII characters
          const encodedPlanName = encodeURIComponent(planName);
          redirect(`/dashboard?success=${successParam}&plan=${encodedPlanName}`);
        } else {
          console.error('Checkout: Payment status invalid:', session.payment_status);
          redirect('/precios?error=payment_failed');
        }
      } else if (result.shouldFallback && session.subscription) {
        // Webhook timeout - try manual sync
        console.warn('Checkout: Webhook timeout, attempting manual subscription sync...');
        
        // Get the full subscription object for manual sync
        const subscriptionId = typeof session.subscription === 'string' 
          ? session.subscription 
          : session.subscription.id;
        const fullSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        const manualSyncSuccess = await manualSubscriptionSync(fullSubscription);
        
        if (manualSyncSuccess) {
          console.log('Checkout: Manual sync successful - redirecting to dashboard');
          const isTrial = session.payment_status === 'no_payment_required' || session.payment_status === null;
          const successParam = isTrial ? 'trial_started' : 'subscription_created';
          redirect(`/dashboard?success=${successParam}&info=manual_sync`);
        } else {
          console.warn('Checkout: Manual sync failed, but session is complete - redirecting with warning');
          const encodedSessionId = encodeURIComponent(sessionId);
          redirect(`/dashboard?success=subscription_created&warning=sync_pending&session_id=${encodedSessionId}`);
        }
      } else {
        // Complete fallback - redirect with warning
        console.warn('Checkout: All sync attempts failed, but session is complete - redirecting with warning');
        const isTrial = session.payment_status === 'no_payment_required' || session.payment_status === null;
        const successParam = isTrial ? 'trial_started' : 'subscription_created';
        const encodedSessionId = encodeURIComponent(sessionId);
        redirect(`/dashboard?success=${successParam}&warning=sync_pending&session_id=${encodedSessionId}`);
      }
    } else {
      console.error('Checkout: Session missing subscription or not subscription mode:', {
        mode: session.mode,
        hasSubscription: !!session.subscription
      });
      redirect('/precios?error=subscription_missing');
    }
  } catch (error) {
    // Don't catch redirect errors - let them propagate normally
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Checkout: Error processing checkout:', error);
    redirect('/precios?error=processing_failed&details=' + encodeURIComponent(String(error)));
  }
} 