import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { prisma } from '../prisma';
import { isLaunchPromotionActive, PRICING_CONFIG, isStripeInLiveMode } from '../pricing-config';

import type { Tenant, SubscriptionStatus, PlanType } from '@prisma/client';

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

// Type for Stripe checkout session configuration
interface StripeCheckoutSessionConfig {
  customer: string;
  payment_method_types: string[];
  line_items: Array<{
    price: string;
    quantity: number;
  }>;
  mode: 'subscription';
  success_url: string;
  cancel_url: string;
  subscription_data: StripeSubscriptionData;
  locale: string;
  metadata: {
    tenantId: string;
    planKey: string;
    userId: string;
    billingInterval: string;
  };
  discounts?: Array<{
    coupon: string;
  }>;
  allow_promotion_codes?: boolean;
}

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

// Seleccionar la key de Stripe disponible
// La prioridad es: STRIPE_SECRET_KEY_LIVE > STRIPE_SECRET_KEY
// El tipo de key (sk_live_ vs sk_test_) determina si usamos precios LIVE o TEST
// Esto es manejado automáticamente por isStripeInLiveMode() en pricing-config.ts
const stripeSecretKey = process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey) {
  throw new Error(
    'No Stripe secret key configured. ' +
    'Please set STRIPE_SECRET_KEY_LIVE or STRIPE_SECRET_KEY in your environment variables.'
  );
}

// Stripe client configuration
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// IDs de productos TEST (Sandbox - Vetify sandbox)
const TEST_PRODUCTS = {
  BASICO: 'prod_TGDXKD2ksDenYm',
  PROFESIONAL: 'prod_TGDXLJxNFGsF9X',
  CORPORATIVO: 'prod_TGDXxUkqhta3cp'
} as const;

const TEST_PRICES = {
  BASICO: {
    monthly: 'price_1SJh6nPwxz1bHxlHQ15mCTij',
    annual: 'price_1SJh6oPwxz1bHxlH1gXSEuSF',
  },
  PROFESIONAL: {
    monthly: 'price_1SJh6oPwxz1bHxlHkJudNKvL',
    annual: 'price_1SJh6pPwxz1bHxlHcMip7KIU',
  },
  CORPORATIVO: {
    monthly: 'price_1SJh6pPwxz1bHxlHY9cnLnPw',
    annual: 'price_1SJh6qPwxz1bHxlHd3ud2WZ3',
  }
} as const;

// IDs de productos PRODUCTION (Live - Vetify)
// Fallback values are provided for backward compatibility, but should be set via env vars in production
const PRODUCTION_PRODUCTS = {
  BASICO: process.env.STRIPE_PRODUCT_BASICO_LIVE || 'prod_TOO1tpvYblty9Y',
  PROFESIONAL: process.env.STRIPE_PRODUCT_PROFESIONAL_LIVE || 'prod_TOO1RsH4C7mQmr',
  CORPORATIVO: process.env.STRIPE_PRODUCT_CORPORATIVO_LIVE || 'prod_TOO1q6SDg9CGMP'
} as const;

const PRODUCTION_PRICES = {
  BASICO: {
    monthly: process.env.STRIPE_PRICE_BASICO_MONTHLY_LIVE || 'price_1SRbeEL0nsUWmd4XBFJ39Vos',
    annual: process.env.STRIPE_PRICE_BASICO_ANNUAL_LIVE || 'price_1SRbeEL0nsUWmd4XKYm8XgQf',
  },
  PROFESIONAL: {
    monthly: process.env.STRIPE_PRICE_PROFESIONAL_MONTHLY_LIVE || 'price_1SRbeEL0nsUWmd4XeqTWgtqf',
    annual: process.env.STRIPE_PRICE_PROFESIONAL_ANNUAL_LIVE || 'price_1SRbeFL0nsUWmd4X3828tN8a',
  },
  CORPORATIVO: {
    monthly: process.env.STRIPE_PRICE_CORPORATIVO_MONTHLY_LIVE || 'price_1SRbeFL0nsUWmd4XAVO4h9rv',
    annual: process.env.STRIPE_PRICE_CORPORATIVO_ANNUAL_LIVE || 'price_1SRbeGL0nsUWmd4XKgS6jCso',
  }
} as const;

