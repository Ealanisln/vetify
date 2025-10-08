import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '../../../../lib/prisma';
import { calculateTrialStatus } from '../../../../lib/trial/utils';
import { 
  TrialAccessSchema, 
  type TrialAccessResult,
  TRIAL_LIMITS,
  PREMIUM_FEATURES 
} from '../../../../types/trial';

export async function POST(request: NextRequest) {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();
    
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { 
          allowed: false, 
          error: 'Unauthorized',
          redirectTo: '/api/auth/login'
        } satisfies TrialAccessResult,
        { status: 401 }
      );
    }

    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json(
        { 
          allowed: false, 
          error: 'User not found',
          redirectTo: '/api/auth/login'
        } satisfies TrialAccessResult,
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = TrialAccessSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          allowed: false, 
          error: 'Invalid request parameters',
          reason: validation.error.message
        } satisfies TrialAccessResult,
        { status: 400 }
      );
    }

    const { feature, action } = validation.data;

    // Get user's tenant with subscription info
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
        { 
          allowed: false, 
          error: 'No tenant found',
          redirectTo: '/onboarding'
        } satisfies TrialAccessResult,
        { status: 404 }
      );
    }

    const tenant = dbUser.tenant;

    // If has active paid subscription, allow all features
    if (tenant.subscriptionStatus === 'ACTIVE' && !tenant.isTrialPeriod) {
      await logAccess(tenant.id, user.id, { feature, action }, true, request);
      
      return NextResponse.json({
        allowed: true,
        trialStatus: {
          status: 'converted',
          daysRemaining: 0,
          displayMessage: 'Suscripción activa',
          bannerType: 'success',
          showUpgradePrompt: false,
          blockedFeatures: []
        }
      } satisfies TrialAccessResult);
    }

    // Calculate trial status
    const trialStatus = calculateTrialStatus(tenant);

    // Check if trial has expired (no grace period for critical features)
    if (trialStatus.status === 'expired') {
      const denialReason = `Trial expirado hace ${Math.abs(trialStatus.daysRemaining)} días`;
      
      await logAccess(
        tenant.id, 
        user.id, 
        { feature, action }, 
        false,
        request,
        denialReason
      );

      return NextResponse.json({
        allowed: false,
        trialStatus,
        reason: denialReason,
        redirectTo: '/precios'
      } satisfies TrialAccessResult);
    }

    // Check feature-specific access for trial users
    if (tenant.isTrialPeriod && feature) {
      // Check if feature is premium-only
      if (PREMIUM_FEATURES.includes(feature as 'inventory' | 'reports' | 'automations')) {
        const denialReason = `Función ${feature} requiere suscripción`;
        
        await logAccess(
          tenant.id, 
          user.id, 
          { feature, action }, 
          false,
          request,
          denialReason
        );

        return NextResponse.json({
          allowed: false,
          trialStatus,
          reason: denialReason,
          redirectTo: '/precios'
        } satisfies TrialAccessResult);
      }

      // Check usage limits for trial features
      if (action === 'create') {
        const usageCheck = await checkUsageLimits(tenant.id, feature);
        
        if (!usageCheck.allowed) {
          await logAccess(
            tenant.id, 
            user.id, 
            { feature, action }, 
            false,
            request,
            usageCheck.reason
          );

          return NextResponse.json({
            allowed: false,
            trialStatus,
            reason: usageCheck.reason,
            redirectTo: '/precios',
            remainingQuota: usageCheck.quota
          } satisfies TrialAccessResult);
        }
      }
    }

    // Access allowed
    await logAccess(tenant.id, user.id, { feature, action }, true, request);

    // Update last trial check timestamp
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { lastTrialCheck: new Date() }
    });

    return NextResponse.json({
      allowed: true,
      trialStatus
    } satisfies TrialAccessResult);

  } catch (error) {
    console.error('Trial access check error:', error);
    
    return NextResponse.json(
      { 
        allowed: false, 
        error: 'Internal server error',
        reason: 'Error al verificar acceso'
      } satisfies TrialAccessResult,
      { status: 500 }
    );
  }
}

// Helper function to check usage limits
async function checkUsageLimits(tenantId: string, feature: string) {
  switch (feature) {
    case 'pets':
      const petCount = await prisma.pet.count({
        where: { tenantId }
      });
      
      const petLimit = TRIAL_LIMITS.pets;
      if (petCount >= petLimit) {
        return {
          allowed: false,
          reason: `Límite de ${petLimit} mascotas alcanzado en período de prueba`,
          quota: { feature, used: petCount, limit: petLimit }
        };
      }
      break;

    case 'appointments':
      const appointmentCount = await prisma.appointment.count({
        where: { tenantId }
      });
      
      const appointmentLimit = TRIAL_LIMITS.appointments;
      if (appointmentCount >= appointmentLimit) {
        return {
          allowed: false,
          reason: `Límite de ${appointmentLimit} citas alcanzado en período de prueba`,
          quota: { feature, used: appointmentCount, limit: appointmentLimit }
        };
      }
      break;
  }

  return { allowed: true };
}

// Helper function to log access attempts
async function logAccess(
  tenantId: string,
  userId: string,
  access: { feature?: string; action?: string },
  allowed: boolean,
  request: NextRequest,
  denialReason?: string
) {
  try {
    // Get request metadata
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined;
    
    await prisma.trialAccessLog.create({
      data: {
        tenantId,
        userId,
        feature: access.feature || 'general',
        action: access.action || 'view',
        allowed,
        denialReason,
        requestPath: request.nextUrl.pathname,
        userAgent,
        ipAddress
      }
    });
  } catch (error) {
    console.error('Failed to log access:', error);
    // Don't throw - logging failures shouldn't block access checks
  }
}
