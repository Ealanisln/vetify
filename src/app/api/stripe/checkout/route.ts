import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { stripe } from '@/lib/payments/stripe';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    redirect('/precios?error=session_missing');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      redirect('/dashboard?success=subscription_created');
    } else {
      redirect('/precios?error=payment_failed');
    }
  } catch (error) {
    console.error('Error al recuperar la sesión de checkout:', error);
    redirect('/precios?error=session_invalid');
  }
} 