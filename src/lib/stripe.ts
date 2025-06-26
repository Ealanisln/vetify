import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export const STRIPE_PLANS = {
  BASIC: 'price_basic_monthly',
  STANDARD: 'price_standard_monthly', 
  PREMIUM: 'price_premium_monthly'
} as const;

export async function createCheckoutSession(
  tenantId: string,
  planKey: string,
  userId: string
) {
  const plan = await prisma.plan.findUnique({
    where: { key: planKey }
  });

  if (!plan) throw new Error('Plan no encontrado');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS],
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.KINDE_SITE_URL}/dashboard?success=true`,
    cancel_url: `${process.env.KINDE_SITE_URL}/precios?canceled=true`,
    metadata: {
      tenantId,
      planKey,
      userId
    }
  });

  return session;
}

export async function createCustomerPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.KINDE_SITE_URL}/dashboard/settings`,
  });

  return session;
}

export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

export async function updateSubscription(subscriptionId: string, priceId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: priceId,
    }],
    proration_behavior: 'always_invoice',
  });

  return updatedSubscription;
}

export async function getSubscriptionDetails(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function createOrRetrieveCustomer(email: string, tenantId: string) {
  const existingCustomers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  const customer = await stripe.customers.create({
    email,
    metadata: {
      tenantId,
    },
  });

  return customer;
} 