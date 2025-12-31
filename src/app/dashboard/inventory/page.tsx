/**
 * Inventory Page
 *
 * PLAN FEATURES:
 * - Plan Básico: Basic inventory management (CRUD, stock tracking, search/filter)
 * - Plan Profesional: Advanced features gated with FeatureGate:
 *   - Rotation analysis with ABC classification
 *   - Automated low-stock and expiration alerts
 *   - Detailed movement reports with filters
 *   - Expiration tracking with FIFO recommendations
 */
import { Suspense } from 'react';
import { requireActiveSubscription } from '../../../lib/auth';
import { InventoryMain } from '../../../components/inventory/InventoryMain';
import { InventoryStats } from '../../../components/inventory/InventoryStats';
import { LowStockAlert } from '../../../components/inventory/LowStockAlert';
import { FeatureGate } from '../../../components/features/FeatureGate';
import { AdvancedInventoryFeatures } from '../../../components/inventory/AdvancedInventoryFeatures';
import AdvancedInventoryUpgradePrompt from '../../../components/inventory/AdvancedInventoryUpgradePrompt';

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
        fallback={<AdvancedInventoryUpgradePrompt />}
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