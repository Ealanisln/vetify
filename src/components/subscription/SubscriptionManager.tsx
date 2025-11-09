'use client';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { redirectToCustomerPortal } from '../../lib/payments/actions';
import { useSubscription } from '../../hooks/useSubscription';
import type { Tenant } from '@prisma/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getStripePriceIdForPlan, getPlanKeyFromName } from '../../lib/pricing-config';
import { toast } from 'sonner';

interface SubscriptionManagerProps {
  tenant: Tenant;
}

export function SubscriptionManager({ tenant }: SubscriptionManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const {
    isPastDue,
    isCanceled,
    planName,
    subscriptionEndsAt,
    hasActiveSubscription,
    needsPayment,
    isInTrial,
    subscriptionStatus
  } = useSubscription(tenant);

  // Detect return from Stripe portal and show success message
  useEffect(() => {
    const fromPortal = searchParams.get('from_portal');

    if (fromPortal === 'true') {
      // Show success toast
      toast.success('Cambios guardados', {
        description: 'Tu suscripción se está actualizando. Los cambios pueden tardar unos segundos en reflejarse.',
        duration: 5000,
      });

      // Clean up URL parameter
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('from_portal');
      window.history.replaceState({}, '', currentUrl.toString());

      // Force page refresh after a short delay to show updated data
      setTimeout(() => {
        router.refresh();
      }, 2000);
    }
  }, [searchParams, router]);

  // CRITICAL FIX: Check if trial has expired
  // Trial is expired if: status is TRIALING AND trialEndsAt is in the past
  const isTrialExpired = 
    tenant.subscriptionStatus === 'TRIALING' && 
    tenant.isTrialPeriod && 
    tenant.trialEndsAt && 
    new Date(tenant.trialEndsAt) < new Date() &&
    !tenant.stripeSubscriptionId; // No tiene suscripción de pago

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const portalUrl = await redirectToCustomerPortal();

      // Redirect to Stripe portal
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Error al abrir el portal de cliente:', error);

      // Show user-friendly error message
      toast.error('Error al abrir el portal', {
        description: error instanceof Error
          ? error.message
          : 'No se pudo conectar con el portal de pagos. Por favor, intenta nuevamente.',
        duration: 5000,
      });

      setIsLoading(false);
    }
  };

  const handleUpgradePlan = async () => {
    // CRITICAL FIX: If trial expired, go directly to Stripe checkout
    if (isTrialExpired) {
      setIsCheckoutLoading(true);
      try {
        // Use the plan that the user selected during onboarding
        const userPriceId = getStripePriceIdForPlan(tenant.planName, 'monthly');
        const userPlanKey = getPlanKeyFromName(tenant.planName);

        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId: userPriceId,
            planKey: userPlanKey,
            billingInterval: 'monthly'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          if (errorData.redirectUrl) {
            window.location.href = errorData.redirectUrl;
            return;
          }

          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No se recibió URL de checkout');
        }
      } catch (error) {
        console.error('Error al crear sesión de checkout:', error);

        // Show user-friendly error message
        toast.error('Error al procesar el pago', {
          description: error instanceof Error
            ? error.message
            : 'No se pudo crear la sesión de pago. Por favor, intenta nuevamente.',
          duration: 5000,
        });

        setIsCheckoutLoading(false);
      }
      return;
    }

    // For active trials or existing subscriptions, show pricing page for comparison
    // Determinar el plan actual basado en el nombre del plan
    let planKey = 'BASICO'; // Default

    if (planName) {
      const lowerPlanName = planName.toLowerCase();
      if (lowerPlanName.includes('profesional') || lowerPlanName.includes('professional')) {
        planKey = 'PROFESIONAL';
      } else if (lowerPlanName.includes('corporativo') || lowerPlanName.includes('corporate') || lowerPlanName.includes('empresa')) {
        planKey = 'CORPORATIVO';
      } else if (lowerPlanName.includes('básico') || lowerPlanName.includes('basico') || lowerPlanName.includes('basic')) {
        planKey = 'BASICO';
      }
    }

    // Redirigir con el parámetro del plan actual para mejorar UX
    router.push(`/precios?from=settings&currentPlan=${planKey.toLowerCase()}`);
  };

  const getStatusConfig = (status: string) => {
    // CRITICAL: Check if trial is expired - override TRIALING status
    if (isTrialExpired) {
      return {
        icon: AlertTriangle,
        color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800',
        text: 'Periodo de Prueba Expirado',
        description: 'Tu periodo de prueba ha terminado. Suscríbete para continuar.'
      };
    }

    switch (status) {
      case 'ACTIVE':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800 border-green-200',
          text: 'Activa',
          description: 'Tu subscripción está activa y al día'
        };
      case 'TRIALING':
        return {
          icon: Clock,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          text: 'Periodo de Prueba',
          description: 'Disfruta de todas las funciones gratis'
        };
      case 'PAST_DUE':
        return {
          icon: AlertTriangle,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          text: 'Pago Vencido',
          description: 'Se requiere actualizar el método de pago'
        };
      case 'CANCELED':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800 border-red-200',
          text: 'Cancelada',
          description: 'La subscripción ha sido cancelada'
        };
      default:
        return {
          icon: XCircle,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          text: 'Inactiva',
          description: 'No tienes una subscripción activa'
        };
    }
  };

  const statusConfig = getStatusConfig(subscriptionStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Status Overview Card */}
      <div className={`
        relative overflow-hidden rounded-lg border p-6
        ${isTrialExpired
          ? 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800'
          : isInTrial
          ? 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800'
          : needsPayment
          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800'
          : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800'
        }
      `}>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isTrialExpired ? 'bg-red-100 dark:bg-red-900/40' : isInTrial ? 'bg-blue-100 dark:bg-blue-900/40' : needsPayment ? 'bg-yellow-100 dark:bg-yellow-900/40' : 'bg-green-100 dark:bg-green-900/40'}`}>
                <StatusIcon className={`h-6 w-6 ${isTrialExpired ? 'text-red-600 dark:text-red-400' : isInTrial ? 'text-blue-600 dark:text-blue-400' : needsPayment ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado de la Subscripción</p>
                <h3 className="text-2xl font-bold">{statusConfig.text}</h3>
              </div>
            </div>
            <Badge className={statusConfig.color} variant="outline">
              {planName || 'Sin plan'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{statusConfig.description}</p>
        </div>
      </div>

      {/* Details Grid */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plan Details */}
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  Plan Actual
                </p>
                <p className="text-lg font-bold">
                  {planName || 'Sin plan activo'}
                </p>
              </div>

              {subscriptionEndsAt && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    {isCanceled ? 'Termina' : isInTrial ? 'Prueba termina' : 'Renueva'}
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg font-semibold">
                      {format(new Date(subscriptionEndsAt), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Status & Actions */}
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Estado
                </p>
                <Badge className={`${statusConfig.color} flex items-center gap-1.5 w-fit px-3 py-1.5`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  <span className="font-medium">{statusConfig.text}</span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Trial Info Banner */}
          {isInTrial && tenant.trialEndsAt && (
            <div className={`mt-6 p-4 rounded-lg ${
              isTrialExpired
                ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                : 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  isTrialExpired
                    ? 'bg-red-100 dark:bg-red-900/50'
                    : 'bg-blue-100 dark:bg-blue-900/50'
                }`}>
                  {isTrialExpired ? (
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${
                    isTrialExpired
                      ? 'text-red-900 dark:text-red-100'
                      : 'text-blue-900 dark:text-blue-100'
                  }`}>
                    {isTrialExpired ? 'Periodo de Prueba Expirado' : 'Periodo de Prueba Gratuito'}
                  </p>
                  <p className={`text-xs mt-1 ${
                    isTrialExpired
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-blue-700 dark:text-blue-300'
                  }`}>
                    {isTrialExpired ? (
                      <>
                        Tu periodo de prueba terminó el{' '}
                        <span className="font-semibold">
                          {format(new Date(tenant.trialEndsAt), 'dd MMMM yyyy', { locale: es })}
                        </span>
                        . Suscríbete ahora para continuar usando Vetify.
                      </>
                    ) : (
                      <>
                        Tienes acceso completo hasta el{' '}
                        <span className="font-semibold">
                          {format(new Date(tenant.trialEndsAt), 'dd MMMM yyyy', { locale: es })}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning Messages */}
          {needsPayment && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                    {isPastDue ? 'Pago Requerido' : 'Subscripción Cancelada'}
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    {isPastDue
                      ? 'Actualiza tu método de pago para evitar la interrupción del servicio'
                      : 'Tu subscripción ha sido cancelada. Reactiva para continuar usando todas las funciones'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {tenant.stripeCustomerId && (hasActiveSubscription || isPastDue) && !isTrialExpired ? (
              <Button
                onClick={handleManageSubscription}
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold"
                size="lg"
                variant={needsPayment ? "default" : "outline"}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Cargando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    {needsPayment ? 'Actualizar Pago' : 'Gestionar Subscripción'}
                  </div>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleUpgradePlan}
                disabled={isCheckoutLoading}
                className={`w-full h-12 text-base font-semibold ${
                  isTrialExpired
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-primary hover:bg-primary/90'
                }`}
                size="lg"
              >
                {isCheckoutLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Redirigiendo a pago...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isTrialExpired ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <CreditCard className="h-5 w-5" />
                    )}
                    {isTrialExpired ? 'Suscribirse Ahora' : isInTrial ? 'Actualizar Plan' : 'Ver Planes Disponibles'}
                  </div>
                )}
              </Button>
            )}

            <p className="text-xs text-muted-foreground text-center pt-2">
              {isTrialExpired
                ? 'Tu periodo de prueba ha terminado. Suscríbete para recuperar el acceso completo a Vetify.'
                : isInTrial
                ? 'Explora todos nuestros planes y elige el que mejor se adapte a tu clínica'
                : needsPayment
                ? 'Actualiza tu información de pago para continuar sin interrupciones'
                : 'Gestiona tu subscripción, métodos de pago y facturas'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 