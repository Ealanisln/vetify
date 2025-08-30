'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { 
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SalesData {
  todaySales: { total: number; count: number };
  weekSales: { total: number; count: number };
  monthSales: { total: number; count: number };
  recentSales: Array<{
    id: string;
    saleNumber: string;
    customerName: string;
    total: number;
    itemCount: number;
    paymentMethod: string;
    createdAt: Date;
    items: Array<{
      description: string;
      quantity: number;
      total: number;
    }>;
  }>;
  topServices: Array<{
    name: string;
    quantity: number;
    total: number;
    count: number;
  }>;
  topProducts: Array<{
    name: string;
    quantity: number;
    total: number;
    count: number;
  }>;
  dailySales: Array<{
    date: string;
    total: number;
    count: number;
  }>;
}

interface SalesReportsClientProps {
  salesData: SalesData;
}

export default function SalesReportsClient({ salesData }: SalesReportsClientProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getPaymentMethodBadge = (method: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      'CASH': { variant: 'default', label: 'Efectivo' },
      'CREDIT_CARD': { variant: 'secondary', label: 'Tarjeta Crédito' },
      'DEBIT_CARD': { variant: 'outline', label: 'Tarjeta Débito' },
      'BANK_TRANSFER': { variant: 'secondary', label: 'Transferencia' },
    };
    
    const config = variants[method] || { variant: 'outline' as const, label: method };
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(salesData.todaySales.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              {salesData.todaySales.count} transacciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Semana</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(salesData.weekSales.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              {salesData.weekSales.count} transacciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Mes</CardTitle>
            <ArrowTrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(salesData.monthSales.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              {salesData.monthSales.count} transacciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Venta</CardTitle>
            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesData.monthSales.count > 0 
                ? formatCurrency(salesData.monthSales.total / salesData.monthSales.count)
                : formatCurrency(0)
              }
            </div>
            <p className="text-xs text-muted-foreground">
              por transacción este mes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Servicios más vendidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5" />
              Servicios Más Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData.topServices.length > 0 ? (
                salesData.topServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{service.name}</p>
                      <p className="text-xs text-gray-500">
                        {service.count} ventas · {service.quantity} unidades
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(service.total)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No hay servicios vendidos este mes
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Productos más vendidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCartIcon className="h-5 w-5" />
              Productos Más Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData.topProducts.length > 0 ? (
                salesData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">
                        {product.count} ventas · {product.quantity} unidades
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(product.total)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No hay productos vendidos este mes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de ventas diarias - Simple bars */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas de los Últimos 7 Días</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesData.dailySales.length > 0 ? (
              <div className="grid grid-cols-7 gap-2">
                {salesData.dailySales.slice(-7).map((day, index) => {
                  const maxValue = Math.max(...salesData.dailySales.map(d => d.total));
                  const height = maxValue > 0 ? (day.total / maxValue) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded" style={{ height: '60px' }}>
                        <div 
                          className="bg-blue-500 rounded transition-all duration-300"
                          style={{ 
                            height: `${height}%`,
                            marginTop: `${100 - height}%`
                          }}
                        />
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-xs font-medium">
                          {format(new Date(day.date), 'dd/MM', { locale: es })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(day.total)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No hay datos de ventas para mostrar
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ventas recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesData.recentSales.length > 0 ? (
              salesData.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">#{sale.saleNumber}</p>
                        <p className="text-sm text-gray-500">{sale.customerName}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {sale.itemCount} items · {format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getPaymentMethodBadge(sale.paymentMethod)}
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(sale.total)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No hay ventas registradas
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 