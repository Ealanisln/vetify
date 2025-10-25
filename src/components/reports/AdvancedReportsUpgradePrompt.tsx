'use client';

import Link from 'next/link';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  DocumentArrowDownIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

/**
 * Upgrade prompt displayed when user tries to access advanced reports
 * without a Professional or higher plan
 */
export default function AdvancedReportsUpgradePrompt() {
  const features = [
    {
      icon: ChartBarIcon,
      title: 'Gráficos Interactivos',
      description: 'Visualiza tendencias y patrones con gráficos dinámicos'
    },
    {
      icon: ArrowTrendingUpIcon,
      title: 'Análisis de Tendencias',
      description: 'Compara períodos y detecta oportunidades de crecimiento'
    },
    {
      icon: DocumentArrowDownIcon,
      title: 'Exportación Avanzada',
      description: 'Descarga reportes detallados en múltiples formatos'
    },
    {
      icon: SparklesIcon,
      title: 'Insights Predictivos',
      description: 'Obtén recomendaciones basadas en tus datos históricos'
    }
  ];

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <ChartBarIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Desbloquea Analytics Avanzados
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Obtén insights profundos sobre tu negocio con reportes avanzados y análisis predictivo
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