// Functions to get products/prices at RUNTIME (not build time)
// This ensures the correct IDs are used based on the actual Stripe key configured
export const getStripeProductIds = () => {
  return isStripeInLiveMode() ? PRODUCTION_PRODUCTS : TEST_PRODUCTS;
};

export const getStripePriceIds = () => {
  return isStripeInLiveMode() ? PRODUCTION_PRICES : TEST_PRICES;
};

// Dynamic plan mapping that uses the correct product/price IDs based on Stripe mode
export const getStripePlanMapping = () => {
  const products = getStripeProductIds();
  const prices = getStripePriceIds();

  return {
    'BASICO': {
      productId: products.BASICO,
      prices: prices.BASICO,
      limits: { pets: 500, users: 3, whatsappMessages: -1 }
    },
    'PROFESIONAL': {
      productId: products.PROFESIONAL,
      prices: prices.PROFESIONAL,
      limits: { pets: 2000, users: 8, whatsappMessages: -1 }
    },
    'CORPORATIVO': {
      productId: products.CORPORATIVO,
      prices: prices.CORPORATIVO,
      limits: { pets: -1, users: 20, whatsappMessages: -1 }
    }
  };
};

// Legacy exports for backward compatibility
// WARNING: These default to PRODUCTION - use getStripeProductIds()/getStripePriceIds() for runtime detection
export const STRIPE_PRODUCTS = PRODUCTION_PRODUCTS;
export const STRIPE_PRICES = PRODUCTION_PRICES;

// Precios de planes en MXN - Nueva estructura B2B
export const PLAN_PRICES = {
  BASICO: {
    monthly: 599,
    annual: 4788,  // $399/mes x 12 meses
  },
  PROFESIONAL: {
    monthly: 1199,
    annual: 9588,  // $799/mes x 12 meses
  },
  CORPORATIVO: {
    monthly: 5000,
    annual: 60000,  // Placeholder - cotización personalizada
  }
} as const;

