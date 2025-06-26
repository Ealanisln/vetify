import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
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
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { tenantId, planKey } = session.metadata!;
  
  if (!tenantId || !planKey) {
    console.error('Missing metadata in checkout session');
    return;
  }
  
  const plan = await prisma.plan.findUnique({
    where: { key: planKey }
  });

  if (!plan) {
    console.error(`Plan not found: ${planKey}`);
    return;
  }

  // Update or create tenant subscription
  await prisma.tenantSubscription.upsert({
    where: { tenantId },
    update: {
      planId: plan.id,
      stripeSubscriptionId: session.subscription as string,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    },
    create: {
      tenantId,
      planId: plan.id,
      stripeSubscriptionId: session.subscription as string,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  });

  // Update tenant status
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { 
      status: 'ACTIVE',
      isTrialPeriod: false,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string
    }
  });

  console.log(`Subscription activated for tenant: ${tenantId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = subscription.customer as string;

  // Find tenant by stripe customer ID
  const tenant = await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!tenant) {
    console.error(`Tenant not found for customer: ${customerId}`);
    return;
  }

  // Update subscription period
  await prisma.tenantSubscription.update({
    where: { tenantId: tenant.id },
    data: {
      status: 'ACTIVE',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    }
  });

  console.log(`Payment succeeded for tenant: ${tenant.id}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const tenant = await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!tenant) {
    console.error(`Tenant not found for customer: ${customerId}`);
    return;
  }

  let status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' = 'ACTIVE';
  
  switch (subscription.status) {
    case 'active':
      status = 'ACTIVE';
      break;
    case 'past_due':
      status = 'PAST_DUE';
      break;
    case 'canceled':
    case 'incomplete_expired':
      status = 'CANCELLED';
      break;
  }

  await prisma.tenantSubscription.update({
    where: { tenantId: tenant.id },
    data: {
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    }
  });

  // Update tenant status if subscription is cancelled
  if (status === 'CANCELLED') {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { status: 'SUSPENDED' }
    });
  }

  console.log(`Subscription updated for tenant: ${tenant.id}, status: ${status}`);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const tenant = await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!tenant) {
    console.error(`Tenant not found for customer: ${customerId}`);
    return;
  }

  await prisma.tenantSubscription.update({
    where: { tenantId: tenant.id },
    data: {
      status: 'CANCELLED',
      cancelAtPeriodEnd: true
    }
  });

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { status: 'SUSPENDED' }
  });

  console.log(`Subscription cancelled for tenant: ${tenant.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = subscription.customer as string;

  const tenant = await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!tenant) {
    console.error(`Tenant not found for customer: ${customerId}`);
    return;
  }

  await prisma.tenantSubscription.update({
    where: { tenantId: tenant.id },
    data: {
      status: 'PAST_DUE'
    }
  });

  console.log(`Payment failed for tenant: ${tenant.id}`);
} 