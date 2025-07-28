import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/super-admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireSuperAdmin();

    const plans = await prisma.plan.findMany({
      orderBy: {
        price: 'asc'
      }
    });

    // Transform plans data for frontend
    const transformedPlans = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      currency: 'MXN',
      interval: 'month' as const,
      features: Array.isArray(plan.features) ? plan.features : [],
      isActive: plan.isActive,
      stripePriceId: plan.stripePriceId
    }));

    return NextResponse.json({
      plans: transformedPlans
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireSuperAdmin();
    const body = await request.json();

    const { name, description, price, features, isActive, stripePriceId } = body;

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Nombre y precio son requeridos' },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description: description || '',
        price: parseFloat(price),
        features: features || [],
        isActive: isActive ?? true,
        stripePriceId
      }
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 