import { requireAuth } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const checkoutSchema = z.object({
  planKey: z.string()
});

export async function POST(req: Request) {
  try {
    const { user, tenant } = await requireAuth();
    const body = await req.json();
    
    const { planKey } = checkoutSchema.parse(body);

    const session = await createCheckoutSession(
      tenant.id,
      planKey,
      user.id
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
} 