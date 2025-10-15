import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stripe, handleSubscriptionChange } from '../../../../lib/payments/stripe';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  console.log('=== WEBHOOK DEBUG START ===');
  console.log('Webhook: Received request');
  console.log('Webhook: Body length:', body.length);
  console.log('Webhook: Signature present:', !!signature);
  console.log('Webhook: STRIPE_WEBHOOK_SECRET present:', !!process.env.STRIPE_WEBHOOK_SECRET);

  if (!signature) {
    console.error('Webhook: No signature found in headers');
    console.log('Webhook: Available headers:', Object.keys(headersList));
    return NextResponse.json(
      { error: 'No se encontró la firma' },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Webhook: STRIPE_WEBHOOK_SECRET environment variable is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('Webhook: Event received and verified successfully:', event.type, event.id);
  } catch (error) {
    console.error('Webhook: Error verifying signature:', error);
    console.log('Webhook: Signature:', signature?.substring(0, 20) + '...');
    console.log('Webhook: Secret configured:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 20) + '...');
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
            current_period_end: subscription.current_period_end,
            customer: subscription.customer
          });

          // ✅ Cancel any other active subscriptions for this customer
          const customerId = subscription.customer as string;
          const otherSubscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 100
          });

          for (const otherSub of otherSubscriptions.data) {
            if (otherSub.id !== subscription.id) {
              console.log(`Webhook: Canceling duplicate subscription ${otherSub.id}`);
              await stripe.subscriptions.cancel(otherSub.id);
            }
          }

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
          current_period_end: subscription.current_period_end,
          customer: subscription.customer
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
          amount_paid: invoice.amount_paid,
          customer: invoice.customer
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
          customer: invoice.customer
        });

        // Could handle failed payments here if needed
        break;
      }
      default: {
        console.log('Webhook: Unhandled event type:', event.type);
      }
    }

    console.log('=== WEBHOOK DEBUG END SUCCESS ===');
    return NextResponse.json({ received: true, event_type: event.type });
  } catch (error) {
    console.error('Webhook: Error processing event:', error);
    console.log('=== WEBHOOK DEBUG END ERROR ===');
    return NextResponse.json(
      { error: 'Error al procesar webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 