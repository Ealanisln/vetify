import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Heart, 
  MessageCircle, 
  HardDrive, 
  AlertTriangle,
  ArrowUpIcon 
} from 'lucide-react';
import Link from 'next/link';

interface PlanLimitsCardProps {
  planStatus: {
    plan: {
      name: string;
      key: string;
      isTrialPeriod: boolean;
      trialEndsAt?: Date;
    };
    limits: {
      maxPets: number;
      maxUsers: number;
      maxMonthlyWhatsApp: number;
      maxStorageGB: number;
    };
    usage: {
      currentPets: number;
      currentUsers: number;
      currentMonthlyWhatsApp: number;
      currentStorageBytes: number;
    };
    percentages: {
      pets: number;
      users: number;
      whatsapp: number;
      storage: number;
    };
    warnings: {
      pets: boolean;
      users: boolean;
      whatsapp: boolean;
      storage: boolean;
    };
  };
}

export function PlanLimitsCard({ planStatus }: PlanLimitsCardProps) {
  const { plan, limits, usage, percentages, warnings } = planStatus;

  const limitItems = [
    {
      icon: <Heart className="h-4 w-4" />,
      label: 'Mascotas',
      current: usage.currentPets,
      limit: limits.maxPets,
      percentage: percentages.pets,
      warning: warnings.pets,
      color: 'text-pink-600'
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: 'Usuarios',
      current: usage.currentUsers,
      limit: limits.maxUsers,
      percentage: percentages.users,
      warning: warnings.users,
      color: 'text-blue-600'
    },
    {
      icon: <MessageCircle className="h-4 w-4" />,
      label: 'WhatsApp/mes',
      current: usage.currentMonthlyWhatsApp,
      limit: limits.maxMonthlyWhatsApp,
      percentage: percentages.whatsapp,
      warning: warnings.whatsapp,
      color: 'text-green-600'
    },
    {
      icon: <HardDrive className="h-4 w-4" />,
      label: 'Almacenamiento',
      current: Math.round(usage.currentStorageBytes / (1024 * 1024 * 1024) * 100) / 100,
      limit: limits.maxStorageGB,
      percentage: percentages.storage,
      warning: warnings.storage,
      color: 'text-purple-600',
      unit: 'GB'
    }
  ];

  const getProgressColor = (percentage: number, warning: boolean) => {
    if (warning || percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Límites del Plan
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="outline" className="font-medium dark:border-gray-600 dark:text-gray-300">
              {plan.name}
            </Badge>
            {plan.isTrialPeriod && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700">
                Período de Prueba
              </Badge>
            )}
          </div>
        </div>
        
        <Link href="/precios">
          <Button size="sm" variant="outline" className="flex items-center space-x-2">
            <ArrowUpIcon className="h-4 w-4" />
            <span>Actualizar</span>
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {limitItems.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={item.color}>
                  {item.icon}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </span>
                {item.warning && (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {item.current}{item.unit || ''} / {item.limit}{item.unit || ''}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(item.percentage, item.warning)}`}
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{item.percentage}% usado</span>
              <span>
                {item.limit - item.current} {item.unit || ''} restantes
              </span>
            </div>
          </div>
        ))}
      </div>

      {plan.isTrialPeriod && plan.trialEndsAt && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Período de prueba
            </span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
            Tu período de prueba termina el{' '}
            {new Date(plan.trialEndsAt).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <Link href="/precios" className="mt-2">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Elegir Plan
            </Button>
          </Link>
        </div>
      )}

      {(warnings.pets || warnings.users || warnings.whatsapp || warnings.storage) && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-900 dark:text-amber-300">
              Cerca del límite
            </span>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
            Estás usando más del 80% de algunos límites de tu plan.
            Considera actualizar para evitar interrupciones.
          </p>
        </div>
      )}
    </Card>
  );
} 