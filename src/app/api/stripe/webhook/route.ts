import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stripe, handleSubscriptionChange } from '@/lib/payments/stripe';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('Webhook: No signature found');
    return NextResponse.json(
      { error: 'No se encontró la firma' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('Webhook: Event received:', event.type, event.id);
  } catch (error) {
    console.error('Webhook: Error verifying signature:', error);
    return NextResponse.json(
      { error: 'Firma inválida' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('Webhook: Processing checkout.session.completed');
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('Webhook: Session details:', {
          id: session.id,
          mode: session.mode,
          payment_status: session.payment_status,
          status: session.status,
          subscription: session.subscription,
          customer: session.customer
        });

        if (session.mode === 'subscription' && session.subscription) {
          console.log('Webhook: Retrieving subscription:', session.subscription);
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          console.log('Webhook: Subscription details:', {
            id: subscription.id,
            status: subscription.status,
            trial_start: subscription.trial_start,
            trial_end: subscription.trial_end,
            current_period_end: subscription.current_period_end
          });

          await handleSubscriptionChange(subscription);
          console.log('Webhook: Subscription processed successfully');
        } else {
          console.log('Webhook: Session is not a subscription or missing subscription ID');
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        console.log(`Webhook: Processing ${event.type}`);
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log('Webhook: Subscription update details:', {
          id: subscription.id,
          status: subscription.status,
          trial_start: subscription.trial_start,
          trial_end: subscription.trial_end,
          current_period_end: subscription.current_period_end
        });

        await handleSubscriptionChange(subscription);
        console.log('Webhook: Subscription update processed successfully');
        break;
      }
      case 'invoice.payment_succeeded': {
        console.log('Webhook: Processing invoice.payment_succeeded');
        const invoice = event.data.object as Stripe.Invoice;
        
        console.log('Webhook: Invoice details:', {
          id: invoice.id,
          subscription: invoice.subscription,
          status: invoice.status,
          amount_paid: invoice.amount_paid
        });

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          await handleSubscriptionChange(subscription);
          console.log('Webhook: Invoice payment processed successfully');
        }
        break;
      }
      case 'invoice.payment_failed': {
        console.log('Webhook: Processing invoice.payment_failed');
        const invoice = event.data.object as Stripe.Invoice;
        
        console.log('Webhook: Failed invoice details:', {
          id: invoice.id,
          subscription: invoice.subscription,
          status: invoice.status,
          amount_due: invoice.amount_due
        });

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          await handleSubscriptionChange(subscription);
          console.log('Webhook: Failed payment processed successfully');
        }
        break;
      }
      default:
        console.log(`Webhook: Unhandled event: ${event.type}`);
    }

    console.log('Webhook: Event processed successfully:', event.type);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook: Error processing event:', error);
    return NextResponse.json(
      { error: 'Error al procesar webhook' },
      { status: 500 }
    );
  }
} 