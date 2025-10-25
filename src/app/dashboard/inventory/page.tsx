/**
 * Inventory Page
 *
 * PLAN FEATURES:
 * - Plan Básico: Basic inventory management (add/edit items, track stock)
 * - Plan Profesional: Advanced features (rotation analysis, automatic alerts, supplier integration, detailed reports)
 *
 * TODO: Split InventoryMain into basic vs advanced sections
 * TODO: Wrap advanced features with <FeatureGate feature="advancedInventory">
 * TODO: Examples of advanced features to gate:
 *   - Detailed movement reports
 *   - Rotation analysis
 *   - Automated low-stock alerts
 *   - Supplier integration
 */
import { Suspense } from 'react';
import { requireAuth } from '../../../lib/auth';
import { InventoryMain } from '../../../components/inventory/InventoryMain';
import { InventoryStats } from '../../../components/inventory/InventoryStats';
import { LowStockAlert } from '../../../components/inventory/LowStockAlert';

export default async function InventoryPage() {
  const { tenant } = await requireAuth();

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
    </div>
  );
} 