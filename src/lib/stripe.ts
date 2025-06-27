import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Stripe Price IDs for Mexican pesos - Updated MVP Pricing
export const STRIPE_PLANS = {
  // Precios regulares
  BASIC_MONTHLY: 'price_basic_monthly_599',
  BASIC_YEARLY: 'price_basic_yearly_399', 
  PROFESSIONAL_MONTHLY: 'price_professional_monthly_1199',
  PROFESSIONAL_YEARLY: 'price_professional_yearly_799',
  
  // Precios promocionales MVP
  BASIC_MONTHLY_PROMO: 'price_basic_monthly_promo_449',
  BASIC_YEARLY_PROMO: 'price_basic_yearly_promo_349',
  PROFESSIONAL_MONTHLY_PROMO: 'price_professional_monthly_promo_899',
  PROFESSIONAL_YEARLY_PROMO: 'price_professional_yearly_promo_649',
  
  // Legacy pricing (for backward compatibility)
  STANDARD_MONTHLY: 'price_professional_monthly_1199',
  STANDARD_ANNUAL: 'price_professional_yearly_799'
} as const;

// Plan pricing in MXN - Updated MVP Pricing
export const PLAN_PRICES = {
  BASIC: {
    monthly: 449, // MXN promocional
    annual: 349,  // MXN promocional
    originalMonthly: 599, // MXN regular
    originalAnnual: 399,  // MXN regular
  },
  PROFESSIONAL: {
    monthly: 899, // MXN promocional
    annual: 649,  // MXN promocional
    originalMonthly: 1199, // MXN regular
    originalAnnual: 799,   // MXN regular
  },
  // Legacy support
  STANDARD: {
    monthly: 899, // MXN promocional
    annual: 649,  // MXN promocional
  }
} as const;

export async function createCheckoutSession(
  tenantId: string,
  planKey: string,
  userId: string,
  billingInterval: 'monthly' | 'annual' = 'monthly'
) {
  try {
    const plan = await prisma.plan.findUnique({
      where: { key: planKey }
    });

    if (!plan) {
      throw new Error(`Plan no encontrado: ${planKey}`);
    }

    // Get the correct Stripe price ID based on plan and billing interval
    // Use promotional pricing during MVP period
    let priceId: string;
    const planType = planKey.toUpperCase();
    const usePromo = true; // Feature flag for promotional pricing
    
    if (planType === 'BASIC') {
      if (billingInterval === 'annual') {
        priceId = usePromo ? STRIPE_PLANS.BASIC_YEARLY_PROMO : STRIPE_PLANS.BASIC_YEARLY;
      } else {
        priceId = usePromo ? STRIPE_PLANS.BASIC_MONTHLY_PROMO : STRIPE_PLANS.BASIC_MONTHLY;
      }
    } else if (planType === 'PROFESSIONAL' || planType === 'STANDARD') {
      if (billingInterval === 'annual') {
        priceId = usePromo ? STRIPE_PLANS.PROFESSIONAL_YEARLY_PROMO : STRIPE_PLANS.PROFESSIONAL_YEARLY;
      } else {
        priceId = usePromo ? STRIPE_PLANS.PROFESSIONAL_MONTHLY_PROMO : STRIPE_PLANS.PROFESSIONAL_MONTHLY;
      }
    } else {
      throw new Error(`Plan no soportado: ${planKey}`);
    }

    if (!priceId) {
      throw new Error(`Precio de Stripe no configurado para ${planKey} ${billingInterval}`);
    }

    // Get or create customer
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { users: { where: { id: userId }, take: 1 } }
    });

    if (!tenant || !tenant.users[0]) {
      throw new Error('Tenant o usuario no encontrado');
    }

    const customer = await createOrRetrieveCustomer(tenant.users[0].email!, tenantId);

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.KINDE_SITE_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.KINDE_SITE_URL}/precios?canceled=true`,
      metadata: {
        tenantId,
        planKey,
        userId,
        billingInterval
      },
      subscription_data: {
        metadata: {
          tenantId,
          planKey,
          userId
        }
      },
      // Enable tax collection for Mexican businesses
      tax_id_collection: {
        enabled: true,
      },
      // Mexican locale
      locale: 'es-419',
      // Allow promotion codes
      allow_promotion_codes: true,
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function createCustomerPortalSession(customerId: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.KINDE_SITE_URL}/dashboard/settings`,
    });

    return session;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

export async function updateSubscription(subscriptionId: string, priceId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: priceId,
      }],
      proration_behavior: 'always_invoice',
    });

    return updatedSubscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

