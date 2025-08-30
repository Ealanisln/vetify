import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../../../lib/super-admin';
import { prisma } from '../../../../../lib/prisma';

export async function GET() {
  try {
    await requireSuperAdmin();

    const plans = await prisma.plan.findMany({
      orderBy: {
        monthlyPrice: 'asc'
      }
    });

    // Transform plans data for frontend
    const transformedPlans = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      price: plan.monthlyPrice,
      currency: 'MXN',
      interval: 'month' as const,
      features: Array.isArray(plan.features) ? plan.features : [],
      isActive: plan.isActive
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

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json();

    const { name, description, price, features, isActive } = body;

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Nombre y precio son requeridos' },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.create({
      data: {
        key: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        description: description || '',
        monthlyPrice: parseFloat(price),
        annualPrice: parseFloat(price) * 12,
        features: features || [],
        maxUsers: 10,
        maxPets: 100,
        storageGB: 5,
        isActive: isActive ?? true
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