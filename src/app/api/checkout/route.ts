import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSessionForAPI, getPriceByLookupKey } from '../../../lib/payments/stripe';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from '../../../lib/prisma';
import { findOrCreateUser } from '../../../lib/db/queries/users';

export async function POST(request: NextRequest) {
  try {
    console.log('=== CHECKOUT DEBUG START ===');
    const { priceId } = await request.json();
    console.log('1. Request body parsed, priceId:', priceId);
    
    // Si priceId es un lookup key, convertirlo a price ID real
    let actualPriceId = priceId;
    if (priceId && !priceId.startsWith('price_')) {
      console.log('2. Converting lookup key to price ID:', priceId);
      actualPriceId = await getPriceByLookupKey(priceId);
      if (!actualPriceId) {
        console.error('Failed to get price ID from lookup key:', priceId);
        return NextResponse.json({ error: 'Invalid price identifier' }, { status: 400 });
      }
      console.log('3. Converted to price ID:', actualPriceId);
    }

    if (!actualPriceId) {
      console.error('Checkout error: Price ID is required');
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Verificar configuración de Stripe
    console.log('2. STRIPE_SECRET_KEY presente:', !!process.env.STRIPE_SECRET_KEY);
    console.log('3. NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
    console.log('4. Checkout iniciado para priceId:', priceId);

    // Verificar autenticación
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser) {
      console.error('5. Checkout error: User not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('6. Usuario autenticado:', kindeUser.id, 'email:', kindeUser.email);

    // Use centralized findOrCreateUser function to handle concurrent requests
    let user;
    try {
      console.log('7. Buscando o creando usuario...');
      user = await findOrCreateUser({
        id: kindeUser.id,
        email: kindeUser.email || '',
        firstName: kindeUser.given_name,
        lastName: kindeUser.family_name,
        name: `${kindeUser.given_name || ''} ${kindeUser.family_name || ''}`.trim() || kindeUser.email?.split('@')[0],
      });
      console.log('8. Usuario encontrado/creado:', user.email);
    } catch (error) {
      console.error('Error syncing user:', error);
      return NextResponse.json({ error: 'Error syncing user' }, { status: 500 });
    }

    console.log('9. Usuario encontrado/sincronizado en DB:', user.id, 'email:', user.email);

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
      console.log('10. No tenant found, redirecting to onboarding');
      return NextResponse.json({ 
        error: 'Onboarding required',
        redirectUrl: '/onboarding' 
      }, { status: 400 });
    }

    console.log('11. Tenant encontrado:', tenant.id, 'name:', tenant.name);
    console.log('12. Tenant stripe customer ID:', tenant.stripeCustomerId);

    // Verificar variables de entorno de Stripe (flexible for Vercel configuration)
    // Check for both _LIVE and non-LIVE keys to support different Vercel setups
    const stripeKeyPresent = !!(
      process.env.STRIPE_SECRET_KEY_LIVE || 
      process.env.STRIPE_SECRET_KEY
    );

    if (!stripeKeyPresent) {
      console.error('13. Checkout error: No Stripe secret key configured');
      console.error('    Checked: STRIPE_SECRET_KEY_LIVE and STRIPE_SECRET_KEY');
      return NextResponse.json({ 
        error: 'Stripe not configured',
        details: 'Missing STRIPE_SECRET_KEY_LIVE or STRIPE_SECRET_KEY environment variable'
      }, { status: 500 });
    }
    
    console.log('13. Stripe key present:', 
      process.env.STRIPE_SECRET_KEY_LIVE ? 'LIVE' : 'TEST'
    );

    // Crear sesión de checkout
    console.log('14. Creando sesión de checkout con params:', {
      tenantId: tenant.id,
      priceId: actualPriceId,
      userId: user.id,
      hasStripeCustomer: !!tenant.stripeCustomerId
    });
    const session = await createCheckoutSessionForAPI({
      tenant,
      priceId: actualPriceId,
      userId: user.id
    });

    console.log('15. ✅ Sesión de checkout creada exitosamente:', {
      sessionId: session.id,
      url: !!session.url,
      customerId: session.customer
    });
    console.log('=== CHECKOUT DEBUG END SUCCESS ===');
    
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.log('=== CHECKOUT ERROR DEBUG ===');
    console.error('Error completo:', error);
    console.error('Error name:', (error as Error)?.name);
    console.error('Error message:', (error as Error)?.message);
    console.error('Error stack:', (error as Error)?.stack);
    
    // Si es un error de Stripe, proporcionar más detalles
    if (error && typeof error === 'object' && 'type' in error) {
      console.error('🔴 STRIPE ERROR DETAILS:');
      console.error('  - Type:', (error as { type?: string }).type);
      console.error('  - Code:', (error as { code?: string }).code);
      console.error('  - Decline code:', (error as { decline_code?: string }).decline_code);
      console.error('  - Request ID:', (error as { request_id?: string }).request_id);
      console.error('  - Status code:', (error as { statusCode?: number }).statusCode);
    }

    // Verificar si es un error de configuración
    if ((error as Error)?.message?.includes('key')) {
      console.error('🔴 Posible error de configuración de claves');
    }
    
    console.log('=== CHECKOUT ERROR DEBUG END ===');
    
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