export async function getSubscriptionDetails(subscriptionId: string) {
  try {
    return stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

export async function createOrRetrieveCustomer(email: string, tenantId: string) {
  try {
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
  } catch (error) {
    console.error('Error creating/retrieving customer:', error);
    throw error;
  }
}

/**
 * Create Stripe products and prices for Mexican market - MVP Pricing
 * This function creates both regular and promotional prices
 */
export async function createStripeProducts() {
  try {
    console.log('🚀 Creating Stripe products for MVP pricing...\n');

    // Create BASIC plan
    const basicProduct = await stripe.products.create({
      name: 'Vetify Básico',
      description: 'Plan básico para clínicas veterinarias pequeñas - 300 mascotas, 3 usuarios',
      metadata: {
        planKey: 'BASIC'
      }
    });

    // Create BASIC regular prices
    const basicMonthlyRegular = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 59900, // $599 MXN
      currency: 'mxn',
      recurring: { interval: 'month' },
      nickname: 'Basic Monthly Regular',
      metadata: { planKey: 'BASIC', interval: 'monthly', type: 'regular' }
    });

    const basicYearlyRegular = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 39900, // $399 MXN
      currency: 'mxn',
      recurring: { interval: 'year' },
      nickname: 'Basic Yearly Regular',
      metadata: { planKey: 'BASIC', interval: 'yearly', type: 'regular' }
    });

    // Create BASIC promotional prices
    const basicMonthlyPromo = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 44900, // $449 MXN (promotional)
      currency: 'mxn',
      recurring: { interval: 'month' },
      nickname: 'Basic Monthly Promo - 25% OFF',
      metadata: { planKey: 'BASIC', interval: 'monthly', type: 'promotional' }
    });

    const basicYearlyPromo = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 34900, // $349 MXN (promotional)
      currency: 'mxn',
      recurring: { interval: 'year' },
      nickname: 'Basic Yearly Promo - 25% OFF',
      metadata: { planKey: 'BASIC', interval: 'yearly', type: 'promotional' }
    });

    // Create PROFESSIONAL plan
    const professionalProduct = await stripe.products.create({
      name: 'Vetify Profesional',
      description: 'Plan profesional para clínicas establecidas - 1000 mascotas, 8 usuarios',
      metadata: {
        planKey: 'PROFESSIONAL'
      }
    });

    // Create PROFESSIONAL regular prices
    const professionalMonthlyRegular = await stripe.prices.create({
      product: professionalProduct.id,
      unit_amount: 119900, // $1199 MXN
      currency: 'mxn',
      recurring: { interval: 'month' },
      nickname: 'Professional Monthly Regular',
      metadata: { planKey: 'PROFESSIONAL', interval: 'monthly', type: 'regular' }
    });

    const professionalYearlyRegular = await stripe.prices.create({
      product: professionalProduct.id,
      unit_amount: 79900, // $799 MXN
      currency: 'mxn',
      recurring: { interval: 'year' },
      nickname: 'Professional Yearly Regular',
      metadata: { planKey: 'PROFESSIONAL', interval: 'yearly', type: 'regular' }
    });

    // Create PROFESSIONAL promotional prices
    const professionalMonthlyPromo = await stripe.prices.create({
      product: professionalProduct.id,
      unit_amount: 89900, // $899 MXN (promotional)
      currency: 'mxn',
      recurring: { interval: 'month' },
      nickname: 'Professional Monthly Promo - 25% OFF',
      metadata: { planKey: 'PROFESSIONAL', interval: 'monthly', type: 'promotional' }
    });

    const professionalYearlyPromo = await stripe.prices.create({
      product: professionalProduct.id,
      unit_amount: 64900, // $649 MXN (promotional)
      currency: 'mxn',
      recurring: { interval: 'year' },
      nickname: 'Professional Yearly Promo - 25% OFF',
      metadata: { planKey: 'PROFESSIONAL', interval: 'yearly', type: 'promotional' }
    });

    console.log('✅ Stripe products and prices created successfully!\n');
    console.log('📋 Update your STRIPE_PLANS constants with these price IDs:\n');
    
    console.log('// Regular prices');
    console.log(`BASIC_MONTHLY: '${basicMonthlyRegular.id}',`);
    console.log(`BASIC_YEARLY: '${basicYearlyRegular.id}',`);
    console.log(`PROFESSIONAL_MONTHLY: '${professionalMonthlyRegular.id}',`);
    console.log(`PROFESSIONAL_YEARLY: '${professionalYearlyRegular.id}',\n`);
    
    console.log('// Promotional prices');
    console.log(`BASIC_MONTHLY_PROMO: '${basicMonthlyPromo.id}',`);
    console.log(`BASIC_YEARLY_PROMO: '${basicYearlyPromo.id}',`);
    console.log(`PROFESSIONAL_MONTHLY_PROMO: '${professionalMonthlyPromo.id}',`);
    console.log(`PROFESSIONAL_YEARLY_PROMO: '${professionalYearlyPromo.id}',\n`);

    return {
      products: [basicProduct, professionalProduct],
      prices: [
        basicMonthlyRegular, basicYearlyRegular, basicMonthlyPromo, basicYearlyPromo,
        professionalMonthlyRegular, professionalYearlyRegular, professionalMonthlyPromo, professionalYearlyPromo
      ]
    };
  } catch (error) {
    console.error('❌ Error creating Stripe products:', error);
    throw error;
  }
} 