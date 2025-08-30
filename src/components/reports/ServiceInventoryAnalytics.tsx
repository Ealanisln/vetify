'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { ServiceAnalytics, InventoryAnalytics } from '../../lib/reports';
import { 
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface ServiceInventoryAnalyticsProps {
  serviceData: ServiceAnalytics;
  inventoryData: InventoryAnalytics;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347'];

export default function ServiceInventoryAnalytics({ serviceData, inventoryData }: ServiceInventoryAnalyticsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Prepare top services chart data
  const topServicesChartData = serviceData.topServices.slice(0, 8).map(service => ({
    name: service.name.length > 20 ? service.name.slice(0, 20) + '...' : service.name,
    revenue: service.revenue,
    count: service.count
  }));

  // Prepare service categories chart data
  const serviceCategoriesData = serviceData.serviceCategories.map(category => ({
    name: category.category,
    revenue: category.revenue,
    count: category.count
  }));

  // Prepare top products chart data
  const topProductsChartData = inventoryData.topProducts.slice(0, 8).map(product => ({
    name: product.name.length > 20 ? product.name.slice(0, 20) + '...' : product.name,
    revenue: product.revenue,
    profit: product.profit,
    quantity: product.quantitySold
  }));

  return (
    <div className="space-y-6">
      {/* Inventory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
            <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(inventoryData.inventoryValue)}</div>
            <p className="text-xs text-muted-foreground">
              Total en inventario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
            <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventoryData.topProducts.reduce((sum, p) => sum + p.quantitySold, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <ExclamationTriangleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {inventoryData.lowStockItems.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Productos críticos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Services Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Servicios Más Rentables</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topServicesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Ingresos' : 'Cantidad'
                  ]}
                />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Categories Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceCategoriesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {serviceCategoriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Ingresos']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'revenue' || name === 'profit' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Ingresos' : name === 'profit' ? 'Ganancia' : 'Cantidad'
                  ]}
                />
                <Bar dataKey="revenue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Profitability */}
        <Card>
          <CardHeader>
            <CardTitle>Rentabilidad de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Ganancia']}
                />
                <Bar dataKey="profit" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Services Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceData.topServices.length > 0 ? (
                serviceData.topServices.map((service, index) => (
                  <div 
                    key={service.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full font-semibold text-xs">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{service.name}</h4>
                        <p className="text-xs text-gray-500">
                          {service.count} servicios • {formatCurrency(service.averagePrice)} promedio
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(service.revenue)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No hay datos de servicios disponibles
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryData.topProducts.length > 0 ? (
                inventoryData.topProducts.map((product, index) => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full font-semibold text-xs">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        <p className="text-xs text-gray-500">
                          {product.quantitySold} unidades • {formatCurrency(product.profit)} ganancia
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(product.revenue)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No hay datos de productos disponibles
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {inventoryData.lowStockItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
              Productos con Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventoryData.lowStockItems.map((item) => (
                <div key={item.id} className="p-4 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <h4 className="font-medium text-sm text-orange-800 dark:text-orange-200">{item.name}</h4>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      Stock actual: {item.currentStock}
                    </span>
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:text-orange-300">
                      Mín: {item.minStock}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 