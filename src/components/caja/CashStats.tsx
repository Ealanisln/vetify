'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ReceiptRefundIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

interface CashStatsProps {
  tenantId: string;
}

interface DayStats {
  totalIncome: number;
  totalExpenses: number;
  netTotal: number;
  transactionCount: number;
  currentBalance: number;
  isDrawerOpen: boolean;
}

export function CashStats({ tenantId }: CashStatsProps) {
  const [stats, setStats] = useState<DayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, [tenantId]);

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/caja/stats?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Cash stats data:', data); // Debug log
        setStats(data);
      } else {
        throw new Error('Error al obtener estadísticas');
      }
    } catch (error) {
      console.error('Error fetching cash stats:', error);
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500 text-center">
              {error || "No hay datos disponibles"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Función helper para formatear números de manera segura
  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '$0';
    }
    return `$${value.toLocaleString('es-MX', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Calcular porcentajes de manera segura
  const calculatePercentage = (part: number, total: number): string => {
    if (!total || total === 0 || !part) return '0.0';
    return ((part / total) * 100).toFixed(1);
  };

  const statCards = [
    {
      title: "Ingresos del Día",
      value: formatCurrency(stats.totalIncome),
      description: `${stats.transactionCount || 0} transacciones`,
      icon: ArrowTrendingUpIcon,
      color: "text-green-600"
    },
    {
      title: "Balance Actual",
      value: formatCurrency(stats.currentBalance),
      description: stats.isDrawerOpen ? "Cajón abierto" : "Cajón cerrado",
      icon: CurrencyDollarIcon,
      color: "text-blue-600"
    },
    {
      title: "Gastos del Día",
      value: formatCurrency(stats.totalExpenses),
      description: `${calculatePercentage(stats.totalExpenses, stats.totalIncome)}% del total`,
      icon: ReceiptRefundIcon,
      color: "text-red-600"
    },
    {
      title: "Ganancia Neta",
      value: formatCurrency(stats.netTotal),
      description: stats.netTotal >= 0 ? "Resultado positivo" : "Resultado negativo",
      icon: CreditCardIcon,
      color: stats.netTotal >= 0 ? "text-green-600" : "text-red-600"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stat.value}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 