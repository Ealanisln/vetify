'use client';

import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DrawerData {
  drawerId: string;
  locationId: string | null;
  income: number;
  expenses: number;
  net: number;
  transactionCount: number;
  shiftCount: number;
  totalDifference: number;
}

interface DrawerComparisonProps {
  data: DrawerData[];
  loading?: boolean;
}

export function DrawerComparison({ data, loading }: DrawerComparisonProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
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
        <p className="text-sm text-muted-foreground">No hay datos de cajas en este período</p>
      </div>
    );
  }

  // Calculate totals
  const totals = data.reduce(
    (acc, d) => ({
      income: acc.income + d.income,
      expenses: acc.expenses + d.expenses,
      net: acc.net + d.net,
      transactionCount: acc.transactionCount + d.transactionCount,
      shiftCount: acc.shiftCount + d.shiftCount,
      totalDifference: acc.totalDifference + d.totalDifference
    }),
    { income: 0, expenses: 0, net: 0, transactionCount: 0, shiftCount: 0, totalDifference: 0 }
  );

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-foreground">Comparativa por Caja</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Caja
              </th>
              <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ingresos
              </th>
              <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Egresos
              </th>
              <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Neto
              </th>
              <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Txns
              </th>
              <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Turnos
              </th>
              <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Diferencia
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((drawer, index) => (
              <tr key={drawer.drawerId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 text-sm font-medium text-foreground">
                  Caja {index + 1}
                </td>
                <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                  {formatCurrency(drawer.income)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">
                  {formatCurrency(drawer.expenses)}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  drawer.net >= 0 ? 'text-foreground' : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(drawer.net)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                  {drawer.transactionCount}
                </td>
                <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                  {drawer.shiftCount}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {drawer.totalDifference === 0 ? (
                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>OK</span>
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 ${
                      drawer.totalDifference > 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <span>{formatCurrency(drawer.totalDifference)}</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-300 dark:border-gray-600">
            <tr>
              <td className="px-4 py-3 text-sm font-semibold text-foreground">
                Total
              </td>
              <td className="px-4 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(totals.income)}
              </td>
              <td className="px-4 py-3 text-sm text-right font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(totals.expenses)}
              </td>
              <td className={`px-4 py-3 text-sm text-right font-semibold ${
                totals.net >= 0 ? 'text-foreground' : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(totals.net)}
              </td>
              <td className="px-4 py-3 text-sm text-right font-semibold text-foreground">
                {totals.transactionCount}
              </td>
              <td className="px-4 py-3 text-sm text-right font-semibold text-foreground">
                {totals.shiftCount}
              </td>
              <td className={`px-4 py-3 text-sm text-right font-semibold ${
                totals.totalDifference === 0
                  ? 'text-green-600 dark:text-green-400'
                  : totals.totalDifference > 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(totals.totalDifference)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
