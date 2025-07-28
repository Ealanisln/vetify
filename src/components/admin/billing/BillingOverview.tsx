'use client';

import { useEffect, useState } from 'react';
import { 
  CurrencyDollarIcon, 
  CreditCardIcon, 
  BuildingOfficeIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

interface BillingStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  pendingPayments: number;
  revenueGrowth: number;
}

export function BillingOverview() {
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBillingStats = async () => {
      try {
        const response = await fetch('/api/admin/billing');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching billing stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-300">Error cargando estadísticas de facturación</p>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Ingresos Totales',
      value: new Intl.NumberFormat('es-MX', { 
        style: 'currency', 
        currency: 'MXN' 
      }).format(stats.totalRevenue),
      icon: CurrencyDollarIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900',
    },
    {
      name: 'Ingresos Mensuales',
      value: new Intl.NumberFormat('es-MX', { 
        style: 'currency', 
        currency: 'MXN' 
      }).format(stats.monthlyRevenue),
      icon: ChartBarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900',
    },
    {
      name: 'Suscripciones Activas',
      value: stats.activeSubscriptions.toString(),
      icon: BuildingOfficeIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900',
    },
    {
      name: 'Pagos Pendientes',
      value: stats.pendingPayments.toString(),
      icon: CreditCardIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <div key={stat.name} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.name}
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 