'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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
import { CustomerAnalytics as CustomerAnalyticsType } from '../../lib/reports';
import { 
  UserGroupIcon,
  ArrowTrendingUpIcon,
  HeartIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CustomerAnalyticsProps {
  data: CustomerAnalyticsType;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export default function CustomerAnalytics({ data }: CustomerAnalyticsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Prepare customer segmentation data
  const segmentationData = [
    { name: 'Nuevos (Este Mes)', value: data.newCustomersThisMonth },
    { name: 'Activos', value: data.activeCustomers },
    { name: 'Inactivos', value: data.totalCustomers - data.activeCustomers }
  ];

  // Prepare top customers data for chart
  const topCustomersChartData = data.topCustomers.slice(0, 8).map(customer => ({
    name: customer.name.length > 15 ? customer.name.slice(0, 15) + '...' : customer.name,
    totalSpent: customer.totalSpent,
    visits: customer.visitCount
  }));

  return (
    <div className="space-y-6">
      {/* Customer Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Clientes registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Este Mes</CardTitle>
            <ArrowTrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.newCustomersThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              <span className={data.customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {data.customerGrowth >= 0 ? '+' : ''}{data.customerGrowth.toFixed(1)}%
              </span> vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <HeartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 3 meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retención</CardTitle>
            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.customerRetention.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Tasa de retención
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Customer Segmentation */}
        <Card>
          <CardHeader>
            <CardTitle>Segmentación de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={segmentationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {segmentationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Customers by Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Top Clientes por Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCustomersChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  fontSize={12}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Total Gastado']}
                />
                <Bar dataKey="totalSpent" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mejores Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid gap-4">
              {data.topCustomers.length > 0 ? (
                data.topCustomers.map((customer, index) => (
                  <div 
                    key={customer.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{customer.name}</h4>
                        <p className="text-sm text-gray-500">
                          {customer.visitCount} {customer.visitCount === 1 ? 'visita' : 'visitas'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(customer.totalSpent)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Última visita: {format(customer.lastVisit, 'd MMM yyyy', { locale: es })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay datos de clientes disponibles
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {data.topCustomers.length > 0 
                  ? formatCurrency(data.topCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / data.topCustomers.length)
                  : formatCurrency(0)
                }
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Gasto Promedio Top 10
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {data.topCustomers.length > 0 
                  ? Math.round(data.topCustomers.reduce((sum, c) => sum + c.visitCount, 0) / data.topCustomers.length)
                  : 0
                }
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Visitas Promedio Top 10
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {((data.activeCustomers / data.totalCustomers) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Clientes Activos
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 