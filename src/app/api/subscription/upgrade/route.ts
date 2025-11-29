import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '@/lib/prisma';
import {
  stripe,
  updateSubscription,
  getPriceIdByPlan,
  createCheckoutSessionForAPI,
  getStripePlanMapping,
  PLAN_PRICES
} from '@/lib/payments/stripe';
import { z } from 'zod';

// Upgrade request validation schema
const UpgradeRequestSchema = z.object({
  targetPlan: z.enum(['PROFESIONAL', 'CLINICA', 'EMPRESA']),
  billingInterval: z.enum(['monthly', 'annual']).default('monthly'),
  fromTrial: z.boolean().default(false)
});

// Plan hierarchy for upgrade validation
const PLAN_HIERARCHY = {
  PROFESIONAL: 1,
  CLINICA: 2,
  EMPRESA: 3
} as const;

/**
 * POST /api/subscription/upgrade
 * Handles subscription upgrades and trial conversions
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { getUser, isAuthenticated } = getKindeServerSession();

    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Debes iniciar sesión para actualizar tu plan' },
        { status: 401 }
      );
    }

    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'User not found', message: 'Usuario no encontrado' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request
    const body = await request.json();
    const validation = UpgradeRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Parámetros de actualización inválidos',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const { targetPlan, billingInterval, fromTrial } = validation.data;

    // 3. Get user's tenant with subscription info
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        tenant: {
          include: {
            tenantSubscription: {
              include: {
                plan: true
              }
            }
          }
        }
      }
    });

    if (!dbUser?.tenant) {
      return NextResponse.json(
        { error: 'No tenant found', message: 'Clínica no encontrada' },
        { status: 404 }
      );
    }

    const tenant = dbUser.tenant;

    // 4. Handle trial to paid conversion
    if (fromTrial || (tenant.isTrialPeriod && !tenant.stripeSubscriptionId)) {
      const priceId = getPriceIdByPlan(targetPlan, billingInterval);

      if (!priceId) {
        return NextResponse.json(
          { error: 'Invalid plan', message: 'Plan no válido' },
          { status: 400 }
        );
      }

      // Create checkout session for trial conversion
      const session = await createCheckoutSessionForAPI({
        tenant,
        priceId,
        userId: user.id,
        planKey: targetPlan,
        billingInterval
      });

      return NextResponse.json({
        success: true,
        type: 'trial_conversion',
        checkoutUrl: session.url,
        message: 'Redirigiendo al checkout para completar la suscripción'
      });
    }

    // 5. Handle existing subscription upgrade
    if (!tenant.stripeSubscriptionId) {
      return NextResponse.json(
        {
          error: 'No active subscription',
          message: 'No tienes una suscripción activa. Por favor inicia un plan primero.'
        },
        { status: 400 }
      );
    }

    // 6. Get current subscription details
    const currentSubscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);

    if (currentSubscription.status !== 'active' && currentSubscription.status !== 'trialing') {
      return NextResponse.json(
        {
          error: 'Invalid subscription status',
          message: `Tu suscripción está ${currentSubscription.status}. No se puede actualizar.`
        },
        { status: 400 }
      );
    }

    // 7. Determine current plan
    const currentPlanKey = tenant.tenantSubscription?.plan?.key;

    if (!currentPlanKey) {
      return NextResponse.json(
        { error: 'Current plan not found', message: 'No se pudo determinar tu plan actual' },
        { status: 400 }
      );
    }

    // 8. Validate upgrade (can only upgrade to higher tier)
    const currentTier = PLAN_HIERARCHY[currentPlanKey as keyof typeof PLAN_HIERARCHY];
    const targetTier = PLAN_HIERARCHY[targetPlan];

    if (!currentTier || !targetTier) {
      return NextResponse.json(
        { error: 'Invalid plan tier', message: 'Plan no válido' },
        { status: 400 }
      );
    }

    if (targetTier <= currentTier) {
      return NextResponse.json(
        {
          error: 'Invalid upgrade',
          message: 'Solo puedes actualizar a un plan superior. Para cambiar o cancelar tu plan, ve a Configuración > Facturación.'
        },
        { status: 400 }
      );
    }

    // 9. Get target price ID
    const targetPriceId = getPriceIdByPlan(targetPlan, billingInterval);

    if (!targetPriceId) {
      return NextResponse.json(
        { error: 'Price not found', message: 'Precio no encontrado para el plan seleccionado' },
        { status: 400 }
      );
    }

    // 10. Perform the upgrade
    const updatedSubscription = await updateSubscription(
      tenant.stripeSubscriptionId,
      targetPriceId
    );

    // 11. Calculate proration details
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: tenant.stripeCustomerId!,
      subscription: tenant.stripeSubscriptionId
    });

    const prorationAmount = upcomingInvoice.amount_due / 100; // Convert from cents
    const newMonthlyAmount = PLAN_PRICES[targetPlan][billingInterval === 'annual' ? 'annual' : 'monthly'];

    // 12. Log the upgrade
    await prisma.trialAccessLog.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        feature: 'subscription_upgrade',
        action: 'upgrade',
        allowed: true,
        requestPath: request.nextUrl.pathname,
        denialReason: `Upgraded from ${currentPlanKey} to ${targetPlan}`,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') || undefined
      }
    });

    return NextResponse.json({
      success: true,
      type: 'subscription_upgrade',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
        plan: targetPlan,
        billingInterval
      },
      proration: {
        amount: prorationAmount,
        currency: upcomingInvoice.currency,
        dueDate: new Date(upcomingInvoice.period_end * 1000)
      },
      newPricing: {
        amount: newMonthlyAmount,
        interval: billingInterval,
        currency: 'MXN'
      },
      message: `¡Felicidades! Tu plan ha sido actualizado a ${targetPlan}. Los cambios son efectivos inmediatamente.`
    });

  } catch (error) {
    console.error('Subscription upgrade error:', error);

    // Handle specific Stripe errors
    if (error instanceof Error) {
      if (error.message.includes('No such subscription')) {
        return NextResponse.json(
          { error: 'Subscription not found', message: 'Suscripción no encontrada' },
          { status: 404 }
        );
      }

      if (error.message.includes('No such price')) {
        return NextResponse.json(
          { error: 'Price not found', message: 'Precio no encontrado' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Error al procesar la actualización. Por favor intenta de nuevo.'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/subscription/upgrade
 * Get available upgrade options for the current user
 */
