import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('=== SUBSCRIPTION CURRENT API START ===');
    
    // Verificar autenticación
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser) {
      console.log('Usuario no autenticado - retornando plan PROFESIONAL trial por defecto');
      return NextResponse.json({ 
        isAuthenticated: false,
        currentPlan: null,
        planKey: 'PROFESIONAL',
        canUpgrade: true,
        availableUpgrades: ['CLINICA', 'EMPRESA'],
        subscriptionStatus: 'TRIALING'
      });
    }

    console.log('Usuario autenticado:', kindeUser.id);

    // Buscar usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: kindeUser.id }
    });

    if (!user) {
      console.error('Usuario no encontrado en DB:', kindeUser.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    if (!tenant) {
      console.error('No se encontró tenant para el usuario:', user.id);
      return NextResponse.json({ error: 'No clinic found for user' }, { status: 404 });
    }

    console.log('Tenant encontrado:', {
      id: tenant.id,
      name: tenant.name,
      subscriptionStatus: tenant.subscriptionStatus,
      planName: tenant.planName,
      planType: tenant.planType,
      stripeSubscriptionId: tenant.stripeSubscriptionId
    });

    // Determinar plan actual basado en la subscripción
    const currentPlan = determinePlanFromSubscription(tenant);
    const availableUpgrades = getAvailableUpgrades(currentPlan.planKey);
    const canUpgrade = availableUpgrades.length > 0;

    const response = {
      isAuthenticated: true,
      currentPlan: currentPlan,
      planKey: currentPlan.planKey,
      canUpgrade,
      availableUpgrades,
      subscriptionStatus: tenant.subscriptionStatus,
      isTrialPeriod: tenant.isTrialPeriod,
      subscriptionEndsAt: tenant.subscriptionEndsAt
    };

    console.log('Respuesta de subscription current:', response);
    console.log('=== SUBSCRIPTION CURRENT API END SUCCESS ===');

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en subscription current API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get subscription info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function determinePlanFromSubscription(tenant: {
  stripeSubscriptionId: string | null;
  subscriptionStatus: string;
  planName: string | null;
  planType: string;
}) {
  // Si no tiene subscripción activa, usar planType del tenant (default: PROFESIONAL)
  if (!tenant.stripeSubscriptionId || tenant.subscriptionStatus === 'INACTIVE' || tenant.subscriptionStatus === 'CANCELED') {
    return {
      planKey: tenant.planType || 'PROFESIONAL',
      name: getPlanDisplayName(tenant.planType || 'PROFESIONAL'),
      displayName: `Plan ${getPlanDisplayName(tenant.planType || 'PROFESIONAL')}`
    };
  }

  // Mapear el planName de Stripe a nuestras claves B2B
  const planName = tenant.planName?.toLowerCase() || '';
  
  if (planName.includes('profesional') || planName.includes('professional')) {
    return {
      planKey: 'PROFESIONAL',
      name: 'Profesional',
      displayName: 'Plan Profesional'
    };
  } else if (planName.includes('clínica') || planName.includes('clinica')) {
    return {
      planKey: 'CLINICA',
      name: 'Clínica',
      displayName: 'Plan Clínica'
    };
  } else if (planName.includes('empresa') || planName.includes('enterprise')) {
    return {
      planKey: 'EMPRESA',
      name: 'Empresa',
      displayName: 'Plan Empresa'
    };
  }

  // Default a PROFESIONAL si no podemos determinar
  return {
    planKey: 'PROFESIONAL',
    name: 'Profesional',
    displayName: 'Plan Profesional'
  };
}

function getPlanDisplayName(planType: string): string {
  switch (planType) {
    case 'PROFESIONAL': return 'Profesional';
    case 'CLINICA': return 'Clínica';
    case 'EMPRESA': return 'Empresa';
    default: return 'Profesional';
  }
}

function getAvailableUpgrades(currentPlanKey: string): string[] {
  const planHierarchy = ['PROFESIONAL', 'CLINICA', 'EMPRESA'];
  const currentIndex = planHierarchy.indexOf(currentPlanKey);
  
  if (currentIndex === -1) {
    // Si no encontramos el plan, asumimos que puede upgradear a todos
    return ['PROFESIONAL', 'CLINICA', 'EMPRESA'];
  }
  
  // Retornar planes superiores al actual
  return planHierarchy.slice(currentIndex + 1);
}
