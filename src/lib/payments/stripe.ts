import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { prisma } from '../prisma';

// Type for Stripe subscription creation data
interface StripeSubscriptionData {
  metadata: {
    tenantId: string;
    planKey: string;
    userId: string;
    hadLocalTrial: string;
  };
  trial_period_days?: number;
}
import type { Tenant, SubscriptionStatus } from '@prisma/client';

/**
 * Determina si un tenant debe recibir trial en Stripe
 * Solo dar trial si nunca ha tenido trial local
 */
function shouldGiveStripeTrial(tenant: Tenant): boolean {
  // Si nunca ha tenido trial local (no tiene trialEndsAt), puede tener trial en Stripe
  if (!tenant.trialEndsAt) {
    return true;
  }
  
  // Si ya tuvo trial local (existe trialEndsAt), NO dar trial en Stripe
  return false;
}

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

// Stripe client configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// IDs de productos y precios de Stripe - Nueva estructura B2B
export const STRIPE_PRODUCTS = {
  PROFESIONAL: 'prod_Seq8I3438TwbPQ',  // Plan Profesional B2B
  CLINICA: 'prod_Seq84VFkBvXUhI',      // Plan Clínica B2B
  EMPRESA: 'prod_Seq8KU7nw8WucQ'       // Plan Empresa B2B
} as const;

export const STRIPE_PRICES = {
  PROFESIONAL: {
    monthly: 'price_1RjWSPPwxz1bHxlH60v9GJjX',
    annual: 'price_1S1frxPwxz1bHxlHVcpmMKtx', // ACTUALIZADO con nuevo precio anual
  },
  CLINICA: {
    monthly: 'price_1RjWSQPwxz1bHxlHTcG2kbJA',
    annual: 'price_1S1fryPwxz1bHxlHLL5IVhBC', // ACTUALIZADO con nuevo precio anual
  },
  EMPRESA: {
    monthly: 'price_1RjWSRPwxz1bHxlHHp1pVI43',
    annual: 'price_1S1fryPwxz1bHxlHG1peVtLR', // ACTUALIZADO con nuevo precio anual
  }
} as const;

// Precios de planes en MXN - Nueva estructura B2B
export const PLAN_PRICES = {
  PROFESIONAL: {
    monthly: 599, // Plan Profesional B2B
    annual: 5750,  // Plan Profesional B2B anual - ACTUALIZADO
  },
  CLINICA: {
    monthly: 999, // Plan Clínica B2B
    annual: 9590,  // Plan Clínica B2B anual - ACTUALIZADO
  },
  EMPRESA: {
    monthly: 1799, // Plan Empresa B2B
    annual: 17270,  // Plan Empresa B2B anual - ACTUALIZADO
  }
} as const;

// Mapeo de productos/precios para facilitar las operaciones
export const STRIPE_PLAN_MAPPING = {
  'PROFESIONAL': {
    productId: STRIPE_PRODUCTS.PROFESIONAL,
    prices: STRIPE_PRICES.PROFESIONAL,
    limits: { pets: 300, users: 3, whatsappMessages: -1 }
  },
  'CLINICA': {
    productId: STRIPE_PRODUCTS.CLINICA,
    prices: STRIPE_PRICES.CLINICA,
    limits: { pets: 1000, users: 8, whatsappMessages: -1 }
  },
  'EMPRESA': {
    productId: STRIPE_PRODUCTS.EMPRESA,
    prices: STRIPE_PRICES.EMPRESA,
    limits: { pets: -1, users: 20, whatsappMessages: -1 }
  }
} as const;

export { stripe };

