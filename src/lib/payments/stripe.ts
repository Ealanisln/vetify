import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { Tenant, SubscriptionStatus } from '@prisma/client';

/**
 * CONFIGURACIÓN DE IMPUESTOS PARA MÉXICO
 * 
 * Para el IVA del 16% en México, este código utiliza:
 * 1. `automatic_tax: { enabled: true }` - Stripe calcula automáticamente el IVA
 * 2. `tax_id_collection: { enabled: true }` - Permite recopilar RFC del cliente
 * 3. `customer_update: { name: 'auto', address: 'auto' }` - Actualiza datos automáticamente
 * 
 * CONFIGURACIÓN REQUERIDA EN STRIPE DASHBOARD:
 * 1. Ir a Configuración > Impuestos en tu dashboard de Stripe
 * 2. Habilitar "Automatic tax calculation"
 * 3. Configurar México como jurisdicción fiscal con 16% de IVA
 * 4. Configurar productos como "Servicios digitales" que están sujetos a IVA
 * 
 * Para más información: https://stripe.com/docs/tax/set-up
 */

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
});

// IDs de precios de Stripe para pesos mexicanos - Precios MVP RECURRENTES
export const STRIPE_PLANS = {
  // Plan gratuito recurrente
  FREE: 'price_1RftdmPwxz1bHxlHvj8h32S6',
  
  // Precios promocionales MVP (recurrentes)
  BASIC_MONTHLY_PROMO: 'price_1RftdkPwxz1bHxlH49ZHb4ZT',
  BASIC_YEARLY_PROMO: 'price_1RftdlPwxz1bHxlHdr6Ia4pj',
  PROFESSIONAL_MONTHLY_PROMO: 'price_1RftdlPwxz1bHxlH4oW9dMDZ',
  PROFESSIONAL_YEARLY_PROMO: 'price_1RftdmPwxz1bHxlH2lDZ07Rw',
  
  // Precios regulares (usando los mismos recurrentes)
  BASIC_MONTHLY: 'price_1RftdkPwxz1bHxlH49ZHb4ZT',
  BASIC_YEARLY: 'price_1RftdlPwxz1bHxlHdr6Ia4pj', 
  PROFESSIONAL_MONTHLY: 'price_1RftdlPwxz1bHxlH4oW9dMDZ',
  PROFESSIONAL_YEARLY: 'price_1RftdmPwxz1bHxlH2lDZ07Rw',
  
  // Plan empresarial temporalmente desactivado
  // ENTERPRISE_MONTHLY_PROMO: 'price_enterprise_monthly_promo_1499',
  // ENTERPRISE_YEARLY_PROMO: 'price_enterprise_yearly_promo_1199',
  // ENTERPRISE_MONTHLY: 'price_enterprise_monthly_1799',
  // ENTERPRISE_YEARLY: 'price_enterprise_yearly_1399',
} as const;

// Precios de planes en MXN - Precios MVP actualizados
export const PLAN_PRICES = {
  FREE: {
    monthly: 0,
    annual: 0,
  },
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
  }
  // Plan empresarial temporalmente desactivado
  // ENTERPRISE: {
  //   monthly: 1499, // MXN promocional
  //   annual: 1199,  // MXN promocional
  //   originalMonthly: 1799, // MXN regular
  //   originalAnnual: 1399,  // MXN regular
  // }
} as const;

export async function createCheckoutSession({
  tenant,
  priceId,
  userId,
  planKey,
  billingInterval = 'monthly'
}: {
  tenant: Tenant | null;
  priceId: string;
  userId: string;
  planKey?: string;
  billingInterval?: 'monthly' | 'annual';
}) {
  if (!tenant) {
    redirect(`/sign-in?redirect=checkout&priceId=${priceId}`);
  }

  // Obtener o crear cliente
  const customer = await createOrRetrieveCustomer(tenant, userId);

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/precios?canceled=true`,
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        tenantId: tenant.id,
        planKey: planKey || 'unknown',
        userId
      }
    },
    // Configuración para México
    locale: 'es-419',
    tax_id_collection: {
      enabled: true,
    },
    customer_update: {
      name: 'auto', // Permite a Stripe actualizar el nombre del cliente automáticamente
      address: 'auto' // También permite actualizar la dirección para cálculos de impuestos
    },
    automatic_tax: {
      enabled: true, // Habilita el cálculo automático de impuestos (IVA 16% en México)
    },
    metadata: {
      tenantId: tenant.id,
      planKey: planKey || 'unknown',
      userId,
      billingInterval
    }
  });

  redirect(session.url!);
}

export async function createCheckoutSessionForAPI({
  tenant,
  priceId,
  userId,
  planKey,
  billingInterval = 'monthly'
}: {
  tenant: Tenant | null;
  priceId: string;
  userId: string;
  planKey?: string;
  billingInterval?: 'monthly' | 'annual';
}) {
  if (!tenant) {
    throw new Error('Tenant is required');
  }

  // Obtener o crear cliente
  const customer = await createOrRetrieveCustomer(tenant, userId);

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/precios?canceled=true`,
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        tenantId: tenant.id,
        planKey: planKey || 'unknown',
        userId
      }
    },
    // Configuración para México
    locale: 'es-419',
    tax_id_collection: {
      enabled: true,
    },
    customer_update: {
      name: 'auto', // Permite a Stripe actualizar el nombre del cliente automáticamente
      address: 'auto' // También permite actualizar la dirección para cálculos de impuestos
    },
    automatic_tax: {
      enabled: true, // Habilita el cálculo automático de impuestos (IVA 16% en México)
    },
    metadata: {
      tenantId: tenant.id,
      planKey: planKey || 'unknown',
      userId,
      billingInterval
    }
  });

  return session;
}

