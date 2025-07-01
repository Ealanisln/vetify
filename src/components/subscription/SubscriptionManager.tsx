'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { redirectToCustomerPortal } from '@/lib/payments/actions';
import { useSubscription } from '@/hooks/useSubscription';
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
import { useState } from 'react';

interface SubscriptionManagerProps {
  tenant: Tenant;
}

export function SubscriptionManager({ tenant }: SubscriptionManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
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

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const portalUrl = await redirectToCustomerPortal();
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Error al abrir el portal de cliente:', error);
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
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
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Subscripción
            </h3>
            <p className="text-sm text-muted-foreground">
              Gestiona tu plan y facturación
            </p>
          </div>
        </div>
      </div>

      {/* Plan Info */}
      <div className="space-y-4 mb-6">
        {/* Plan Name */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Plan Actual:
          </span>
          <span className="font-semibold text-foreground">
            {planName || 'Sin plan activo'}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Estado:
          </span>
          <Badge className={`${statusConfig.color} flex items-center gap-1`}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.text}
          </Badge>
        </div>

        {/* Subscription End Date */}
        {subscriptionEndsAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {isCanceled ? 'Termina:' : isInTrial ? 'Prueba termina:' : 'Renueva:'}
            </span>
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">
                {format(new Date(subscriptionEndsAt), 'dd MMM yyyy', { locale: es })}
              </span>
            </div>
          </div>
        )}

        {/* Trial Info */}
        {isInTrial && tenant.trialEndsAt && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Periodo de Prueba Gratuito
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Tienes acceso completo hasta el{' '}
                  {format(new Date(tenant.trialEndsAt), 'dd MMM yyyy', { locale: es })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning Messages */}
        {needsPayment && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  {isPastDue ? 'Pago Requerido' : 'Subscripción Cancelada'}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  {isPastDue 
                    ? 'Actualiza tu método de pago para evitar la interrupción del servicio'
                    : 'Tu subscripción ha sido cancelada. Reactiva para continuar usando todas las funciones'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {hasActiveSubscription || isPastDue ? (
          <Button
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="w-full"
            variant={needsPayment ? "default" : "outline"}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Cargando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                {needsPayment ? 'Actualizar Pago' : 'Gestionar Subscripción'}
              </div>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => window.location.href = '/precios'}
            className="w-full"
          >
            Ver Planes Disponibles
          </Button>
        )}

        {/* Status Description */}
        <p className="text-xs text-muted-foreground text-center">
          {statusConfig.description}
        </p>
      </div>
    </Card>
  );
} 