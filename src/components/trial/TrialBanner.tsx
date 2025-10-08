'use client';

import { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Clock,
  CalendarX,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  XCircle,
  Zap
} from 'lucide-react';
import type { Tenant } from '@prisma/client';
import { calculateTrialStatus, type TrialStatus } from '../../lib/trial/utils';
import { useRouter } from 'next/navigation';
import { UpgradeModal } from './UpgradeModal';

interface TrialBannerProps {
  tenant: Tenant;
  compact?: boolean;
  showBenefits?: boolean;
}

export function TrialBanner({
  tenant,
  compact = false,
  showBenefits = true
}: TrialBannerProps) {
  const router = useRouter();
  const [trialStatus, setTrialStatus] = useState(() => calculateTrialStatus(tenant));
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Update countdown every minute for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTrialStatus(calculateTrialStatus(tenant));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [tenant]);

  // Don't show banner if not in trial or already converted
  if (!tenant.isTrialPeriod || trialStatus.status === 'converted') {
    return null;
  }

  const getBannerConfig = () => {
    switch (trialStatus.status) {
      case 'expired':
        return {
          icon: CalendarX,
          bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-300',
          textColor: 'text-red-800 dark:text-red-400',
          iconColor: 'text-red-600',
          buttonColor: 'bg-red-600 hover:bg-red-700 text-white',
          urgencyLevel: 'critical' as const
        };
      case 'ending_soon':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-300',
          textColor: 'text-orange-800 dark:text-orange-400',
          iconColor: 'text-orange-600',
          buttonColor: 'bg-orange-600 hover:bg-orange-700 text-white',
          urgencyLevel: 'high' as const
        };
      case 'active':
        return {
          icon: Clock,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300',
          textColor: 'text-blue-800 dark:text-blue-400',
          iconColor: 'text-blue-600',
          buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white',
          urgencyLevel: 'low' as const
        };
      default:
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-300',
          textColor: 'text-green-800 dark:text-green-400',
          iconColor: 'text-green-600',
          buttonColor: 'bg-green-600 hover:bg-green-700 text-white',
          urgencyLevel: 'none' as const
        };
    }
  };

  const config = getBannerConfig();
  const Icon = config.icon;

  const handleUpgrade = () => {
    // Open upgrade modal instead of redirecting to pricing page
    setShowUpgradeModal(true);
  };

  const handleViewPricing = () => {
    // Add tracking parameters for better analytics
    const url = new URL('/precios', window.location.origin);
    url.searchParams.set('source', 'trial_banner');
    url.searchParams.set('status', trialStatus.status);
    url.searchParams.set('days_remaining', trialStatus.daysRemaining.toString());

    router.push(url.toString());
  };

  // Compact version for header/sidebar
  if (compact) {
    return (
      <div className={`px-4 py-2 ${config.bgColor} border rounded-lg flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.iconColor}`} />
          <span className={`text-sm font-medium ${config.textColor}`}>
            {trialStatus.displayMessage}
          </span>
        </div>
        {trialStatus.showUpgradePrompt && (
          <Button
            size="sm"
            variant="ghost"
            className={config.textColor}
            onClick={handleUpgrade}
          >
            Actualizar
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    );
  }

  // Full banner version
  return (
    <Card className={`${config.bgColor} border-2 p-6`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className={`p-3 rounded-full bg-white/80 ${config.iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className={`text-lg font-bold ${config.textColor} mb-1`}>
                {trialStatus.displayMessage}
              </h3>
              <p className={`text-sm ${config.textColor} opacity-90`}>
                {getContextualMessage(trialStatus)}
              </p>
            </div>
            
            {/* Urgency indicator */}
            {config.urgencyLevel === 'critical' && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                ¡Urgente!
              </Badge>
            )}
            {config.urgencyLevel === 'high' && (
              <Badge variant="secondary" className="text-xs">
                Pronto
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {trialStatus.showUpgradePrompt && (
              <>
                <Button
                  onClick={handleUpgrade}
                  className={config.buttonColor}
                  size="sm"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Actualizar Ahora
                </Button>
                <Button
                  onClick={handleViewPricing}
                  variant="outline"
                  size="sm"
                  className="border-gray-300"
                >
                  Ver Planes
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}
            
            {trialStatus.status === 'active' && (
              <Badge variant="outline" className="text-xs">
                {trialStatus.daysRemaining} días restantes
              </Badge>
            )}
            
            {trialStatus.status === 'expired' && (
              <Badge variant="destructive" className="text-xs">
                Expirado hace {Math.abs(trialStatus.daysRemaining)} día{Math.abs(trialStatus.daysRemaining) !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Benefits section */}
          {showBenefits && (
            <div className="mt-4">
              {trialStatus.status === 'expired' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <h4 className={`text-sm font-semibold ${config.textColor} mb-2 col-span-full`}>
                    Funciones bloqueadas:
                  </h4>
                  {[
                    'Crear nuevas mascotas',
                    'Agendar nuevas citas',
                    'Acceso a inventario'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <XCircle className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{feature}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <h4 className={`text-sm font-semibold ${config.textColor} mb-2 col-span-full`}>
                    {trialStatus.status === 'active' ? 'Incluido en tu prueba:' : 'Desbloquea con suscripción:'}
                  </h4>
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
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlanKey={null}
        isTrialPeriod={tenant.isTrialPeriod}
      />
    </Card>
  );
}

// Helper function to get contextual messages
function getContextualMessage(trialStatus: TrialStatus): string {
  switch (trialStatus.status) {
    case 'expired':
      return 'Tu período de prueba ha terminado. Actualiza ahora para continuar usando todas las funciones de Vetify.';
    case 'ending_soon':
      if (trialStatus.daysRemaining === 0) {
        return '¡Hoy es tu último día! No pierdas acceso a todas las funciones.';
      }
      return 'No pierdas acceso a todas las funciones. Actualiza antes de que termine tu prueba.';
    case 'active':
      return 'Disfruta de acceso completo a todas las funciones durante tu período de prueba.';
    default:
      return 'Estado de prueba desconocido.';
  }
}