// Función para obtener precio por lookup key
export async function getPriceByLookupKey(lookupKey: string): Promise<string | null> {
  try {
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      expand: ['data.product']
    });
    
    return prices.data[0]?.id || null;
  } catch (error) {
    console.error('Error getting price by lookup key:', error);
    return null;
  }
}

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

  // Determinar si debe tener trial en Stripe
  // Solo dar trial si nunca ha tenido trial local o el trial local aún está activo
  const shouldHaveStripeTrial = shouldGiveStripeTrial(tenant);
  
  console.log('createCheckoutSession: Trial decision for tenant', tenant.id, {
    isTrialPeriod: tenant.isTrialPeriod,
    trialEndsAt: tenant.trialEndsAt,
    subscriptionStatus: tenant.subscriptionStatus,
    shouldHaveStripeTrial
  });

  const subscriptionData: StripeSubscriptionData = {
    metadata: {
      tenantId: tenant.id,
      planKey: planKey || 'unknown',
      userId,
      hadLocalTrial: tenant.trialEndsAt ? 'true' : 'false'
    }
  };

  // Solo agregar trial_period_days si nunca tuvo trial local
  if (shouldHaveStripeTrial) {
    subscriptionData.trial_period_days = 30;
    console.log('createCheckoutSession: Adding 30-day Stripe trial for new user');
  } else {
    console.log('createCheckoutSession: No Stripe trial - user already had local trial');
  }

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
    subscription_data: subscriptionData,
    // Configuración para México - SIN automatic tax ya que no está soportado en todos los países
    locale: 'es-419',
    // tax_id_collection: {
    //   enabled: true,
    // },
    // customer_update: {
    //   name: 'auto', // Permite a Stripe actualizar el nombre del cliente automáticamente
    //   address: 'auto' // También permite actualizar la dirección para cálculos de impuestos
    // },
    // automatic_tax: {
    //   enabled: true, // Habilita el cálculo automático de impuestos (IVA 16% en México)
    // },
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

  // Determinar si debe tener trial en Stripe
  // Solo dar trial si nunca ha tenido trial local o el trial local aún está activo
  const shouldHaveStripeTrial = shouldGiveStripeTrial(tenant);
  
  console.log('createCheckoutSessionForAPI: Trial decision for tenant', tenant.id, {
    isTrialPeriod: tenant.isTrialPeriod,
    trialEndsAt: tenant.trialEndsAt,
    subscriptionStatus: tenant.subscriptionStatus,
    shouldHaveStripeTrial
  });

  const subscriptionData: StripeSubscriptionData = {
    metadata: {
      tenantId: tenant.id,
      planKey: planKey || 'unknown',
      userId,
      hadLocalTrial: tenant.trialEndsAt ? 'true' : 'false'
    }
  };

  // Solo agregar trial_period_days si nunca tuvo trial local
  if (shouldHaveStripeTrial) {
    subscriptionData.trial_period_days = 30;
    console.log('createCheckoutSessionForAPI: Adding 30-day Stripe trial for new user');
  } else {
    console.log('createCheckoutSessionForAPI: No Stripe trial - user already had local trial');
  }

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
    subscription_data: subscriptionData,
    // Configuración para México - SIN automatic tax ya que no está soportado en todos los países
    locale: 'es-419',
    // tax_id_collection: {
    //   enabled: true,
    // },
    // customer_update: {
    //   name: 'auto', // Permite a Stripe actualizar el nombre del cliente automáticamente
    //   address: 'auto' // También permite actualizar la dirección para cálculos de impuestos
    // },
    // automatic_tax: {
    //   enabled: true, // Habilita el cálculo automático de impuestos (IVA 16% en México)
    // },
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
          products: [
            {
              product: STRIPE_PRODUCTS.PROFESIONAL,
              prices: Object.values(STRIPE_PRICES.PROFESIONAL)
            },
            {
              product: STRIPE_PRODUCTS.CLINICA,
              prices: Object.values(STRIPE_PRICES.CLINICA)
            },
            {
              product: STRIPE_PRODUCTS.EMPRESA,
              prices: Object.values(STRIPE_PRICES.EMPRESA)
            }
          ]
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

  console.log('handleSubscriptionChange: Processing subscription:', {
    subscriptionId,
    customerId,
    status,
    trial_start: subscription.trial_start,
    trial_end: subscription.trial_end,
    current_period_end: subscription.current_period_end
  });

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { stripeCustomerId: customerId }
    });

    if (!tenant) {
      console.error('handleSubscriptionChange: Tenant not found for Stripe customer:', customerId);
      
      // Try to find tenant by subscription ID in case of race condition
      const tenantBySubscription = await prisma.tenant.findFirst({
        where: { stripeSubscriptionId: subscriptionId }
      });
      
      if (tenantBySubscription) {
        console.log('handleSubscriptionChange: Found tenant by subscription ID, updating customer ID');
        await prisma.tenant.update({
          where: { id: tenantBySubscription.id },
          data: { stripeCustomerId: customerId }
        });
        // Continue with the found tenant
        await updateTenantSubscription(tenantBySubscription, subscription);
      } else {
        console.error('handleSubscriptionChange: No tenant found for subscription:', subscriptionId);
      }
      return;
    }

    await updateTenantSubscription(tenant, subscription);
  } catch (error) {
    console.error('handleSubscriptionChange: Error processing subscription change:', error);
    throw error;
  }
}

