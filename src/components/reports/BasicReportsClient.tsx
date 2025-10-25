'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  ChartBarIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  ArrowDownTrayIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { exportToCSV, RevenueAnalytics, CustomerAnalytics, ServiceAnalytics, InventoryAnalytics } from '../../lib/reports';

interface ReportsData {
  revenue: RevenueAnalytics;
  customers: CustomerAnalytics;
  services: ServiceAnalytics;
  inventory: InventoryAnalytics;
}

interface BasicReportsClientProps {
  reportsData: ReportsData;
}

/**
 * Basic Reports Component for Plan Básico
 *
 * Features:
 * - Key metrics overview (4 cards)
 * - Simple top 5 lists (services & customers)
 * - Basic CSV export (overview only)
 * - No advanced charts or analytics
 */
export default function BasicReportsClient({ reportsData }: BasicReportsClientProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleExportOverview = () => {
    const overviewData = [
      { metric: 'Ventas Hoy', value: reportsData.revenue.todaySales.total },
      { metric: 'Ventas Semana', value: reportsData.revenue.weekSales.total },
      { metric: 'Ventas Mes', value: reportsData.revenue.monthSales.total },
      { metric: 'Total Clientes', value: reportsData.customers.totalCustomers },
      { metric: 'Nuevos Clientes', value: reportsData.customers.newCustomersThisMonth },
      { metric: 'Valor Inventario', value: reportsData.inventory.inventoryValue },
    ];
    exportToCSV(overviewData, 'resumen-basico');
  };

  return (
    <div className="space-y-6">
      {/* Header with Basic Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reportes Básicos</h1>
          <p className="text-muted-foreground">Resumen general de tu veterinaria</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportOverview}
          className="flex items-center gap-2"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Exportar Resumen
        </Button>
      </div>

      {/* Key Metrics Overview - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Monthly Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportsData.revenue.monthSales.total)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={reportsData.revenue.monthlyGrowth >= 0 ? "default" : "destructive"}>
                {reportsData.revenue.monthlyGrowth >= 0 ? '+' : ''}{reportsData.revenue.monthlyGrowth.toFixed(1)}%
              </Badge>
              <span className="text-xs text-muted-foreground">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Active Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsData.customers.totalCustomers}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">
                +{reportsData.customers.newCustomersThisMonth}
              </Badge>
              <span className="text-xs text-muted-foreground">nuevos este mes</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Average Ticket */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportsData.revenue.averageTicket)}
            </div>
            <p className="text-xs text-muted-foreground">
              {reportsData.revenue.monthSales.count} transacciones
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Inventory Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventario</CardTitle>
            <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportsData.inventory.inventoryValue)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {reportsData.inventory.lowStockItems.length > 0 && (
                <Badge variant="destructive">
                  {reportsData.inventory.lowStockItems.length} críticos
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">valor total</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights - Top 5 Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Services */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportsData.services.topServices.slice(0, 5).map((service, index: number) => (
                <div key={service.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(service.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportsData.customers.topCustomers.slice(0, 5).map((customer, index: number) => (
                <div key={customer.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-full flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">{customer.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(customer.totalSpent)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