export async function createCustomerPortalSession(tenant: Tenant) {
  if (!tenant.stripeCustomerId) {
    redirect('/precios');
  }

  let configuration: Stripe.BillingPortal.Configuration;
  const configurations = await stripe.billingPortal.configurations.list();

  if (configurations.data.length > 0) {
    configuration = configurations.data[0];
  } else {
    // Crear configuración predeterminada
    configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Gestiona tu suscripción de Vetify'
      },
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'quantity', 'promotion_code'],
          proration_behavior: 'create_prorations',
          products: []
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'other'
            ]
          }
        },
        payment_method_update: {
          enabled: true
        }
      }
    });
  }

  return stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
    configuration: configuration.id
  });
}

async function createOrRetrieveCustomer(tenant: Tenant, userId: string) {
  try {
    // Si ya tiene un customerId, intentar recuperarlo
    if (tenant.stripeCustomerId) {
      try {
        const existingCustomer = await stripe.customers.retrieve(tenant.stripeCustomerId);
        if (!existingCustomer.deleted) {
          return existingCustomer as Stripe.Customer;
        }
             } catch {
         console.log('Cliente de Stripe no encontrado, creando uno nuevo');
       }
    }

    // Buscar usuario para obtener email
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.email) {
      throw new Error('No se encontró email del usuario');
    }

    // Buscar clientes existentes por email
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customer: Stripe.Customer;

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
        } else {
      // Crear nuevo cliente
      const customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                          user.name || 
                          user.email.split('@')[0];
      
      customer = await stripe.customers.create({
        email: user.email,
        name: customerName,
        metadata: {
          tenantId: tenant.id,
          userId: userId,
          clinicName: tenant.name || '' // Agregar nombre de la clínica para contexto
        }
      });
    }

    // Actualizar tenant con el customerId
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { stripeCustomerId: customer.id }
    });

    return customer;
  } catch (error) {
    console.error('Error creando/recuperando cliente:', error);
    throw error;
  }
}

export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  const tenant = await prisma.tenant.findUnique({
    where: { stripeCustomerId: customerId }
  });

  if (!tenant) {
    console.error('Tenant no encontrado para el cliente de Stripe:', customerId);
    return;
  }

  if (status === 'active' || status === 'trialing') {
    const plan = subscription.items.data[0]?.plan;
    const product = await stripe.products.retrieve(plan?.product as string);
    
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        stripeSubscriptionId: subscriptionId,
        stripeProductId: plan?.product as string,
        planName: product?.name,
        subscriptionStatus: status.toUpperCase() as SubscriptionStatus,
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
        isTrialPeriod: status === 'trialing',
        status: 'ACTIVE' // Activar tenant
      }
    });
  } else if (status === 'canceled' || status === 'unpaid' || status === 'past_due') {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        stripeSubscriptionId: status === 'canceled' ? null : subscriptionId,
        stripeProductId: status === 'canceled' ? null : (subscription.items.data[0]?.plan?.product as string),
        planName: status === 'canceled' ? null : undefined,
        subscriptionStatus: status.toUpperCase() as SubscriptionStatus,
        subscriptionEndsAt: status === 'canceled' ? new Date(subscription.canceled_at! * 1000) : new Date(subscription.current_period_end * 1000),
        isTrialPeriod: false,
                 status: status === 'past_due' ? 'SUSPENDED' : (status === 'canceled' ? 'ACTIVE' : 'ACTIVE')
      }
    });
  }
}

