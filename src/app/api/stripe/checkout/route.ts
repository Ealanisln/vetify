import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { stripe } from '@/lib/payments/stripe';

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
      mode: session.mode
    });

    // Verificar que la sesión está completa y tiene una suscripción
    if (session.status === 'complete' && session.subscription) {
      console.log('Checkout: Session completed successfully with subscription');
      
      // Para trials, payment_status puede ser null o no_payment_required
      const isPaid = session.payment_status === 'paid';
      const isTrial = session.payment_status === 'no_payment_required' || session.payment_status === null;
      
      if (isPaid || isTrial) {
        console.log('Checkout: Payment verified - redirecting to dashboard');
        const successParam = isTrial ? 'trial_started' : 'subscription_created';
        redirect(`/dashboard?success=${successParam}`);
      } else {
        console.error('Checkout: Payment status invalid:', session.payment_status);
        redirect('/precios?error=payment_failed');
      }
    } else {
      console.error('Checkout: Session not complete or missing subscription:', {
        status: session.status,
        hasSubscription: !!session.subscription
      });
      redirect('/precios?error=session_incomplete');
    }
  } catch (error) {
    console.error('Checkout: Error retrieving session:', error);
    redirect('/precios?error=session_invalid');
  }
} 