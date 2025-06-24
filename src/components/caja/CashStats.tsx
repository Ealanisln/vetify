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
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalRefunds: number;
  transactionCount: number;
  avgTicket: number;
  lastUpdate: string;
}

export function CashStats({ tenantId }: CashStatsProps) {
  const [stats, setStats] = useState<DayStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, [tenantId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/caja/stats?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching cash stats:', error);
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

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500 text-center">No hay datos disponibles</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "Ventas del Día",
      value: `$${stats.totalSales.toLocaleString()}`,
      description: `${stats.transactionCount} transacciones`,
      icon: ArrowTrendingUpIcon,
      color: "text-green-600"
    },
    {
      title: "Efectivo",
      value: `$${stats.totalCash.toLocaleString()}`,
      description: `${((stats.totalCash / stats.totalSales) * 100 || 0).toFixed(1)}% del total`,
      icon: CurrencyDollarIcon,
      color: "text-blue-600"
    },
    {
      title: "Tarjetas",
      value: `$${stats.totalCard.toLocaleString()}`,
      description: `${((stats.totalCard / stats.totalSales) * 100 || 0).toFixed(1)}% del total`,
      icon: CreditCardIcon,
      color: "text-purple-600"
    },
    {
      title: "Ticket Promedio",
      value: `$${stats.avgTicket.toLocaleString()}`,
      description: stats.totalRefunds > 0 ? `$${stats.totalRefunds.toLocaleString()} devoluciones` : "Sin devoluciones",
      icon: ReceiptRefundIcon,
      color: "text-orange-600"
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