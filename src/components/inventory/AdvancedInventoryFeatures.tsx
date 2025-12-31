'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  ArrowPathIcon,
  BellAlertIcon,
  DocumentChartBarIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { themeColors } from '@/utils/theme-colors';

type TabValue = 'rotation' | 'alerts' | 'movements' | 'expiration';

interface AdvancedInventoryFeaturesProps {
  tenantId: string;
}

interface RotationMetrics {
  itemId: string;
  itemName: string;
  category: string;
  currentStock: number;
  totalSold: number;
  turnoverRatio: number;
  daysOfInventory: number;
  abcClassification: 'A' | 'B' | 'C' | 'DEAD';
  lastMovementDate: string | null;
  daysSinceLastSale: number | null;
}

interface RotationData {
  items: RotationMetrics[];
  summary: {
    totalItems: number;
    fastMoving: number;
    slowMoving: number;
    deadStock: number;
    averageTurnover: number;
    averageDIOH: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface MovementRecord {
  id: string;
  itemId: string;
  itemName: string;
  type: string;
  quantity: number;
  date: string;
  staffName: string | null;
  notes: string | null;
}

interface MovementData {
  movements: MovementRecord[];
  summary: {
    totalMovements: number;
    totalIn: number;
    totalOut: number;
    netChange: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ExpiringItem {
  id: string;
  name: string;
  quantity: number;
  batchNumber: string | null;
  expirationDate: string | null;
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  PURCHASE_IN: 'Compra',
  SALE_OUT: 'Venta',
  RETURN_IN: 'Devolución',
  ADJUSTMENT_IN: 'Ajuste (+)',
  ADJUSTMENT_OUT: 'Ajuste (-)',
  TRANSFER_IN: 'Transferencia (+)',
  TRANSFER_OUT: 'Transferencia (-)',
  EXPIRY_OUT: 'Vencimiento'
};

const ABC_BADGES: Record<string, { label: string; color: string }> = {
  A: { label: 'Alta Rotación', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
  B: { label: 'Media Rotación', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
  C: { label: 'Baja Rotación', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' },
  DEAD: { label: 'Sin Movimiento', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' }
};

/**
 * Advanced Inventory Features Component
 *
 * Provides access to advanced inventory management features for Plan Profesional:
 * - Rotation Analysis: Turnover metrics, ABC classification, DIOH
 * - Automated Alerts: Stock and expiration notifications
 * - Movement Reports: Detailed audit trail with filters
 * - Expiration Tracking: Products nearing expiration dates
 */
export function AdvancedInventoryFeatures({ tenantId }: AdvancedInventoryFeaturesProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('rotation');

  // Rotation state
  const [rotationData, setRotationData] = useState<RotationData | null>(null);
  const [rotationLoading, setRotationLoading] = useState(false);
  const [rotationFilter, setRotationFilter] = useState<string>('');

  // Movements state
  const [movementData, setMovementData] = useState<MovementData | null>(null);
  const [movementLoading, setMovementLoading] = useState(false);
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('');
  const [movementPage, setMovementPage] = useState(1);

  // Expiration state
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [expirationLoading, setExpirationLoading] = useState(false);

  // Fetch rotation data
  const fetchRotationData = useCallback(async (classification?: string) => {
    setRotationLoading(true);
    try {
      const params = new URLSearchParams({ daysBack: '90' });
      if (classification) params.append('classification', classification);

      const response = await fetch(`/api/inventory/analytics/rotation?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRotationData(data);
      }
    } catch (error) {
      console.error('Error fetching rotation data:', error);
    } finally {
      setRotationLoading(false);
    }
  }, []);

  // Fetch movement data
  const fetchMovementData = useCallback(async (type?: string, page = 1) => {
    setMovementLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      if (type) params.append('type', type);

      const response = await fetch(`/api/inventory/movements?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMovementData(data);
      }
    } catch (error) {
      console.error('Error fetching movement data:', error);
    } finally {
      setMovementLoading(false);
    }
  }, []);

  // Fetch expiring items
  const fetchExpiringItems = useCallback(async () => {
    setExpirationLoading(true);
    try {
      const response = await fetch(`/api/inventory?action=low-stock&tenantId=${tenantId}`);
      if (response.ok) {
        const items = await response.json();
        // Filter items with expiration dates within 30 days
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const expiring = items.filter((item: ExpiringItem) => {
          if (!item.expirationDate) return false;
          const expDate = new Date(item.expirationDate);
          return expDate <= thirtyDaysFromNow;
        });
        setExpiringItems(expiring);
      }
    } catch (error) {
      console.error('Error fetching expiring items:', error);
    } finally {
      setExpirationLoading(false);
    }
  }, [tenantId]);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'rotation') {
      fetchRotationData(rotationFilter || undefined);
    } else if (activeTab === 'movements') {
      fetchMovementData(movementTypeFilter || undefined, movementPage);
    } else if (activeTab === 'expiration') {
      fetchExpiringItems();
    }
  }, [activeTab, rotationFilter, movementTypeFilter, movementPage, fetchRotationData, fetchMovementData, fetchExpiringItems]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const tabs = [
    { id: 'rotation' as const, label: 'Rotación', icon: ArrowPathIcon },
    { id: 'alerts' as const, label: 'Alertas', icon: BellAlertIcon },
    { id: 'movements' as const, label: 'Movimientos', icon: DocumentChartBarIcon },
    { id: 'expiration' as const, label: 'Vencimientos', icon: CalendarDaysIcon },
  ];

  return (
    <Card className={`border ${themeColors.border.primary}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-lg font-semibold ${themeColors.text.primary}`}>
            Funciones Avanzadas de Inventario
          </CardTitle>
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            Plan Profesional
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="grid w-full grid-cols-4 gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rotation Analysis Tab */}
        {activeTab === 'rotation' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            {rotationData?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg ${themeColors.background.secondary} border ${themeColors.border.primary}`}>
                  <div className="flex items-center gap-2">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
                    <span className={`text-sm ${themeColors.text.secondary}`}>Alta Rotación</span>
                  </div>
                  <p className={`text-2xl font-bold ${themeColors.text.primary} mt-1`}>
                    {rotationData.summary.fastMoving}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${themeColors.background.secondary} border ${themeColors.border.primary}`}>
                  <div className="flex items-center gap-2">
                    <ArrowTrendingDownIcon className="h-5 w-5 text-orange-500" />
                    <span className={`text-sm ${themeColors.text.secondary}`}>Baja Rotación</span>
                  </div>
                  <p className={`text-2xl font-bold ${themeColors.text.primary} mt-1`}>
                    {rotationData.summary.slowMoving}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${themeColors.background.secondary} border ${themeColors.border.primary}`}>
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    <span className={`text-sm ${themeColors.text.secondary}`}>Sin Movimiento</span>
                  </div>
                  <p className={`text-2xl font-bold ${themeColors.text.primary} mt-1`}>
                    {rotationData.summary.deadStock}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${themeColors.background.secondary} border ${themeColors.border.primary}`}>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-blue-500" />
                    <span className={`text-sm ${themeColors.text.secondary}`}>Días Promedio</span>
                  </div>
                  <p className={`text-2xl font-bold ${themeColors.text.primary} mt-1`}>
                    {rotationData.summary.averageDIOH || '-'}
                  </p>
                </div>
              </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={rotationFilter}
                onChange={(e) => setRotationFilter(e.target.value)}
                className="form-select text-sm"
              >
                <option value="">Todas las clasificaciones</option>
                <option value="A">Alta Rotación (A)</option>
                <option value="B">Media Rotación (B)</option>
                <option value="C">Baja Rotación (C)</option>
                <option value="DEAD">Sin Movimiento</option>
              </select>
            </div>

            {/* Rotation Table */}
            {rotationLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${themeColors.border.primary}`}>
                      <th className={`text-left py-3 px-4 text-sm font-medium ${themeColors.text.secondary}`}>Producto</th>
                      <th className={`text-left py-3 px-4 text-sm font-medium ${themeColors.text.secondary}`}>Stock</th>
                      <th className={`text-left py-3 px-4 text-sm font-medium ${themeColors.text.secondary}`}>Vendido (90d)</th>
                      <th className={`text-left py-3 px-4 text-sm font-medium ${themeColors.text.secondary}`}>Rotación</th>
                      <th className={`text-left py-3 px-4 text-sm font-medium ${themeColors.text.secondary}`}>Días Inv.</th>
                      <th className={`text-left py-3 px-4 text-sm font-medium ${themeColors.text.secondary}`}>Clasificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rotationData?.items.map((item) => (
                      <tr key={item.itemId} className={`border-b ${themeColors.border.primary} hover:bg-gray-50 dark:hover:bg-gray-800/50`}>
                        <td className={`py-3 px-4 ${themeColors.text.primary}`}>{item.itemName}</td>
                        <td className={`py-3 px-4 ${themeColors.text.primary}`}>{item.currentStock}</td>
                        <td className={`py-3 px-4 ${themeColors.text.primary}`}>{item.totalSold}</td>
                        <td className={`py-3 px-4 ${themeColors.text.primary}`}>{item.turnoverRatio}x</td>
                        <td className={`py-3 px-4 ${themeColors.text.primary}`}>
                          {item.daysOfInventory >= 999 ? '∞' : item.daysOfInventory}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={ABC_BADGES[item.abcClassification].color}>
                            {ABC_BADGES[item.abcClassification].label}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!rotationData?.items || rotationData.items.length === 0) && (
                  <p className={`text-center py-8 ${themeColors.text.secondary}`}>
                    No hay datos de rotación disponibles
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Alerts Configuration Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-lg ${themeColors.background.secondary} border ${themeColors.border.primary}`}>
              <div className="flex items-center gap-3 mb-4">
                <BellAlertIcon className="h-6 w-6 text-primary" />
                <h3 className={`text-lg font-medium ${themeColors.text.primary}`}>
                  Configuración de Alertas Automáticas
                </h3>
              </div>
              <p className={`${themeColors.text.secondary} mb-4`}>
                Las alertas automáticas de stock bajo ya están activas. Se envían notificaciones por email
                cuando un producto alcanza su nivel mínimo de stock.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-700 dark:text-green-400">Alertas de Stock Bajo</h4>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Activas - Se notifica cuando el stock ≤ mínimo configurado
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-700 dark:text-blue-400">Alertas de Vencimiento</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Activas - Se notifica 30 días antes de la fecha de vencimiento
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Movement Reports Tab */}
        {activeTab === 'movements' && (
          <div className="space-y-6">
            {/* Summary */}
            {movementData?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg ${themeColors.background.secondary} border ${themeColors.border.primary}`}>
                  <span className={`text-sm ${themeColors.text.secondary}`}>Total Movimientos</span>
                  <p className={`text-2xl font-bold ${themeColors.text.primary}`}>
                    {movementData.summary.totalMovements}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${themeColors.background.secondary} border ${themeColors.border.primary}`}>
                  <span className={`text-sm ${themeColors.text.secondary}`}>Entradas</span>
                  <p className="text-2xl font-bold text-green-600">+{movementData.summary.totalIn}</p>
                </div>
                <div className={`p-4 rounded-lg ${themeColors.background.secondary} border ${themeColors.border.primary}`}>
                  <span className={`text-sm ${themeColors.text.secondary}`}>Salidas</span>
                  <p className="text-2xl font-bold text-red-600">-{movementData.summary.totalOut}</p>
                </div>
                <div className={`p-4 rounded-lg ${themeColors.background.secondary} border ${themeColors.border.primary}`}>
                  <span className={`text-sm ${themeColors.text.secondary}`}>Cambio Neto</span>
                  <p className={`text-2xl font-bold ${movementData.summary.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {movementData.summary.netChange >= 0 ? '+' : ''}{movementData.summary.netChange}
                  </p>
                </div>
              </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={movementTypeFilter}
                onChange={(e) => {
                  setMovementTypeFilter(e.target.value);
                  setMovementPage(1);
                }}
                className="form-select text-sm"
              >
                <option value="">Todos los tipos</option>
                <option value="PURCHASE_IN">Compras</option>
                <option value="SALE_OUT">Ventas</option>
                <option value="RETURN_IN">Devoluciones</option>
                <option value="ADJUSTMENT_IN">Ajustes (+)</option>
                <option value="ADJUSTMENT_OUT">Ajustes (-)</option>
                <option value="TRANSFER_IN">Transferencias (+)</option>
                <option value="TRANSFER_OUT">Transferencias (-)</option>
                <option value="EXPIRY_OUT">Vencimientos</option>
              </select>
            </div>

            {/* Movements Table */}
            {movementLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${themeColors.border.primary}`}>
                        <th className={`text-left py-3 px-4 text-sm font-medium ${themeColors.text.secondary}`}>Fecha</th>
                        <th className={`text-left py-3 px-4 text-sm font-medium ${themeColors.text.secondary}`}>Producto</th>
                        <th className={`text-left py-3 px-4 text-sm font-medium ${themeColors.text.secondary}`}>Tipo</th>
                        <th className={`text-left py-3 px-4 text-sm font-medium ${themeColors.text.secondary}`}>Cantidad</th>
                        <th className={`text-left py-3 px-4 text-sm font-medium ${themeColors.text.secondary}`}>Responsable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movementData?.movements.map((movement) => (
                        <tr key={movement.id} className={`border-b ${themeColors.border.primary} hover:bg-gray-50 dark:hover:bg-gray-800/50`}>
                          <td className={`py-3 px-4 ${themeColors.text.primary}`}>{formatDate(movement.date)}</td>
                          <td className={`py-3 px-4 ${themeColors.text.primary}`}>{movement.itemName}</td>
                          <td className="py-3 px-4">
                            <Badge className={
                              movement.type.includes('IN') || movement.type.includes('RETURN')
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            }>
                              {MOVEMENT_TYPE_LABELS[movement.type] || movement.type}
                            </Badge>
                          </td>
                          <td className={`py-3 px-4 ${themeColors.text.primary}`}>
                            {movement.type.includes('OUT') ? '-' : '+'}{movement.quantity}
                          </td>
                          <td className={`py-3 px-4 ${themeColors.text.secondary}`}>
                            {movement.staffName || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!movementData?.movements || movementData.movements.length === 0) && (
                    <p className={`text-center py-8 ${themeColors.text.secondary}`}>
                      No hay movimientos registrados
                    </p>
                  )}
                </div>

                {/* Pagination */}
                {movementData && movementData.pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 pt-4">
                    <button
                      onClick={() => setMovementPage(p => Math.max(1, p - 1))}
                      disabled={movementPage === 1}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <span className={themeColors.text.secondary}>
                      Página {movementPage} de {movementData.pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setMovementPage(p => Math.min(movementData.pagination.totalPages, p + 1))}
                      disabled={movementPage === movementData.pagination.totalPages}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Expiration Tracking Tab */}
        {activeTab === 'expiration' && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-700 dark:text-yellow-400">
                  Productos que vencen en los próximos 30 días
                </span>
              </div>
            </div>

            {expirationLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${themeColors.border.primary}`}>
                      <th className={`text-left py-3 px-4 text-sm font-medium ${themeColors.text.secondary}`}>Producto</th>
                      <th className={`text-left py-3 px-4 text-sm font-medium ${themeColors.text.secondary}`}>Stock Actual</th>
                      <th className={`text-left py-3 px-4 text-sm font-medium ${themeColors.text.secondary}`}>Lote</th>
                      <th className={`text-left py-3 px-4 text-sm font-medium ${themeColors.text.secondary}`}>Fecha Vencimiento</th>
                      <th className={`text-left py-3 px-4 text-sm font-medium ${themeColors.text.secondary}`}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringItems.map((item) => {
                      const expDate = item.expirationDate ? new Date(item.expirationDate) : null;
                      const now = new Date();
                      const daysUntilExpiry = expDate ? Math.ceil((expDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : null;

                      return (
                        <tr key={item.id} className={`border-b ${themeColors.border.primary} hover:bg-gray-50 dark:hover:bg-gray-800/50`}>
                          <td className={`py-3 px-4 ${themeColors.text.primary}`}>{item.name}</td>
                          <td className={`py-3 px-4 ${themeColors.text.primary}`}>{item.quantity}</td>
                          <td className={`py-3 px-4 ${themeColors.text.secondary}`}>{item.batchNumber || '-'}</td>
                          <td className={`py-3 px-4 ${themeColors.text.primary}`}>
                            {item.expirationDate ? formatDate(item.expirationDate) : '-'}
                          </td>
                          <td className="py-3 px-4">
                            {daysUntilExpiry !== null && (
                              <Badge className={
                                daysUntilExpiry <= 0
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                  : daysUntilExpiry <= 7
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                              }>
                                {daysUntilExpiry <= 0 ? 'Vencido' : `${daysUntilExpiry} días`}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {expiringItems.length === 0 && (
                  <p className={`text-center py-8 ${themeColors.text.secondary}`}>
                    No hay productos próximos a vencer
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
