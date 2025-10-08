'use client';

import { useEffect, useState, ReactNode } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Lock,
  Crown,
  ArrowRight,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Tenant } from '@prisma/client';
import { calculateTrialStatus } from '../../lib/trial/utils';
import type { Feature } from '../../types/trial';
import { PREMIUM_FEATURES } from '../../types/trial';

interface FeatureGuardProps {
  children: ReactNode;
  feature: Feature;
  action?: 'view' | 'create' | 'update' | 'delete';
  tenant: Tenant;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
}

interface FeatureAccessCheck {
  allowed: boolean;
  reason?: string;
  isLoading: boolean;
  usageInfo?: {
    used: number;
    limit: number;
  };
}

export function FeatureGuard({
  children,
  feature,
  action = 'view',
  tenant,
  fallback,
  showUpgradePrompt = true,
  className
}: FeatureGuardProps) {
  const router = useRouter();
  const [accessCheck, setAccessCheck] = useState<FeatureAccessCheck>({
    allowed: false,
    isLoading: true
  });

  // Check access on mount and when dependencies change
  useEffect(() => {
    checkFeatureAccess();
  }, [feature, action, tenant.id, tenant.trialEndsAt, tenant.subscriptionStatus]);

  const checkFeatureAccess = async () => {
    try {
      setAccessCheck(prev => ({ ...prev, isLoading: true }));

      // Quick client-side checks first
      const trialStatus = calculateTrialStatus(tenant);
      
      // If has active paid subscription, allow everything
      if (tenant.subscriptionStatus === 'ACTIVE' && !tenant.isTrialPeriod) {
        setAccessCheck({
          allowed: true,
          isLoading: false
        });
        return;
      }

      // If trial expired, block premium features and creation actions
      if (trialStatus.status === 'expired') {
        if (PREMIUM_FEATURES.includes(feature as 'inventory' | 'reports' | 'automations') || action === 'create') {
          setAccessCheck({
            allowed: false,
            reason: `Trial expirado hace ${Math.abs(trialStatus.daysRemaining)} días`,
            isLoading: false
          });
          return;
        }
      }

      // For creation actions, check via API for detailed validation
      if (action === 'create') {
        const response = await fetch('/api/trial/check-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            feature,
            action
          })
        });

        if (response.ok) {
          const result = await response.json();
          setAccessCheck({
            allowed: result.allowed,
            reason: result.reason,
            isLoading: false,
            usageInfo: result.remainingQuota ? {
              used: result.remainingQuota.used,
              limit: result.remainingQuota.limit
            } : undefined
          });
        } else {
          // On API error, allow access to prevent blocking
          console.warn('Feature access check failed, allowing access');
          setAccessCheck({
            allowed: true,
            isLoading: false
          });
        }
      } else {
        // For view actions on non-premium features, allow access
        if (!PREMIUM_FEATURES.includes(feature as 'inventory' | 'reports' | 'automations')) {
          setAccessCheck({
            allowed: true,
            isLoading: false
          });
        } else {
          setAccessCheck({
            allowed: false,
            reason: `Función ${feature} requiere suscripción`,
            isLoading: false
          });
        }
      }
    } catch (error) {
      console.error('Feature access check error:', error);
      // On error, allow access to prevent blocking
      setAccessCheck({
        allowed: true,
        isLoading: false
      });
    }
  };

  const handleUpgrade = () => {
    const url = new URL('/precios', window.location.origin);
    url.searchParams.set('source', 'feature_guard');
    url.searchParams.set('feature', feature);
    url.searchParams.set('action', action);
    
    router.push(url.toString());
  };

  // Show loading state
  if (accessCheck.isLoading) {
    return (
      <div className={`opacity-50 pointer-events-none ${className}`}>
        {children}
      </div>
    );
  }

  // If access is allowed, render children normally
  if (accessCheck.allowed) {
    return <div className={className}>{children}</div>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  // Default blocked state UI
  return (
    <div className={className}>
      <Card className="bg-gray-50 dark:bg-gray-900/20 border-2 border-dashed border-gray-300 dark:border-gray-700 p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-700">
              {PREMIUM_FEATURES.includes(feature as 'inventory' | 'reports' | 'automations') ? (
                <Crown className="h-6 w-6 text-amber-600" />
              ) : (
                <Lock className="h-6 w-6 text-gray-600" />
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {getBlockedTitle(feature, action)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {accessCheck.reason || getBlockedDescription(feature, action)}
                </p>
              </div>
              
              {PREMIUM_FEATURES.includes(feature as 'inventory' | 'reports' | 'automations') && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>

            {/* Usage info if available */}
            {accessCheck.usageInfo && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-400">
                    Límite alcanzado
                  </span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Has usado {accessCheck.usageInfo.used} de {accessCheck.usageInfo.limit} {feature} permitidos durante tu período de prueba.
                </p>
              </div>
            )}
            
            {showUpgradePrompt && (
              <div className="flex items-center gap-3 mt-4">
                <Button
                  onClick={handleUpgrade}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  size="sm"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Actualizar Plan
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Acceso inmediato</span>
                </div>
              </div>
            )}

            {/* Feature benefits */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {getFeatureBenefits(feature).map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Helper functions
function getBlockedTitle(feature: Feature, action: string): string {
  const actionText = action === 'create' ? 'Crear' : 'Acceder a';
  
  switch (feature) {
    case 'pets':
      return `${actionText} mascotas`;
    case 'appointments':
      return `${actionText} citas`;
    case 'inventory':
      return 'Gestión de inventario';
    case 'reports':
      return 'Reportes avanzados';
    case 'automations':
      return 'Automatizaciones WhatsApp';
    default:
      return `${actionText} ${feature}`;
  }
}

function getBlockedDescription(feature: Feature, action: string): string {
  if (PREMIUM_FEATURES.includes(feature as 'inventory' | 'reports' | 'automations')) {
    return 'Esta función requiere una suscripción activa para acceder.';
  }
  
  if (action === 'create') {
    return 'Has alcanzado el límite de tu período de prueba. Actualiza para continuar creando.';
  }
  
  return 'Actualiza tu plan para acceder a esta función.';
}

function getFeatureBenefits(feature: Feature): string[] {
  switch (feature) {
    case 'inventory':
      return [
        'Control completo de stock',
        'Alertas de inventario bajo',
        'Gestión de proveedores'
      ];
    case 'reports':
      return [
        'Reportes de ventas',
        'Análisis de clientes',
        'Métricas de rendimiento'
      ];
    case 'automations':
      return [
        'Mensajes automáticos',
        'Recordatorios WhatsApp',
        'Confirmaciones de citas'
      ];
    case 'pets':
      return [
        'Registro ilimitado',
        'Historial médico completo',
        'Fotos y documentos'
      ];
    case 'appointments':
      return [
        'Citas ilimitadas',
        'Calendario avanzado',
        'Recordatorios automáticos'
      ];
    default:
      return ['Acceso completo', 'Soporte prioritario'];
  }
}