export async function getStripePrices() {
  const prices = await stripe.prices.list({
    expand: ['data.product'],
    active: true,
    type: 'recurring'
  });

  return prices.data.map((price) => ({
    id: price.id,
    productId: typeof price.product === 'string' ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
    intervalCount: price.recurring?.interval_count,
    trialPeriodDays: price.recurring?.trial_period_days
  }));
}

export async function getStripeProducts() {
  const products = await stripe.products.list({
    active: true,
    expand: ['data.default_price']
  });

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    features: product.metadata.features ? JSON.parse(product.metadata.features) : [],
    defaultPriceId: typeof product.default_price === 'string'
      ? product.default_price
      : product.default_price?.id
  }));
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error cancelando suscripción:', error);
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
    console.error('Error actualizando suscripción:', error);
    throw error;
  }
}

export async function getSubscriptionDetails(subscriptionId: string) {
  try {
    return stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error recuperando detalles de suscripción:', error);
    throw error;
  }
}

// Función para crear productos en Stripe (para setup inicial)
export async function createStripeProducts() {
  const products = [
    {
      name: 'Plan Gratis',
      description: 'Ideal para veterinarios independientes o consultorios muy pequeños',
      features: [
        'Hasta 50 mascotas',
        '1 usuario',
        'WhatsApp básico: 50 msg/mes',
        'Expedientes básicos',
        'Citas básicas',
        'Soporte comunidad'
      ]
    },
    {
      name: 'Plan Básico',
      description: 'Ideal para clínicas pequeñas o que recién comienzan',
      features: [
        'Hasta 300 mascotas',
        '3 usuarios',
        'WhatsApp ilimitado',
        'Automatización completa',
        'Inventario básico',
        'Expedientes completos',
        'Citas avanzadas',
        'Soporte por email'
      ]
    },
    {
      name: 'Plan Profesional',
      description: 'Perfecto para clínicas establecidas con múltiples veterinarios',
      features: [
        'Hasta 1,000 mascotas',
        '8 usuarios',
        'Todo del plan Básico',
        'Reportes avanzados',
        'Multi-sucursal',
        'Analytics y métricas',
        'Soporte prioritario',
        'Integraciones avanzadas'
      ]
    }
    // Plan empresarial temporalmente desactivado
    // {
    //   name: 'Plan Empresarial',
    //   description: 'Para grandes clínicas veterinarias',
    //   features: [
    //     'Mascotas ilimitadas',
    //     'Todas las funciones del Profesional',
    //     'Multi-sede',
    //     'API personalizada',
    //     'Integración con laboratorios',
    //     'Soporte telefónico 24/7'
    //   ]
    // }
  ];

  const createdProducts = [];

  for (const productData of products) {
    try {
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: {
          features: JSON.stringify(productData.features)
        }
      });

      createdProducts.push(product);
      console.log(`✅ Producto creado: ${product.name} (${product.id})`);
    } catch (error) {
      console.error(`❌ Error creando producto ${productData.name}:`, error);
    }
  }

  return createdProducts;
}

// Obtener precio por clave de plan y intervalo
export function getPriceIdByPlan(planKey: string, interval: 'monthly' | 'annual', usePromo = true): string | null {
  const planType = planKey.toUpperCase();
  
  if (planType === 'FREE') {
    return STRIPE_PLANS.FREE;
  } else if (planType === 'BASIC') {
    if (interval === 'annual') {
      return usePromo ? STRIPE_PLANS.BASIC_YEARLY_PROMO : STRIPE_PLANS.BASIC_YEARLY;
    } else {
      return usePromo ? STRIPE_PLANS.BASIC_MONTHLY_PROMO : STRIPE_PLANS.BASIC_MONTHLY;
    }
  } else if (planType === 'PROFESSIONAL') {
    if (interval === 'annual') {
      return usePromo ? STRIPE_PLANS.PROFESSIONAL_YEARLY_PROMO : STRIPE_PLANS.PROFESSIONAL_YEARLY;
    } else {
      return usePromo ? STRIPE_PLANS.PROFESSIONAL_MONTHLY_PROMO : STRIPE_PLANS.PROFESSIONAL_MONTHLY;
    }
  }
  // Plan empresarial temporalmente desactivado
  // else if (planType === 'ENTERPRISE') {
  //   if (interval === 'annual') {
  //     return usePromo ? STRIPE_PLANS.ENTERPRISE_YEARLY_PROMO : STRIPE_PLANS.ENTERPRISE_YEARLY;
  //   } else {
  //     return usePromo ? STRIPE_PLANS.ENTERPRISE_MONTHLY_PROMO : STRIPE_PLANS.ENTERPRISE_MONTHLY;
  //   }
  // }
  
  return null;
} 