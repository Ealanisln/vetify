import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSessionForAPI } from '@/lib/payments/stripe';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json();

    if (!priceId) {
      console.error('Checkout error: Price ID is required');
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    console.log('Checkout iniciado para priceId:', priceId);

    // Verificar autenticación
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser) {
      console.error('Checkout error: User not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Usuario autenticado:', kindeUser.id);

    // Buscar usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: kindeUser.id }
    });

    if (!user) {
      console.error('Checkout error: User not found in database for ID:', kindeUser.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Usuario encontrado en DB:', user.id);

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

    if (!tenant) {
      console.error('Checkout error: No tenant found for user:', user.id);
      return NextResponse.json({ error: 'No clinic found for user' }, { status: 404 });
    }

    console.log('Tenant encontrado:', tenant.id);

    // Verificar variables de entorno de Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Checkout error: STRIPE_SECRET_KEY not configured');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    // Crear sesión de checkout
    console.log('Creando sesión de checkout...');
    const session = await createCheckoutSessionForAPI({
      tenant,
      priceId,
      userId: user.id
    });

    console.log('Sesión de checkout creada exitosamente:', session.id);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Si es un error de Stripe, proporcionar más detalles
    if (error && typeof error === 'object' && 'type' in error) {
      console.error('Stripe error type:', error.type);
      if ('code' in error) {
        console.error('Stripe error code:', error.code);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 