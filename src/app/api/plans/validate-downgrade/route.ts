import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from '../../../../lib/prisma';
import { validateDowngrade, isPlanDowngrade } from '../../../../lib/downgrade-validation';

export async function POST(request: NextRequest) {
  try {
    const { targetPlanKey } = await request.json();

    if (!targetPlanKey) {
      return NextResponse.json(
        { error: 'targetPlanKey es requerido' },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Buscar tenant del usuario
    const user = await prisma.user.findUnique({
      where: { id: kindeUser.id },
      include: {
        tenant: {
          include: {
            tenantSubscription: {
              include: { plan: true }
            }
          }
        }
      }
    });

    if (!user?.tenant) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      );
    }

    const tenant = user.tenant;
    const currentPlan = tenant.tenantSubscription?.plan;
    
    if (!currentPlan) {
      return NextResponse.json(
        { error: 'Plan actual no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si realmente es un downgrade
    if (!isPlanDowngrade(currentPlan.key, targetPlanKey)) {
      return NextResponse.json({
        isDowngrade: false,
        canProceed: true,
        message: 'Este cambio no es un downgrade, puedes proceder normalmente'
      });
    }

    // Validar el downgrade
    const validation = await validateDowngrade(tenant.id, targetPlanKey);

    console.log('Downgrade validation result:', {
      tenantId: tenant.id,
      currentPlan: currentPlan.key,
      targetPlan: targetPlanKey,
      canDowngrade: validation.canDowngrade,
      blockersCount: validation.blockers.length,
      warningsCount: validation.warnings.length
    });

    return NextResponse.json({
      isDowngrade: true,
      canProceed: validation.canDowngrade,
      validation,
      currentPlan: {
        key: currentPlan.key,
        name: currentPlan.name
      }
    });

  } catch (error) {
    console.error('Error validating downgrade:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
