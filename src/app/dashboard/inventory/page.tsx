/**
 * Inventory Page
 *
 * PLAN FEATURES:
 * - Plan Básico: Basic inventory management (add/edit items, track stock)
 * - Plan Profesional: Advanced features (rotation analysis, automatic alerts, supplier integration, detailed reports)
 *
 * Advanced features are gated with FeatureGate component:
 *   - Detailed movement reports
 *   - Rotation analysis
 *   - Automated low-stock alerts
 *   - Supplier integration
 */
import { Suspense } from 'react';
import Link from 'next/link';
import { requireActiveSubscription } from '../../../lib/auth';
import { InventoryMain } from '../../../components/inventory/InventoryMain';
import { InventoryStats } from '../../../components/inventory/InventoryStats';
import { LowStockAlert } from '../../../components/inventory/LowStockAlert';
import { FeatureGate } from '../../../components/features/FeatureGate';
import { AdvancedInventoryFeatures } from '../../../components/inventory/AdvancedInventoryFeatures';

export default async function InventoryPage() {
  const { tenant } = await requireActiveSubscription();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Gestión de Inventario
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Controla el stock de productos, medicamentos y suministros de la clínica
        </p>
      </div>

      {/* Estadísticas del inventario */}
      <Suspense 
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        }
      >
        <InventoryStats tenantId={tenant.id} />
      </Suspense>

      {/* Alerta de stock bajo */}
      <Suspense fallback={null}>
        <LowStockAlert tenantId={tenant.id} />
      </Suspense>

      {/* Panel principal de inventario */}
      <Suspense
        fallback={
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        }
      >
        <InventoryMain tenantId={tenant.id} />
      </Suspense>

      {/* Advanced Inventory Features - Plan Profesional+ only */}
      <FeatureGate
        feature="advancedInventory"
        fallback={
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-700 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  Funciones Avanzadas de Inventario
                </h3>
                <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
                  Actualiza a Plan Profesional para acceder a movimientos detallados, análisis de rotación, alertas automatizadas e integración con proveedores.
                </p>
                <Link
                  href="/precios"
                  className="mt-3 inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                >
                  Ver planes disponibles
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        }
      >
        <Suspense fallback={
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        }>
          <AdvancedInventoryFeatures tenantId={tenant.id} />
        </Suspense>
      </FeatureGate>
    </div>
  );
} 