'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChartBarIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  ArrowDownTrayIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import RevenueCharts from './RevenueCharts';
import CustomerAnalyticsComponent from './CustomerAnalytics';
import ServiceInventoryAnalytics from './ServiceInventoryAnalytics';
import { exportToCSV, RevenueAnalytics, CustomerAnalytics, ServiceAnalytics, InventoryAnalytics } from '@/lib/reports';

interface ReportsData {
  revenue: RevenueAnalytics;
  customers: CustomerAnalytics;
  services: ServiceAnalytics;
  inventory: InventoryAnalytics;
}

interface EnhancedReportsClientProps {
  reportsData: ReportsData;
}

const tabs = [
  { id: 'overview', name: 'Resumen', icon: ChartBarIcon },
  { id: 'revenue', name: 'Ingresos', icon: ChartBarIcon },
  { id: 'customers', name: 'Clientes', icon: UserGroupIcon },
  { id: 'services', name: 'Servicios e Inventario', icon: ShoppingCartIcon },
];

export default function EnhancedReportsClient({ reportsData }: EnhancedReportsClientProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleExport = (type: string) => {
    switch (type) {
      case 'revenue':
        exportToCSV([
          ...reportsData.revenue.dailySales,
          ...reportsData.revenue.monthlySales
        ], 'revenue-report');
        break;
      case 'customers':
        exportToCSV(reportsData.customers.topCustomers, 'customers-report');
        break;
      case 'services':
        exportToCSV(reportsData.services.topServices, 'services-report');
        break;
      case 'products':
        exportToCSV(reportsData.inventory.topProducts, 'products-report');
        break;
      default:
        // Export overview data
        const overviewData = [
          { metric: 'Ventas Hoy', value: reportsData.revenue.todaySales.total },
          { metric: 'Ventas Semana', value: reportsData.revenue.weekSales.total },
          { metric: 'Ventas Mes', value: reportsData.revenue.monthSales.total },
          { metric: 'Total Clientes', value: reportsData.customers.totalCustomers },
          { metric: 'Nuevos Clientes', value: reportsData.customers.newCustomersThisMonth },
          { metric: 'Valor Inventario', value: reportsData.inventory.inventoryValue },
        ];
        exportToCSV(overviewData, 'overview-report');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportsData.services.topServices.slice(0, 5).map((service, index: number) => (
                <div key={service.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
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

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportsData.customers.topCustomers.slice(0, 5).map((customer, index: number) => (
                <div key={customer.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-semibold">
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

  const renderContent = () => {
    switch (activeTab) {
      case 'revenue':
        return <RevenueCharts data={reportsData.revenue} />;
      case 'customers':
        return <CustomerAnalyticsComponent data={reportsData.customers} />;
      case 'services':
        return <ServiceInventoryAnalytics serviceData={reportsData.services} inventoryData={reportsData.inventory} />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Options */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reportes y Análisis</h1>
          <p className="text-muted-foreground">Panel completo de análisis de tu veterinaria</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleExport('overview')}
            className="flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Exportar Resumen
          </Button>
          
          {activeTab !== 'overview' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport(activeTab)}
              className="flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Exportar {tabs.find(t => t.id === activeTab)?.name}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
} 