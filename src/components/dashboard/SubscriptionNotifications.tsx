'use client';

import { useState, useEffect } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  AlertTriangle,
  Clock,
  CreditCard,
  CheckCircle,
  XCircle,
  Star,
  ArrowRight,
  CalendarX,
  Zap,
  Gift,
  X
} from 'lucide-react';
import type { Tenant } from '@prisma/client';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateTrialDaysRemaining } from '../../lib/trial/utils';

interface SubscriptionNotificationsProps {
  tenant: Tenant;
}

export function SubscriptionNotifications({ tenant }: SubscriptionNotificationsProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const {
    hasActiveSubscription,
    isInTrial,
    isPastDue,
    isCanceled,
    planName,
    subscriptionEndsAt
  } = useSubscription(tenant);

  // Load dismissed state from localStorage on mount
  useEffect(() => {
    const dismissedKey = `subscription-notification-dismissed-${tenant.id}`;
    const dismissed = localStorage.getItem(dismissedKey);
    if (dismissed) {
      setIsDismissed(true);
    }
  }, [tenant.id]);

  // Handle dismiss
  const handleDismiss = () => {
    const dismissedKey = `subscription-notification-dismissed-${tenant.id}`;
    localStorage.setItem(dismissedKey, 'true');
    setIsDismissed(true);
  };

  // Calcular días restantes - usar trialEndsAt para períodos de prueba
  const getDaysRemaining = () => {
    if (isInTrial) {
      // Para trials, usar la función específica que maneja días negativos
      return calculateTrialDaysRemaining(tenant);
    } else if (subscriptionEndsAt) {
      // Para suscripciones pagadas, usar subscriptionEndsAt
      return differenceInDays(new Date(subscriptionEndsAt), new Date());
    }
    return null;
  };

  const daysRemaining = getDaysRemaining();

  // Configuración de notificaciones según el estado
  const getNotificationConfig = () => {
    // HOTFIX: Manejar trial expirado con días negativos
    if (isInTrial && daysRemaining !== null && daysRemaining < 0) {
      const daysAgo = Math.abs(daysRemaining);
      return {
        type: 'trial-expired' as const,
        icon: CalendarX,
        title: `⚠️ Trial expirado hace ${daysAgo} día${daysAgo !== 1 ? 's' : ''}`,
        description: 'Tu período de prueba ha terminado. Suscríbete ahora para continuar usando todas las funciones.',
        bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
        textColor: 'text-red-800 dark:text-red-400',
        iconColor: 'text-red-600 dark:text-red-400',
        buttonColor: 'bg-red-600 hover:bg-red-700',
        buttonText: 'Suscribirse Ahora',
        link: '/precios'
      };
    } else if (isPastDue) {
      return {
        type: 'danger' as const,
        icon: AlertTriangle,
        title: '⚠️ Pago Vencido',
        description: 'Tu subscripción tiene un pago pendiente. Actualiza tu método de pago para continuar.',
        bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
        textColor: 'text-red-800 dark:text-red-400',
        iconColor: 'text-red-600 dark:text-red-400',
        buttonColor: 'bg-red-600 hover:bg-red-700',
        buttonText: 'Actualizar Pago',
        link: '/dashboard/settings?section=subscription'
      };
    } else if (isCanceled) {
      return {
        type: 'warning' as const,
        icon: XCircle,
        title: '📋 Subscripción Cancelada',
        description: `Tu subscripción termina el ${subscriptionEndsAt ? format(new Date(subscriptionEndsAt), 'dd MMMM yyyy', { locale: es }) : ''}. Renueva para mantener el acceso.`,
        bgColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
        textColor: 'text-orange-800 dark:text-orange-400',
        iconColor: 'text-orange-600 dark:text-orange-400',
        buttonColor: 'bg-orange-600 hover:bg-orange-700',
        buttonText: 'Renovar Subscripción',
        link: '/precios'
      };
    } else if (isInTrial && daysRemaining !== null && daysRemaining <= 3) {
      return {
        type: 'trial-ending' as const,
        icon: Clock,
        title: `⏰ Trial terminando en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}`,
        description: 'Tu periodo de prueba está por terminar. Suscríbete ahora para continuar usando todas las funciones.',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
        textColor: 'text-blue-800 dark:text-blue-400',
        iconColor: 'text-blue-600 dark:text-blue-400',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
        buttonText: 'Ver Planes',
        link: '/precios'
      };
    } else if (isInTrial && daysRemaining !== null && daysRemaining > 3) {
      return {
        type: 'trial-active' as const,
        icon: Gift,
        title: '🎉 ¡Tu prueba gratis de 30 días ha comenzado!',
        description: `Disfruta de todas las funciones premium hasta el ${subscriptionEndsAt ? format(new Date(subscriptionEndsAt), 'dd MMMM yyyy', { locale: es }) : ''}. No se te cobrará nada durante este periodo.`,
        bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
        textColor: 'text-green-800 dark:text-green-400',
        iconColor: 'text-green-600 dark:text-green-400',
        buttonColor: 'bg-green-600 hover:bg-green-700',
        buttonText: 'Ver Detalles',
        link: '/dashboard/settings?section=subscription'
      };
    } else if (!hasActiveSubscription) {
      return {
        type: 'upgrade' as const,
        icon: Star,
        title: '✨ Desbloquea Todo el Potencial',
        description: 'Accede a todas las funciones premium con una subscripción. Automatiza tu clínica veterinaria.',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700',
        textColor: 'text-purple-800 dark:text-purple-400',
        iconColor: 'text-purple-600 dark:text-purple-400',
        buttonColor: 'bg-purple-600 hover:bg-purple-700',
        buttonText: 'Ver Planes',
        link: '/precios'
      };
    }

    return null;
  };

  const config = getNotificationConfig();

  if (!config || isDismissed) return null;

  const Icon = config.icon;

  const handleAction = () => {
    window.location.href = config.link;
  };

  return (
    <Card className={`${config.bgColor} border-2 p-6 shadow-lg`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className={`p-3 rounded-full bg-white/80 ${config.iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 mr-4">
              <h3 className={`text-lg font-bold ${config.textColor} mb-1`}>
                {config.title}
              </h3>
              <p className={`text-sm ${config.textColor} opacity-90`}>
                {config.description}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {planName && (
                <Badge variant="outline" className="text-xs">
                  {planName}
                </Badge>
              )}
              <button
                onClick={handleDismiss}
                className={`p-1 rounded-full hover:bg-white/20 transition-colors ${config.textColor}`}
                aria-label="Cerrar notificación"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Button
              onClick={handleAction}
              className={`${config.buttonColor} text-white flex items-center gap-2`}
              size="sm"
            >
              <CreditCard className="h-4 w-4" />
              {config.buttonText}
              <ArrowRight className="h-4 w-4" />
            </Button>

            {config.type === 'trial-ending' && daysRemaining !== null && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarX className={`h-4 w-4 ${config.iconColor}`} />
                <span className={config.textColor}>
                  {daysRemaining === 0 ? 'Termina hoy' : `${daysRemaining} días restantes`}
                </span>
              </div>
            )}

            {config.type === 'trial-expired' && daysRemaining !== null && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarX className={`h-4 w-4 ${config.iconColor}`} />
                <span className={config.textColor}>
                  Expirado hace {Math.abs(daysRemaining)} día{Math.abs(daysRemaining) !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {config.type === 'trial-active' && daysRemaining !== null && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className={`h-4 w-4 ${config.iconColor}`} />
                <span className={config.textColor}>
                  {daysRemaining} días restantes
                </span>
              </div>
            )}

            {config.type === 'upgrade' && (
              <div className="flex items-center gap-2 text-sm">
                <Zap className={`h-4 w-4 ${config.iconColor}`} />
                <span className={config.textColor}>
                  Prueba gratuita de 30 días
                </span>
              </div>
            )}
          </div>

          {/* Beneficios específicos por tipo */}
          {config.type === 'upgrade' && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                'WhatsApp automático',
                'Inventario completo',
                'Reportes avanzados'
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          )}

          {/* Beneficios del trial activo */}
          {config.type === 'trial-active' && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                'Acceso completo a todas las funciones',
                'Sin compromiso - cancela cuando quieras',
                'Soporte prioritario incluido'
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          )}

          {/* Beneficios para trial expirado - mostrar lo que se perdió */}
          {config.type === 'trial-expired' && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                'WhatsApp automático',
                'Inventario completo',
                'Reportes avanzados'
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{benefit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
} 