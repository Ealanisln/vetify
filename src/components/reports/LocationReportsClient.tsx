'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  ChartBarIcon,
  CubeIcon,
  ClipboardDocumentCheckIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  UsersIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import LocationSelector from '../locations/LocationSelector';
import LocationMultiSelector from '../locations/LocationMultiSelector';
import { exportToCSV } from '../../lib/reports';
import type {
  LocationRevenueAnalytics,
  LocationInventoryAnalytics,
  LocationPerformanceMetrics,
  LocationComparison,
} from '../../lib/reports-location';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type TabValue = 'ventas' | 'inventario' | 'rendimiento' | 'comparacion';

interface LocationReportsData {
  revenue: LocationRevenueAnalytics;
  inventory: LocationInventoryAnalytics;
  performance: LocationPerformanceMetrics;
}

// Rank medals for comparison table
const RANK_MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

// Chart colors for comparison bars
const CHART_COLORS = [
  '#75a99c', // primary teal
  '#5b9788', // darker teal
  '#8bb8ad', // lighter teal
  '#4a7d72', // dark teal
  '#9ec7be', // light teal
];

export default function LocationReportsClient() {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedLocationName, setSelectedLocationName] = useState<string>('');
  const [reportsData, setReportsData] = useState<LocationReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('ventas');

  // Comparison state
  const [comparisonLocationIds, setComparisonLocationIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<LocationComparison[] | null>(null);
  const [isComparisonLoading, setIsComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const fetchReports = useCallback(async (locationId: string) => {
    if (!locationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/reports/location?locationId=${locationId}&type=all`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar reportes');
      }

      const data = await response.json();
      setReportsData(data);
    } catch (err) {
      console.error('Error fetching location reports:', err);
      setError(
        err instanceof Error ? err.message : 'Error al cargar reportes'
      );
      setReportsData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLocationId) {
      fetchReports(selectedLocationId);
    }
  }, [selectedLocationId, fetchReports]);

  // Fetch comparison data
  const fetchComparisonData = useCallback(async (locationIds: string[]) => {
    if (locationIds.length < 2) {
      setComparisonData(null);
      return;
    }

    setIsComparisonLoading(true);
    setComparisonError(null);

    try {
      const response = await fetch(
        `/api/reports/location?compare=true&locationIds=${locationIds.join(',')}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar comparación');
      }

      const data = await response.json();
      setComparisonData(data.comparison);
    } catch (err) {
      console.error('Error fetching comparison data:', err);
      setComparisonError(
        err instanceof Error ? err.message : 'Error al cargar comparación'
      );
      setComparisonData(null);
    } finally {
      setIsComparisonLoading(false);
    }
  }, []);

  // Fetch comparison when locations change and tab is active
  useEffect(() => {
    if (activeTab === 'comparacion' && comparisonLocationIds.length >= 2) {
      fetchComparisonData(comparisonLocationIds);
    }
  }, [activeTab, comparisonLocationIds, fetchComparisonData]);

  const handleLocationChange = (locationId: string) => {
    setSelectedLocationId(locationId);
    // Get location name from the selector for export filenames
    const locationElement = document.querySelector(
      `option[value="${locationId}"]`
    );
    if (locationElement) {
      setSelectedLocationName(locationElement.textContent?.replace(' (Principal)', '') || 'ubicacion');
    }
  };

  // Export handlers
  const handleExportRevenue = () => {
    if (!reportsData) return;
    const data = [
      { metric: 'Ventas Hoy', total: reportsData.revenue.todaySales.total, transacciones: reportsData.revenue.todaySales.count },
      { metric: 'Ventas Semana', total: reportsData.revenue.weekSales.total, transacciones: reportsData.revenue.weekSales.count },
      { metric: 'Ventas Mes', total: reportsData.revenue.monthSales.total, transacciones: reportsData.revenue.monthSales.count },
      { metric: 'Ventas Año', total: reportsData.revenue.yearSales.total, transacciones: reportsData.revenue.yearSales.count },
      { metric: 'Ticket Promedio', total: reportsData.revenue.averageTicket, transacciones: '-' },
      { metric: 'Crecimiento Mensual', total: `${reportsData.revenue.monthlyGrowth.toFixed(1)}%`, transacciones: '-' },
    ];
    exportToCSV(data, `ventas-${selectedLocationName}`);
  };

  const handleExportInventory = () => {
    if (!reportsData) return;
    const data = reportsData.inventory.topProducts.map((p) => ({
      producto: p.name,
      ingresos: p.revenue,
      cantidad_vendida: p.quantitySold,
      ganancia: p.profit,
    }));
    exportToCSV(data, `inventario-${selectedLocationName}`);
  };

  const handleExportPerformance = () => {
    if (!reportsData) return;
    const data = [
      { categoria: 'Citas', metrica: 'Total', valor: reportsData.performance.appointments.total },
      { categoria: 'Citas', metrica: 'Completadas', valor: reportsData.performance.appointments.completed },
      { categoria: 'Citas', metrica: 'Canceladas', valor: reportsData.performance.appointments.cancelled },
      { categoria: 'Citas', metrica: 'No Shows', valor: reportsData.performance.appointments.noShow },
      { categoria: 'Citas', metrica: 'Tasa Completación', valor: `${reportsData.performance.appointments.completionRate.toFixed(1)}%` },
      { categoria: 'Clientes', metrica: 'Total', valor: reportsData.performance.customers.total },
      { categoria: 'Clientes', metrica: 'Nuevos', valor: reportsData.performance.customers.new },
      { categoria: 'Clientes', metrica: 'Activos', valor: reportsData.performance.customers.active },
      { categoria: 'Clientes', metrica: 'Retención', valor: `${reportsData.performance.customers.retentionRate.toFixed(1)}%` },
      { categoria: 'Personal', metrica: 'Total', valor: reportsData.performance.staff.total },
      { categoria: 'Personal', metrica: 'Activos', valor: reportsData.performance.staff.active },
      { categoria: 'Personal', metrica: 'Citas por Staff', valor: reportsData.performance.staff.appointmentsPerStaff.toFixed(1) },
    ];
    exportToCSV(data, `rendimiento-${selectedLocationName}`);
  };

  const handleExportComparison = () => {
    if (!comparisonData) return;
    const data = comparisonData.map((loc) => ({
      ranking: loc.rank,
      ubicacion: loc.locationName,
      ingresos: loc.revenue,
      citas: loc.appointments,
      clientes: loc.customers,
      valor_inventario: loc.inventoryValue,
      ticket_promedio: loc.averageTicket,
    }));
    exportToCSV(data, 'comparacion-ubicaciones');
  };

  // Calculate comparison totals
  const comparisonTotals = comparisonData
    ? {
        totalRevenue: comparisonData.reduce((sum, loc) => sum + loc.revenue, 0),
        totalAppointments: comparisonData.reduce((sum, loc) => sum + loc.appointments, 0),
        averageTicket:
          comparisonData.reduce((sum, loc) => sum + loc.averageTicket, 0) /
          comparisonData.length,
        locationCount: comparisonData.length,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reportes por Ubicación</h1>
          <p className="text-muted-foreground">
            {activeTab === 'comparacion'
              ? 'Compara el rendimiento entre sucursales'
              : 'Métricas y análisis por sucursal'}
          </p>
        </div>

        <div className="w-full sm:w-80">
          {activeTab === 'comparacion' ? (
            <LocationMultiSelector
              value={comparisonLocationIds}
              onChange={setComparisonLocationIds}
              minSelected={2}
            />
          ) : (
            <LocationSelector
              value={selectedLocationId}
              onChange={handleLocationChange}
              defaultToPrimary={true}
            />
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#75a99c]"></div>
          <span className="ml-3 text-muted-foreground">Cargando reportes...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && !reportsData && !selectedLocationId && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecciona una ubicación para ver los reportes</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports Content - Show when data is loaded OR comparison tab is active */}
      {(!isLoading && !error && reportsData) || activeTab === 'comparacion' ? (
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="grid w-full grid-cols-4 gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => setActiveTab('ventas')}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'ventas'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ChartBarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Ventas</span>
            </button>
            <button
              onClick={() => setActiveTab('inventario')}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'inventario'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CubeIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Inventario</span>
            </button>
            <button
              onClick={() => setActiveTab('rendimiento')}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'rendimiento'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ClipboardDocumentCheckIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Rendimiento</span>
            </button>
            <button
              onClick={() => setActiveTab('comparacion')}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'comparacion'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ArrowsRightLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Comparación</span>
            </button>
          </div>

          {/* Ventas Tab */}
          {activeTab === 'ventas' && (
            <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportRevenue}
                className="flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Today's Sales */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hoy</CardTitle>
                  <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(reportsData.revenue.todaySales.total)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reportsData.revenue.todaySales.count} transacciones
                  </p>
                </CardContent>
              </Card>

              {/* Week Sales */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Semana</CardTitle>
                  <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(reportsData.revenue.weekSales.total)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reportsData.revenue.weekSales.count} transacciones
                  </p>
                </CardContent>
              </Card>

              {/* Month Sales */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mes</CardTitle>
                  <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(reportsData.revenue.monthSales.total)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={
                        reportsData.revenue.monthlyGrowth >= 0
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {formatPercent(reportsData.revenue.monthlyGrowth)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Average Ticket */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ticket Promedio
                  </CardTitle>
                  <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(reportsData.revenue.averageTicket)}
                  </div>
                  <p className="text-xs text-muted-foreground">Este mes</p>
                </CardContent>
              </Card>
            </div>

            {/* Year Total */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Ventas del Año
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(reportsData.revenue.yearSales.total)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {reportsData.revenue.yearSales.count} transacciones totales
                </p>
              </CardContent>
            </Card>
            </div>
          )}

          {/* Inventario Tab */}
          {activeTab === 'inventario' && (
            <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportInventory}
                className="flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Inventory Value */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Valor Total
                  </CardTitle>
                  <CubeIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(reportsData.inventory.inventoryValue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reportsData.inventory.totalItems} productos
                  </p>
                </CardContent>
              </Card>

              {/* Low Stock Alert */}
              <Card
                className={
                  reportsData.inventory.lowStockCount > 0
                    ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800'
                    : ''
                }
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Stock Bajo
                  </CardTitle>
                  <ExclamationTriangleIcon
                    className={`h-4 w-4 ${
                      reportsData.inventory.lowStockCount > 0
                        ? 'text-amber-600'
                        : 'text-muted-foreground'
                    }`}
                  />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      reportsData.inventory.lowStockCount > 0
                        ? 'text-amber-700 dark:text-amber-400'
                        : ''
                    }`}
                  >
                    {reportsData.inventory.lowStockCount}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    productos por reabastecer
                  </p>
                </CardContent>
              </Card>

              {/* Categories */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Categorías
                  </CardTitle>
                  <CubeIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportsData.inventory.categories.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    categorías activas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Top 5 Productos Más Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportsData.inventory.topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay ventas de productos este mes
                  </p>
                ) : (
                  <div className="space-y-3">
                    {reportsData.inventory.topProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            #{index + 1}
                          </span>
                          <span className="font-medium">{product.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(product.revenue)}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Ganancia: {formatCurrency(product.profit)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          )}

          {/* Rendimiento Tab */}
          {activeTab === 'rendimiento' && (
            <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPerformance}
                className="flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>

            {/* Appointments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardDocumentCheckIcon className="h-5 w-5" />
                  Citas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="text-2xl font-bold">
                      {reportsData.performance.appointments.total}
                    </div>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {reportsData.performance.appointments.completed}
                    </div>
                    <p className="text-xs text-muted-foreground">Completadas</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                      {reportsData.performance.appointments.cancelled}
                    </div>
                    <p className="text-xs text-muted-foreground">Canceladas</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                      {reportsData.performance.appointments.noShow}
                    </div>
                    <p className="text-xs text-muted-foreground">No Shows</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {reportsData.performance.appointments.completionRate.toFixed(
                        1
                      )}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tasa Completación
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customers Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5" />
                  Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="text-2xl font-bold">
                      {reportsData.performance.customers.total}
                    </div>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {reportsData.performance.customers.new}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Nuevos (mes)
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {reportsData.performance.customers.active}
                    </div>
                    <p className="text-xs text-muted-foreground">Activos</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                      {reportsData.performance.customers.retentionRate.toFixed(
                        1
                      )}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">Retención</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Staff Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5" />
                  Personal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="text-2xl font-bold">
                      {reportsData.performance.staff.total}
                    </div>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {reportsData.performance.staff.active}
                    </div>
                    <p className="text-xs text-muted-foreground">Activos</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {reportsData.performance.staff.appointmentsPerStaff.toFixed(
                        1
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Citas por Staff
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {/* Comparación Tab */}
          {activeTab === 'comparacion' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportComparison}
                  disabled={!comparisonData}
                  className="flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>

              {/* Comparison Loading */}
              {isComparisonLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#75a99c]"></div>
                  <span className="ml-3 text-muted-foreground">Cargando comparación...</span>
                </div>
              )}

              {/* Comparison Error */}
              {comparisonError && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span>{comparisonError}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comparison Empty State */}
              {!isComparisonLoading && !comparisonError && comparisonLocationIds.length < 2 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <ArrowsRightLeftIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Selecciona al menos 2 ubicaciones para comparar</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comparison Data */}
              {!isComparisonLoading && !comparisonError && comparisonData && comparisonTotals && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
                        <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(comparisonTotals.totalRevenue)}
                        </div>
                        <p className="text-xs text-muted-foreground">Este mes</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Citas</CardTitle>
                        <ClipboardDocumentCheckIcon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {comparisonTotals.totalAppointments}
                        </div>
                        <p className="text-xs text-muted-foreground">Este mes</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                        <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(comparisonTotals.averageTicket)}
                        </div>
                        <p className="text-xs text-muted-foreground">Promedio general</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ubicaciones</CardTitle>
                        <ArrowsRightLeftIcon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {comparisonTotals.locationCount}
                        </div>
                        <p className="text-xs text-muted-foreground">Comparando</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Revenue Comparison Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Comparación de Ingresos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={comparisonData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            tickFormatter={(value) => formatCurrency(value)}
                          />
                          <YAxis
                            dataKey="locationName"
                            type="category"
                            width={120}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip
                            formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                          />
                          <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                            {comparisonData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Performance Rankings Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Ranking de Ubicaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rank</th>
                              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ubicación</th>
                              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Ingresos</th>
                              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Citas</th>
                              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Clientes</th>
                              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Ticket Prom.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonData
                              .sort((a, b) => a.rank - b.rank)
                              .map((location) => (
                                <tr
                                  key={location.locationId}
                                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                  <td className="py-3 px-4">
                                    <span className="text-lg">
                                      {RANK_MEDALS[location.rank] || location.rank}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-medium">{location.locationName}</td>
                                  <td className="py-3 px-4 text-right font-semibold text-green-600 dark:text-green-400">
                                    {formatCurrency(location.revenue)}
                                  </td>
                                  <td className="py-3 px-4 text-right">{location.appointments}</td>
                                  <td className="py-3 px-4 text-right">{location.customers}</td>
                                  <td className="py-3 px-4 text-right">{formatCurrency(location.averageTicket)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
