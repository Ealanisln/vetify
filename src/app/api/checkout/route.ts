import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSessionForAPI, getPriceByLookupKey } from '../../../lib/payments/stripe';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from '../../../lib/prisma';
import { findOrCreateUser } from '../../../lib/db/queries/users';
import { getStripePriceIdForPlan } from '../../../lib/pricing-config';

export async function POST(request: NextRequest) {
  try {
    const { priceId, planKey, billingInterval = 'monthly' } = await request.json();

    // Resolve price ID - either from direct priceId or from planKey
    let actualPriceId = priceId;

    // If planKey is provided but no priceId, resolve it on the server
    // This is the secure way - client sends planKey, server determines correct price ID
    if (!actualPriceId && planKey) {
      // Map plan keys to plan names for the helper function
      const planNameMap: Record<string, string> = {
        'BASICO': 'Plan Básico',
        'PROFESIONAL': 'Plan Profesional',
        'CORPORATIVO': 'Plan Corporativo'
      };
      const planName = planNameMap[planKey.toUpperCase()] || planKey;
      actualPriceId = getStripePriceIdForPlan(planName, billingInterval as 'monthly' | 'yearly');
    }

    // Si priceId es un lookup key, convertirlo a price ID real
    if (actualPriceId && !actualPriceId.startsWith('price_')) {
      actualPriceId = await getPriceByLookupKey(actualPriceId);
      if (!actualPriceId) {
        return NextResponse.json({ error: 'Invalid price identifier' }, { status: 400 });
      }
    }

    if (!actualPriceId) {
      return NextResponse.json({ error: 'Price ID or Plan Key is required' }, { status: 400 });
    }

    // Verificar autenticación
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use centralized findOrCreateUser function to handle concurrent requests
    let user;
    try {
      user = await findOrCreateUser({
        id: kindeUser.id,
        email: kindeUser.email || '',
        firstName: kindeUser.given_name,
        lastName: kindeUser.family_name,
        name: `${kindeUser.given_name || ''} ${kindeUser.family_name || ''}`.trim() || kindeUser.email?.split('@')[0],
      });
    } catch (error) {
      console.error('Error syncing user:', error);
      return NextResponse.json({ error: 'Error syncing user' }, { status: 500 });
    }

    // Buscar tenant del usuario
    const tenant = await prisma.tenant.findFirst({
      where: {
        users: {
          some: {
            id: user.id
          }
        }
      }
    });

    // Si no tiene tenant, redirigir al onboarding
    if (!tenant) {
      return NextResponse.json({
        error: 'Onboarding required',
        redirectUrl: '/onboarding'
      }, { status: 400 });
    }

    // Verificar variables de entorno de Stripe (flexible for Vercel configuration)
    // Check for both _LIVE and non-LIVE keys to support different Vercel setups
    const stripeKeyPresent = !!(
      process.env.STRIPE_SECRET_KEY_LIVE ||
      process.env.STRIPE_SECRET_KEY
    );

    if (!stripeKeyPresent) {
      return NextResponse.json({
        error: 'Stripe not configured',
        details: 'Missing STRIPE_SECRET_KEY_LIVE or STRIPE_SECRET_KEY environment variable'
      }, { status: 500 });
    }

    // Crear sesión de checkout
    const session = await createCheckoutSessionForAPI({
      tenant,
      priceId: actualPriceId,
      userId: user.id
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);

    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: (error as Error)?.message || 'Unknown error',
        type: error && typeof error === 'object' && 'type' in error ? (error as { type?: string }).type : 'unknown'
      },
      { status: 500 }
    );
  }
} 