// Mapeo de productos/precios para facilitar las operaciones
export const STRIPE_PLAN_MAPPING = {
  'BASICO': {
    productId: STRIPE_PRODUCTS.BASICO,
    prices: STRIPE_PRICES.BASICO,
    limits: { pets: 500, users: 3, whatsappMessages: -1 }
  },
  'PROFESIONAL': {
    productId: STRIPE_PRODUCTS.PROFESIONAL,
    prices: STRIPE_PRICES.PROFESIONAL,
    limits: { pets: 2000, users: 8, whatsappMessages: -1 }
  },
  'CORPORATIVO': {
    productId: STRIPE_PRODUCTS.CORPORATIVO,
    prices: STRIPE_PRICES.CORPORATIVO,
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

  // ✅ Check for existing active subscriptions and cancel them
  if (customer.id) {
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 100
    });

    // Cancel all existing active subscriptions to prevent duplicates
    for (const sub of existingSubscriptions.data) {
      console.log(`Canceling existing subscription ${sub.id} before creating new one`);
      await stripe.subscriptions.cancel(sub.id);
    }
  }

  // Determinar si debe tener trial en Stripe
  // Solo dar trial si nunca ha tenido trial local o el trial local aún está activo
  const shouldHaveStripeTrial = shouldGiveStripeTrial(tenant);

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
  }

  // Preparar configuración de la sesión de checkout
  const sessionConfig: StripeCheckoutSessionConfig = {
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
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
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
  };

  // 🎉 Aplicar cupón de lanzamiento automáticamente si está activo
  // NOTA: Si aplicamos cupón automático, NO podemos usar allow_promotion_codes
  if (isLaunchPromotionActive()) {
    sessionConfig.discounts = [{
      coupon: PRICING_CONFIG.LAUNCH_PROMOTION.couponCode
    }];
  } else {
    // Solo permitir códigos promocionales si NO hay promoción automática activa
    sessionConfig.allow_promotion_codes = true;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

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

  // ✅ Check for existing active subscriptions and cancel them
  if (customer.id) {
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 100
    });

    // Cancel all existing active subscriptions to prevent duplicates
    for (const sub of existingSubscriptions.data) {
      console.log(`[API] Canceling existing subscription ${sub.id} before creating new one`);
      await stripe.subscriptions.cancel(sub.id);
    }
  }

  // Determinar si debe tener trial en Stripe
  // Solo dar trial si nunca ha tenido trial local o el trial local aún está activo
  const shouldHaveStripeTrial = shouldGiveStripeTrial(tenant);

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
  }

  // Preparar configuración de la sesión de checkout
  const sessionConfig: StripeCheckoutSessionConfig = {
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
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
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
  };

  // 🎉 Aplicar cupón de lanzamiento automáticamente si está activo
  // NOTA: Si aplicamos cupón automático, NO podemos usar allow_promotion_codes
  if (isLaunchPromotionActive()) {
    sessionConfig.discounts = [{
      coupon: PRICING_CONFIG.LAUNCH_PROMOTION.couponCode
    }];
  } else {
    // Solo permitir códigos promocionales si NO hay promoción automática activa
    sessionConfig.allow_promotion_codes = true;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

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
              product: STRIPE_PRODUCTS.BASICO,
              prices: Object.values(STRIPE_PRICES.BASICO)
            },
            {
              product: STRIPE_PRODUCTS.PROFESIONAL,
              prices: Object.values(STRIPE_PRICES.PROFESIONAL)
            },
            {
              product: STRIPE_PRODUCTS.CORPORATIVO,
              prices: Object.values(STRIPE_PRICES.CORPORATIVO)
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
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?from_portal=true`,
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
        // Stripe customer not found, will create a new one
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

  if (status === 'active' || status === 'trialing') {
    const plan = subscription.items.data[0]?.plan;
    
    if (!plan) {
      console.error('updateTenantSubscription: No plan found in subscription:', subscriptionId);
      return;
    }

    // Validate that the product exists in Stripe
    try {
      await stripe.products.retrieve(plan.product as string);
    } catch (error) {
      console.error('updateTenantSubscription: Error retrieving product:', error);
      return;
    }

    // Map Stripe product ID to our Plan record
    const stripeProductId = plan.product as string;
    let planKey: string | null = null;

    // First, try to find in current product mapping (uses dynamic mapping based on Stripe mode)
    const planMapping = getStripePlanMapping();
    for (const [key, mapping] of Object.entries(planMapping)) {
      if (mapping.productId === stripeProductId) {
        planKey = key;
        break;
      }
    }

    if (!planKey) {
      console.error('updateTenantSubscription: No plan mapping found for product:', stripeProductId);
      console.error('Available mappings:', Object.keys(planMapping));
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
      planName: dbPlan.name, // Use DB plan name for consistency
      planType: planKey.toUpperCase() as PlanType, // Update planType on subscription changes
      subscriptionStatus: status.toUpperCase() as SubscriptionStatus,
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      isTrialPeriod: status === 'trialing',
      status: 'ACTIVE' as const // Activar tenant
    };

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
  } else if (status === 'canceled' || status === 'unpaid' || status === 'past_due') {
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
    } catch (error) {
      console.error(`❌ Error creando producto ${productData.name}:`, error);
    }
  }

  return createdProducts;
}

// Obtener price ID por clave de plan y intervalo - Nueva estructura B2B
export function getPriceIdByPlan(planKey: string, interval: 'monthly' | 'annual'): string | null {
  const planType = planKey.toUpperCase();

  if (planType === 'BASICO') {
    return interval === 'annual'
      ? STRIPE_PRICES.BASICO.annual
      : STRIPE_PRICES.BASICO.monthly;
  } else if (planType === 'PROFESIONAL') {
    return interval === 'annual'
      ? STRIPE_PRICES.PROFESIONAL.annual
      : STRIPE_PRICES.PROFESIONAL.monthly;
  } else if (planType === 'CORPORATIVO') {
    return interval === 'annual'
      ? STRIPE_PRICES.CORPORATIVO.annual
      : STRIPE_PRICES.CORPORATIVO.monthly;
  }

  return null;
}

// Obtener mapeo de plan B2B
export function getPlanMapping(planKey: string) {
  const planType = planKey.toUpperCase();
  const mapping = getStripePlanMapping();
  return mapping[planType as keyof typeof mapping] || null;
} 