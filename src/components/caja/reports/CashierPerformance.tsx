'use client';

import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface CashierData {
  cashierId: string;
  cashierName: string;
  shiftCount: number;
  totalHours: number;
  transactionCount: number;
  totalDifference: number;
  accuracy: number;
}

interface CashierPerformanceProps {
  data: CashierData[];
  loading?: boolean;
}

export function CashierPerformance({ data, loading }: CashierPerformanceProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy >= 95) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircleIcon className="h-3 w-3" />
          {accuracy}%
        </span>
      );
    } else if (accuracy >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
          <ExclamationTriangleIcon className="h-3 w-3" />
          {accuracy}%
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <ExclamationTriangleIcon className="h-3 w-3" />
          {accuracy}%
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        </div>
        <div className="animate-pulse p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <p className="text-sm text-muted-foreground">No hay datos de cajeros en este período</p>
      </div>
    );
  }

  // Sort by accuracy descending
  const sortedData = [...data].sort((a, b) => b.accuracy - a.accuracy);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-foreground">Rendimiento por Cajero</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Precisión = % de turnos sin diferencia
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Cajero
              </th>
              <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Turnos
              </th>
              <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  Horas
                </span>
              </th>
              <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Txns
              </th>
              <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Diferencia
              </th>
              <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Precisión
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.map((cashier) => (
              <tr key={cashier.cashierId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 text-sm font-medium text-foreground">
                  {cashier.cashierName}
                </td>
                <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                  {cashier.shiftCount}
                </td>
                <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                  {cashier.totalHours}h
                </td>
                <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                  {cashier.transactionCount}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  cashier.totalDifference === 0
                    ? 'text-green-600 dark:text-green-400'
                    : cashier.totalDifference > 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(cashier.totalDifference)}
                </td>
                <td className="px-4 py-3 text-center">
                  {getAccuracyBadge(cashier.accuracy)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
