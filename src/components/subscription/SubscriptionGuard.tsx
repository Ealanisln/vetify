'use client';

import React from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  AlertTriangle,
  CreditCard,
  Lock,
  Clock,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { formatDate } from '../../lib/utils/date-format';
import type { Tenant } from '@prisma/client';

interface SubscriptionGuardProps {
  tenant: Tenant | null;
  children: React.ReactNode;
  feature?: string;
  requireActiveSubscription?: boolean;
  showUpgradePrompt?: boolean;
  fallback?: React.ReactNode;
}

interface SubscriptionAlertProps {
  tenant: Tenant;
  type: 'trial_ending' | 'past_due' | 'canceled' | 'no_subscription';
  feature?: string;
}

function SubscriptionAlert({ tenant, type, feature }: SubscriptionAlertProps) {
  const getAlertConfig = () => {
    switch (type) {
      case 'trial_ending':
        return {
          icon: Clock,
          title: 'Tu periodo de prueba está por terminar',
          description: 'Suscríbete ahora para continuar usando todas las funciones',
          color: 'border-yellow-200 bg-yellow-50 text-yellow-800',
          iconColor: 'text-yellow-600',
          ctaText: 'Ver Planes',
          ctaColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'past_due':
        return {
          icon: AlertTriangle,
          title: 'Pago pendiente',
          description: 'Tu subscripción tiene un pago vencido. Actualiza tu método de pago',
          color: 'border-red-200 bg-red-50 text-red-800',
          iconColor: 'text-red-600',
          ctaText: 'Actualizar Pago',
          ctaColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'canceled':
        return {
          icon: XCircle,
          title: 'Subscripción cancelada',
          description: 'Tu subscripción ha sido cancelada. Renueva para acceder a todas las funciones',
          color: 'border-red-200 bg-red-50 text-red-800',
          iconColor: 'text-red-600',
          ctaText: 'Renovar Subscripción',
          ctaColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'no_subscription':
        return {
          icon: Lock,
          title: `${feature ? `${feature} requiere` : 'Se requiere'} una subscripción activa`,
          description: 'Suscríbete para acceder a esta funcionalidad premium',
          color: 'border-blue-200 bg-blue-50 text-blue-800',
          iconColor: 'text-blue-600',
          ctaText: 'Ver Planes',
          ctaColor: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const config = getAlertConfig();
  const Icon = config.icon;

  const handleAction = () => {
    if (type === 'past_due') {
      // Redirect to customer portal for payment update
      window.location.href = '/dashboard/settings?section=subscription';
    } else {
      // Redirect to pricing page
      window.location.href = '/precios';
    }
  };

  return (
    <Card className={`p-6 border-2 ${config.color}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <Icon className={`h-6 w-6 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-2">
            {config.title}
          </h3>
          <p className="text-sm mb-4 opacity-90">
            {config.description}
          </p>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleAction}
              className={`${config.ctaColor} text-white`}
              size="sm"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {config.ctaText}
            </Button>
            {tenant.subscriptionEndsAt && (
              <Badge variant="outline" className="text-xs">
                {type === 'canceled' ? 'Termina' : 'Renueva'}: {' '}
                {formatDate(tenant.subscriptionEndsAt)}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function SubscriptionGuard({
  tenant,
  children,
  feature,
  requireActiveSubscription = false,
  showUpgradePrompt = true,
  fallback
}: SubscriptionGuardProps) {
  const {
    hasActiveSubscription,
    isInTrial,
    isPastDue,
    isCanceled
  } = useSubscription(tenant);

  // Si no se requiere subscripción activa, mostrar el contenido
  if (!requireActiveSubscription) {
    return <>{children}</>;
  }

  // Si tiene subscripción activa o está en trial, mostrar contenido
  if (hasActiveSubscription) {
    return <>{children}</>;
  }

  // Si no se debe mostrar el prompt de upgrade, mostrar fallback o null
  if (!showUpgradePrompt) {
    return fallback ? <>{fallback}</> : null;
  }

  // Determinar qué tipo de alerta mostrar
  let alertType: 'trial_ending' | 'past_due' | 'canceled' | 'no_subscription';
  
  if (isPastDue) {
    alertType = 'past_due';
  } else if (isCanceled) {
    alertType = 'canceled';
  } else if (isInTrial && tenant?.trialEndsAt) {
    // Si falta menos de 3 días para que termine el trial
    const daysLeft = Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3) {
      alertType = 'trial_ending';
    } else {
      // Si está en trial pero no está cerca de terminar, mostrar contenido
      return <>{children}</>;
    }
  } else {
    alertType = 'no_subscription';
  }

  return <SubscriptionAlert tenant={tenant!} type={alertType} feature={feature} />;
}

export function SubscriptionStatus({ tenant }: { tenant: Tenant }) {
  const {
    hasActiveSubscription,
    isInTrial,
    isPastDue,
    isCanceled,
    planName
  } = useSubscription(tenant);

  const getStatusConfig = () => {
    if (hasActiveSubscription && !isPastDue) {
      return {
        icon: CheckCircle,
        text: isInTrial ? 'Periodo de Prueba' : 'Activa',
        color: 'bg-green-100 text-green-800',
        iconColor: 'text-green-600'
      };
    } else if (isPastDue) {
      return {
        icon: AlertTriangle,
        text: 'Pago Vencido',
        color: 'bg-yellow-100 text-yellow-800',
        iconColor: 'text-yellow-600'
      };
    } else if (isCanceled) {
      return {
        icon: XCircle,
        text: 'Cancelada',
        color: 'bg-red-100 text-red-800',
        iconColor: 'text-red-600'
      };
    } else {
      return {
        icon: Lock,
        text: 'Sin Subscripción',
        color: 'bg-gray-100 text-gray-800',
        iconColor: 'text-gray-600'
      };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className={`h-3 w-3 ${config.iconColor}`} />
        {config.text}
      </Badge>
      {planName && (
        <span className="text-sm text-muted-foreground">
          {planName}
        </span>
      )}
    </div>
  );
}

// Hook para usar en componentes cliente
export function useSubscriptionGuard(tenant: Tenant | null) {
  const subscription = useSubscription(tenant);
  
  const canAccess = (feature?: string, requireActiveSubscription = false) => {
    if (!requireActiveSubscription) return true;
    return subscription.hasActiveSubscription;
  };

  const getRestrictionReason = () => {
    if (subscription.isPastDue) return 'past_due';
    if (subscription.isCanceled) return 'canceled';
    if (subscription.isInTrial && tenant?.trialEndsAt) {
      const daysLeft = Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 3) return 'trial_ending';
    }
    return 'no_subscription';
  };

  return {
    ...subscription,
    canAccess,
    getRestrictionReason
  };
} 