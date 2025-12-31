'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  ChartBarIcon,
  ArrowPathIcon,
  BellAlertIcon,
  TruckIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import { themeColors } from '../../utils/theme-colors';

interface AdvancedInventoryFeaturesProps {
  tenantId: string;
}

type TabType = 'movements' | 'rotation' | 'alerts' | 'suppliers';

interface TabConfig {
  id: TabType;
  label: string;
  icon: typeof ChartBarIcon;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: 'movements',
    label: 'Movimientos',
    icon: ArrowPathIcon,
    description: 'Historial detallado de entradas, salidas y transferencias'
  },
  {
    id: 'rotation',
    label: 'Análisis de Rotación',
    icon: ChartBarIcon,
    description: 'Identifica productos de alta y baja rotación'
  },
  {
    id: 'alerts',
    label: 'Alertas Automatizadas',
    icon: BellAlertIcon,
    description: 'Configura alertas de stock bajo y vencimiento'
  },
  {
    id: 'suppliers',
    label: 'Proveedores',
    icon: TruckIcon,
    description: 'Gestiona proveedores y órdenes de compra'
  }
];

/**
 * Advanced Inventory Features Component
 *
 * This component provides access to advanced inventory management features
 * that are only available for Plan Profesional and above:
 * - Detailed movement history and reports
 * - Stock rotation analysis (FIFO tracking)
 * - Automated low-stock and expiration alerts
 * - Supplier management and purchase orders
 */
export function AdvancedInventoryFeatures({ tenantId }: AdvancedInventoryFeaturesProps) {
  const [activeTab, setActiveTab] = useState<TabType>('movements');

  return (
    <Card className={`${themeColors.background.card} border ${themeColors.border.primary}`}>
      {/* Header */}
      <div className={`p-4 sm:p-6 border-b ${themeColors.border.primary}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${themeColors.text.primary}`}>
              Funciones Avanzadas de Inventario
            </h3>
            <p className={`mt-1 text-sm ${themeColors.text.secondary}`}>
              Herramientas avanzadas para optimizar tu gestión de inventario
            </p>
          </div>
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            Plan Profesional
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className={`border-b ${themeColors.border.primary}`}>
        <nav className="flex overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap
                  transition-colors flex-shrink-0
                  ${isActive
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : `border-transparent ${themeColors.text.secondary} hover:text-purple-600 dark:hover:text-purple-400 hover:border-gray-300`
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-6">
        {activeTab === 'movements' && <MovementsTab tenantId={tenantId} />}
        {activeTab === 'rotation' && <RotationTab tenantId={tenantId} />}
        {activeTab === 'alerts' && <AlertsTab tenantId={tenantId} />}
        {activeTab === 'suppliers' && <SuppliersTab tenantId={tenantId} />}
      </div>
    </Card>
  );
}

// Tab Components (placeholder implementations)

function MovementsTab({ tenantId: _tenantId }: { tenantId: string }) {
  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 ${themeColors.text.primary}`}>
        <DocumentChartBarIcon className="h-6 w-6 text-purple-500" />
        <div>
          <h4 className="font-medium">Historial de Movimientos</h4>
          <p className={`text-sm ${themeColors.text.secondary}`}>
            Registro detallado de todas las entradas, salidas y transferencias
          </p>
        </div>
      </div>

      {/* Placeholder for movements list */}
      <div className={`${themeColors.background.secondary} rounded-lg p-8 text-center`}>
        <ArrowPathIcon className={`h-12 w-12 mx-auto mb-4 ${themeColors.text.tertiary}`} />
        <p className={`${themeColors.text.secondary}`}>
          El historial de movimientos se mostrará aquí.
        </p>
        <p className={`text-sm ${themeColors.text.tertiary} mt-2`}>
          Incluye: Entradas, Salidas, Transferencias, Ajustes
        </p>
      </div>
    </div>
  );
}

function RotationTab({ tenantId: _tenantId }: { tenantId: string }) {
  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 ${themeColors.text.primary}`}>
        <ChartBarIcon className="h-6 w-6 text-purple-500" />
        <div>
          <h4 className="font-medium">Análisis de Rotación</h4>
          <p className={`text-sm ${themeColors.text.secondary}`}>
            Identifica productos de alta y baja rotación para optimizar tu inventario
          </p>
        </div>
      </div>

      {/* Placeholder for rotation analysis */}
      <div className={`${themeColors.background.secondary} rounded-lg p-8 text-center`}>
        <ChartBarIcon className={`h-12 w-12 mx-auto mb-4 ${themeColors.text.tertiary}`} />
        <p className={`${themeColors.text.secondary}`}>
          El análisis de rotación se mostrará aquí.
        </p>
        <p className={`text-sm ${themeColors.text.tertiary} mt-2`}>
          Incluye: Productos más vendidos, Stock sin movimiento, Tendencias
        </p>
      </div>
    </div>
  );
}

function AlertsTab({ tenantId: _tenantId }: { tenantId: string }) {
  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 ${themeColors.text.primary}`}>
        <BellAlertIcon className="h-6 w-6 text-purple-500" />
        <div>
          <h4 className="font-medium">Alertas Automatizadas</h4>
          <p className={`text-sm ${themeColors.text.secondary}`}>
            Configura alertas automáticas para stock bajo y productos por vencer
          </p>
        </div>
      </div>

      {/* Placeholder for alerts configuration */}
      <div className={`${themeColors.background.secondary} rounded-lg p-8 text-center`}>
        <BellAlertIcon className={`h-12 w-12 mx-auto mb-4 ${themeColors.text.tertiary}`} />
        <p className={`${themeColors.text.secondary}`}>
          La configuración de alertas se mostrará aquí.
        </p>
        <p className={`text-sm ${themeColors.text.tertiary} mt-2`}>
          Incluye: Alertas por email, WhatsApp, Umbrales personalizados
        </p>
      </div>
    </div>
  );
}

function SuppliersTab({ tenantId: _tenantId }: { tenantId: string }) {
  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 ${themeColors.text.primary}`}>
        <TruckIcon className="h-6 w-6 text-purple-500" />
        <div>
          <h4 className="font-medium">Gestión de Proveedores</h4>
          <p className={`text-sm ${themeColors.text.secondary}`}>
            Administra tus proveedores y genera órdenes de compra automáticas
          </p>
        </div>
      </div>

      {/* Placeholder for suppliers management */}
      <div className={`${themeColors.background.secondary} rounded-lg p-8 text-center`}>
        <TruckIcon className={`h-12 w-12 mx-auto mb-4 ${themeColors.text.tertiary}`} />
        <p className={`${themeColors.text.secondary}`}>
          La gestión de proveedores se mostrará aquí.
        </p>
        <p className={`text-sm ${themeColors.text.tertiary} mt-2`}>
          Incluye: Catálogo de proveedores, Órdenes de compra, Historial
        </p>
      </div>
    </div>
  );
}