export async function GET() {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();

    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        tenant: {
          include: {
            tenantSubscription: {
              include: {
                plan: true
              }
            }
          }
        }
      }
    });

    if (!dbUser?.tenant) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 404 }
      );
    }

    const tenant = dbUser.tenant;
    const currentPlanKey = tenant.tenantSubscription?.plan?.key;
    const currentTier = currentPlanKey ? PLAN_HIERARCHY[currentPlanKey as keyof typeof PLAN_HIERARCHY] : 0;

    // Get available upgrade options (higher tiers only)
    const stripePlanMapping = getStripePlanMapping();
    const availableUpgrades = Object.entries(PLAN_HIERARCHY)
      .filter(([, tier]) => tier > currentTier)
      .map(([planKey]) => {
        const mapping = stripePlanMapping[planKey as keyof typeof stripePlanMapping];
        const prices = PLAN_PRICES[planKey as keyof typeof PLAN_PRICES];

        return {
          planKey,
          name: planKey,
          tier: PLAN_HIERARCHY[planKey as keyof typeof PLAN_HIERARCHY],
          limits: mapping.limits,
          pricing: {
            monthly: prices.monthly,
            annual: prices.annual
          }
        };
      });

    return NextResponse.json({
      currentPlan: {
        key: currentPlanKey,
        tier: currentTier,
        isTrialPeriod: tenant.isTrialPeriod,
        subscriptionStatus: tenant.subscriptionStatus
      },
      availableUpgrades,
      canUpgrade: availableUpgrades.length > 0
    });

  } catch (error) {
    console.error('Get upgrade options error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
