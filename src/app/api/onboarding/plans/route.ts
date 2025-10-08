import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { COMPLETE_PLANS } from '../../../../lib/pricing-config';

export async function GET() {
  try {
    // Get active plans from database
    const dbPlans = await prisma.plan.findMany({
      where: { 
        isActive: true,
        key: { in: ['PROFESIONAL', 'CLINICA', 'EMPRESA'] }
      }
    });

    // Merge with pricing config for UI data
    const plans = dbPlans.map(dbPlan => ({
      ...dbPlan,
      ...COMPLETE_PLANS[dbPlan.key as keyof typeof COMPLETE_PLANS]
    }));

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
} 