// Helper function to update tenant subscription data
async function updateTenantSubscription(tenant: Tenant, subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;
  const status = subscription.status;

  console.log('updateTenantSubscription: Updating tenant:', tenant.id, 'with status:', status);

  if (status === 'active' || status === 'trialing') {
    const plan = subscription.items.data[0]?.plan;
    
    if (!plan) {
      console.error('updateTenantSubscription: No plan found in subscription:', subscriptionId);
      return;
    }

    let product;
    try {
      product = await stripe.products.retrieve(plan.product as string);
    } catch (error) {
      console.error('updateTenantSubscription: Error retrieving product:', error);
      return;
    }

    // Map Stripe product ID to our Plan record
    const stripeProductId = plan.product as string;
    let planKey: string | null = null;
    
    // Find the plan key from our mapping
    for (const [key, mapping] of Object.entries(STRIPE_PLAN_MAPPING)) {
      if (mapping.productId === stripeProductId) {
        planKey = key;
        break;
      }
    }

    if (!planKey) {
      console.error('updateTenantSubscription: No plan mapping found for product:', stripeProductId);
      return;
    }

    // Get the Plan record from our database
    const dbPlan = await prisma.plan.findUnique({
      where: { key: planKey }
    });

    if (!dbPlan) {
      console.error('updateTenantSubscription: Plan not found in database:', planKey);
      return;
    }
    
    const updateData = {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: stripeProductId,
      planName: product?.name,
      subscriptionStatus: status.toUpperCase() as SubscriptionStatus,
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      isTrialPeriod: status === 'trialing',
      status: 'ACTIVE' as const // Activar tenant
    };

    console.log('updateTenantSubscription: Updating tenant with active/trialing subscription:', updateData);

    // Update tenant and create/update TenantSubscription in a transaction
    await prisma.$transaction(async (tx) => {
      // Update the tenant
      await tx.tenant.update({
        where: { id: tenant.id },
        data: updateData
      });

      // Create or update TenantSubscription
      await tx.tenantSubscription.upsert({
        where: { tenantId: tenant.id },
        create: {
          tenantId: tenant.id,
          planId: dbPlan.id,
          stripeSubscriptionId: subscriptionId,
          status: status.toUpperCase() as SubscriptionStatus,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        },
        update: {
          planId: dbPlan.id, // ✅ This will now update the plan when upgrading
          stripeSubscriptionId: subscriptionId,
          status: status.toUpperCase() as SubscriptionStatus,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      });
    });

    console.log('updateTenantSubscription: Successfully updated tenant and subscription to active/trialing');
  } else if (status === 'canceled' || status === 'unpaid' || status === 'past_due') {
    console.log('updateTenantSubscription: Processing subscription cancellation/failure');
    
    const updateData = {
      subscriptionStatus: status.toUpperCase() as SubscriptionStatus,
      stripeProductId: status === 'canceled' ? null : (subscription.items.data[0]?.plan?.product as string),
      planName: status === 'canceled' ? null : undefined
    };

    // Update tenant and TenantSubscription status
    await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenant.id },
        data: updateData
      });

      // Update TenantSubscription status if it exists
      const existingSubscription = await tx.tenantSubscription.findUnique({
        where: { tenantId: tenant.id }
      });

      if (existingSubscription) {
        await tx.tenantSubscription.update({
          where: { tenantId: tenant.id },
          data: {
            status: status.toUpperCase() as SubscriptionStatus,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          }
        });
      }
    });

    console.log('updateTenantSubscription: Successfully updated tenant subscription to:', status);
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
    metadata: product.metadata, // Incluir metadata completo para filtros
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

// Obtener price ID por clave de plan y intervalo - Nueva estructura B2B
export function getPriceIdByPlan(planKey: string, interval: 'monthly' | 'annual'): string | null {
  const planType = planKey.toUpperCase();
  
  if (planType === 'PROFESIONAL') {
    return interval === 'annual' 
      ? STRIPE_PRICES.PROFESIONAL.annual 
      : STRIPE_PRICES.PROFESIONAL.monthly;
  } else if (planType === 'CLINICA') {
    return interval === 'annual' 
      ? STRIPE_PRICES.CLINICA.annual 
      : STRIPE_PRICES.CLINICA.monthly;
  } else if (planType === 'EMPRESA') {
    return interval === 'annual' 
      ? STRIPE_PRICES.EMPRESA.annual 
      : STRIPE_PRICES.EMPRESA.monthly;
  }
  
  return null;
}

// Obtener mapeo de plan B2B
export function getPlanMapping(planKey: string) {
  const planType = planKey.toUpperCase();
  return STRIPE_PLAN_MAPPING[planType as keyof typeof STRIPE_PLAN_MAPPING] || null;
} 