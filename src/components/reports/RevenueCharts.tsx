'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  AreaChart, 
  Area, 
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
import { RevenueAnalytics } from '../../lib/reports';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface RevenueChartsProps {
  data: RevenueAnalytics;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export default function RevenueCharts({ data }: RevenueChartsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'd MMM', { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatMonth = (monthString: string) => {
    try {
      return format(parseISO(monthString + '-01'), 'MMM yyyy', { locale: es });
    } catch {
      return monthString;
    }
  };

  // Prepare data for daily sales chart
  const dailySalesData = data.dailySales.map(day => ({
    ...day,
    dateFormatted: formatDate(day.date)
  }));

  // Prepare data for monthly sales chart
  const monthlySalesData = data.monthlySales.map(month => ({
    ...month,
    monthFormatted: formatMonth(month.month)
  }));

  // Prepare comparison data
  const comparisonData = [
    { name: 'Hoy', value: data.todaySales.total, transactions: data.todaySales.count },
    { name: 'Esta Semana', value: data.weekSales.total, transactions: data.weekSales.count },
    { name: 'Este Mes', value: data.monthSales.total, transactions: data.monthSales.count },
    { name: 'Este Año', value: data.yearSales.total, transactions: data.yearSales.count }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Daily Sales Trend */}
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Tendencia de Ventas Diarias (Últimos 30 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailySalesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dateFormatted" 
                fontSize={12}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                fontSize={12}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Sales Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas Mensuales (Último Año)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySalesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="monthFormatted" 
                fontSize={12}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                labelFormatter={(label) => `Mes: ${label}`}
              />
              <Bar dataKey="total" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sales Comparison Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Ventas por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={comparisonData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Ventas']} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sales Performance Metrics */}
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Métricas de Rendimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(data.averageTicket)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Ticket Promedio
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data.monthlyGrowth > 0 ? '+' : ''}{data.monthlyGrowth.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Crecimiento Mensual
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {data.monthSales.count}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Transacciones del Mes
              </div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {data.yearSales.count}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Transacciones del Año
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 