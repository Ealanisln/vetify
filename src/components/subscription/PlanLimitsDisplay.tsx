'use client';

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { useSubscription } from '../../hooks/useSubscription';
import type { Tenant } from '@prisma/client';
import { 
  Users, 
  Heart, 
  HardDrive, 
  AlertTriangle, 
  CheckCircle
} from 'lucide-react';

interface PlanLimitsDisplayProps {
  tenant: Tenant & {
    tenantUsageStats?: {
      totalUsers: number;
      totalPets: number;
      storageUsedBytes: bigint;
    } | null;
    tenantSubscription?: {
      plan: {
        maxUsers: number;
        maxPets: number;
        storageGB: number;
      };
    } | null;
  };
}

export function PlanLimitsDisplay({ tenant }: PlanLimitsDisplayProps) {
  const { hasActiveSubscription, planName } = useSubscription(tenant);

  // Valores por defecto para plan gratuito/inactivo
  const defaultLimits = {
    maxUsers: 1,
    maxPets: 10,
    storageGB: 1
  };

  // Obtener límites del plan actual
  const planLimits = tenant.tenantSubscription?.plan || defaultLimits;
  
  // Obtener uso actual
  const usage = tenant.tenantUsageStats || {
    totalUsers: 1,
    totalPets: 0,
    storageUsedBytes: BigInt(0)
  };

  // Convertir bytes a GB para mostrar
  const storageUsedGB = Number(usage.storageUsedBytes) / (1024 * 1024 * 1024);

  // Calcular porcentajes de uso
  const usagePercentages = {
    users: (usage.totalUsers / planLimits.maxUsers) * 100,
    pets: (usage.totalPets / planLimits.maxPets) * 100,
    storage: (storageUsedGB / planLimits.storageGB) * 100
  };

  // Función para obtener el color según el porcentaje de uso
  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (percentage >= 75) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  };

  // Función para obtener el ícono según el porcentaje de uso
  const getUsageIcon = (percentage: number) => {
    if (percentage >= 90) return AlertTriangle;
    return CheckCircle;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const items = [
    {
      label: 'Usuarios',
      icon: Users,
      current: usage.totalUsers,
      limit: planLimits.maxUsers,
      percentage: usagePercentages.users,
      unit: ''
    },
    {
      label: 'Mascotas',
      icon: Heart,
      current: usage.totalPets,
      limit: planLimits.maxPets,
      percentage: usagePercentages.pets,
      unit: ''
    },
    {
      label: 'Almacenamiento',
      icon: HardDrive,
      current: storageUsedGB,
      limit: planLimits.storageGB,
      percentage: usagePercentages.storage,
      unit: 'GB',
      formatter: (value: number) => value < 1 ? formatBytes(Number(usage.storageUsedBytes)) : `${value.toFixed(1)} GB`
    }
  ];

  return (
    <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Uso del Plan
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Plan: {planName || 'Plan Básico'}
          </p>
        </div>
        {!hasActiveSubscription && (
          <Badge variant="outline" className="text-xs">
            Plan Gratuito
          </Badge>
        )}
      </div>

      {/* Usage Items */}
      <div className="space-y-4">
        {items.map((item) => {
          const Icon = item.icon;
          const UsageIcon = getUsageIcon(item.percentage);
          const colorClass = getUsageColor(item.percentage);
          
          return (
            <div key={item.label} className="space-y-2">
              {/* Item Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {item.formatter 
                      ? item.formatter(item.current)
                      : `${item.current}${item.unit}`
                    } / {item.limit}{item.unit}
                  </span>
                  <UsageIcon className={`h-3 w-3 ${
                    item.percentage >= 90 ? 'text-red-500' : 'text-green-500'
                  }`} />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    item.percentage >= 90
                      ? 'bg-red-500'
                      : item.percentage >= 75
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>

              {/* Warning Message */}
              {item.percentage >= 90 && (
                <div className={`p-2 rounded-lg border ${colorClass}`}>
                  <p className="text-xs font-medium">
                    ⚠️ Límite casi alcanzado - Considera actualizar tu plan
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upgrade CTA */}
      {!hasActiveSubscription && (
        <div className="mt-6 p-4 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/40 rounded-lg">
          <div className="text-center">
            <p className="text-sm font-medium text-foreground mb-2">
              ¿Necesitas más capacidad?
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Actualiza a un plan premium para obtener límites más altos
            </p>
            <button
              onClick={() => window.location.href = '/precios'}
              className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 transition-colors"
            >
              Ver Planes
            </button>
          </div>
        </div>
      )}
    </Card>
  );
} 