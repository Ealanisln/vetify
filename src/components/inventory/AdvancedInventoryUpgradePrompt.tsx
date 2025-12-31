'use client';

import Link from 'next/link';
import {
  CubeIcon,
  ArrowPathIcon,
  BellAlertIcon,
  DocumentChartBarIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

/**
 * Upgrade prompt displayed when user tries to access advanced inventory features
 * without a Professional or higher plan
 */
export default function AdvancedInventoryUpgradePrompt() {
  const features = [
    {
      icon: ArrowPathIcon,
      title: 'Análisis de Rotación',
      description: 'Identifica productos de lenta rotación y optimiza tu inventario'
    },
    {
      icon: BellAlertIcon,
      title: 'Alertas Automáticas',
      description: 'Recibe notificaciones cuando el stock esté bajo o próximo a vencer'
    },
    {
      icon: DocumentChartBarIcon,
      title: 'Reportes Detallados',
      description: 'Historial completo de movimientos con filtros avanzados'
    },
    {
      icon: CalendarDaysIcon,
      title: 'Gestión de Lotes',
      description: 'Control de lotes, vencimientos y rotación FIFO automática'
    }
  ];

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <CubeIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Desbloquea Inventario Avanzado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Optimiza tu gestión de inventario con análisis de rotación, alertas automáticas y reportes detallados
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 text-left p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Link href="/precios">
              <Button size="lg" className="w-full md:w-auto min-w-[200px]">
                Actualizar a Plan Profesional
              </Button>
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Acceso inmediato • Sin compromiso • Cancela cuando quieras
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
