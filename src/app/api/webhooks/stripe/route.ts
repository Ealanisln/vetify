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
  try {
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

    // Get actual subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    // Update or create tenant subscription
    await prisma.tenantSubscription.upsert({
      where: { tenantId },
      update: {
        planId: plan.id,
        stripeSubscriptionId: session.subscription as string,
        status: 'ACTIVE',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: false
      },
      create: {
        tenantId,
        planId: plan.id,
        stripeSubscriptionId: session.subscription as string,
        status: 'ACTIVE',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: false
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

    // Reset usage stats for new billing period
    await prisma.tenantUsageStats.upsert({
      where: { tenantId },
      update: {
        totalPets: 0,
        totalUsers: 0,
        totalAppointments: 0,
        totalSales: 0,
        storageUsedBytes: 0
      },
      create: {
        tenantId,
        totalPets: 0,
        totalUsers: 0,
        totalAppointments: 0,
        totalSales: 0,
        storageUsedBytes: 0
      }
    });

    console.log(`Subscription activated for tenant: ${tenantId}`);
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
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

    // Update subscription period and ensure active status
    await prisma.tenantSubscription.update({
      where: { tenantId: tenant.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });

    // Reactivate tenant if it was suspended
    if (tenant.status === 'SUSPENDED') {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { status: 'ACTIVE' }
      });
    }

    // Reset usage stats for new billing period
    await prisma.tenantUsageStats.upsert({
      where: { tenantId: tenant.id },
      update: {
        totalAppointments: 0,
        totalSales: 0
      },
      create: {
        tenantId: tenant.id,
        totalPets: 0,
        totalUsers: 0,
        totalAppointments: 0,
        totalSales: 0,
        storageUsedBytes: 0
      }
    });

    console.log(`Payment succeeded for tenant: ${tenant.id}`);
  } catch (error) {
    console.error('Error in handlePaymentSucceeded:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;

    const tenant = await prisma.tenant.findFirst({
      where: { stripeCustomerId: customerId },
      include: { tenantSubscription: true }
    });

    if (!tenant) {
      console.error(`Tenant not found for customer: ${customerId}`);
      return;
    }

    // Determine status based on Stripe subscription status
    let status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING' = 'ACTIVE';
    
    switch (subscription.status) {
      case 'active':
        status = 'ACTIVE';
        break;
      case 'trialing':
        status = 'TRIALING';
        break;
      case 'past_due':
        status = 'PAST_DUE';
        break;
      case 'canceled':
      case 'incomplete_expired':
      case 'unpaid':
        status = 'CANCELLED';
        break;
    }

    // Check if plan changed
    let planUpdated = false;
    if (subscription.items.data.length > 0) {
      const stripePriceId = subscription.items.data[0].price.id;
      
      // Find the plan that matches the new price ID
      const plan = await prisma.plan.findFirst({
        where: {
          OR: [
            { features: { path: ['stripePriceId'], equals: stripePriceId } },
            { features: { path: ['stripeMonthlyPriceId'], equals: stripePriceId } },
            { features: { path: ['stripeAnnualPriceId'], equals: stripePriceId } }
          ]
        }
      });

      if (plan && tenant.tenantSubscription?.planId !== plan.id) {
        planUpdated = true;
        // Update the plan
        await prisma.tenantSubscription.update({
          where: { tenantId: tenant.id },
          data: { planId: plan.id }
        });
      }
    }

    // Update subscription
    await prisma.tenantSubscription.update({
      where: { tenantId: tenant.id },
      data: {
        status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });

    // Update tenant status based on subscription status
    let tenantStatus = tenant.status;
    if (status === 'CANCELLED' || status === 'PAST_DUE') {
      tenantStatus = 'SUSPENDED';
    } else if (status === 'ACTIVE' && tenant.status === 'SUSPENDED') {
      tenantStatus = 'ACTIVE';
    }

    if (tenantStatus !== tenant.status) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { status: tenantStatus }
      });
    }

    // If plan was upgraded/downgraded, reset relevant usage stats
    if (planUpdated) {
      await prisma.tenantUsageStats.upsert({
        where: { tenantId: tenant.id },
        update: {
          lastUpdated: new Date()
        },
        create: {
          tenantId: tenant.id,
          totalPets: 0,
          totalUsers: 0,
          totalAppointments: 0,
          totalSales: 0,
          storageUsedBytes: 0
        }
      });
    }

    console.log(`Subscription updated for tenant: ${tenant.id}, status: ${status}, plan updated: ${planUpdated}`);
  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error);
    throw error;
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;

    const tenant = await prisma.tenant.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (!tenant) {
      console.error(`Tenant not found for customer: ${customerId}`);
      return;
    }

    // Update subscription status
    await prisma.tenantSubscription.update({
      where: { tenantId: tenant.id },
      data: {
        status: 'CANCELLED',
        cancelAtPeriodEnd: true
      }
    });

    // Suspend tenant access
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { status: 'SUSPENDED' }
    });

    console.log(`Subscription cancelled for tenant: ${tenant.id}`);
  } catch (error) {
    console.error('Error in handleSubscriptionCanceled:', error);
    throw error;
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = invoice.subscription as string;
    
    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = subscription.customer as string;

    const tenant = await prisma.tenant.findFirst({
      where: { stripeCustomerId: customerId },
      include: { 
        tenantSubscription: true,
        users: { 
          where: { userRoles: { some: { role: { key: 'OWNER' } } } },
          take: 1 
        }
      }
    });

    if (!tenant) {
      console.error(`Tenant not found for customer: ${customerId}`);
      return;
    }

    // Update subscription status to past due
    await prisma.tenantSubscription.update({
      where: { tenantId: tenant.id },
      data: {
        status: 'PAST_DUE'
      }
    });

    // After multiple failed attempts, suspend the tenant
    const attemptCount = invoice.attempt_count || 0;
    if (attemptCount >= 3) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { status: 'SUSPENDED' }
      });

      console.log(`Tenant suspended after ${attemptCount} failed payment attempts: ${tenant.id}`);
    }

    // TODO: Send notification email to tenant owner about failed payment
    // This would integrate with your email service (SendGrid, Resend, etc.)
    if (tenant.users.length > 0) {
      console.log(`Payment failed for tenant: ${tenant.id}, owner email: ${tenant.users[0].email}`);
      // await sendPaymentFailedEmail(tenant.users[0].email, tenant.name, attemptCount);
    }

    console.log(`Payment failed for tenant: ${tenant.id}, attempt: ${attemptCount}`);
  } catch (error) {
    console.error('Error in handlePaymentFailed:', error);
    throw error;
  }
} 