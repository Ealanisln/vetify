'use client';

import { useMemo } from 'react';

interface RevenueData {
  month: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const maxRevenue = useMemo(() => {
    return Math.max(...data.map(item => item.revenue), 1);
  }, [data]);

  const totalRevenue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.revenue, 0);
  }, [data]);

  const averageRevenue = useMemo(() => {
    return data.length > 0 ? totalRevenue / data.length : 0;
  }, [totalRevenue, data.length]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Ingresos por Mes
        </h3>
        <div className="flex items-center space-x-6 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total: </span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${totalRevenue.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Promedio: </span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${Math.round(averageRevenue).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No hay datos de ingresos disponibles
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chart bars */}
          <div className="flex items-end space-x-2 h-64">
            {data.map((item, index) => {
              const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
              const isCurrentMonth = index === data.length - 1;
              
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center">
                  <div className="flex-1 flex items-end w-full">
                    <div
                      className={`w-full rounded-t transition-all duration-500 hover:opacity-80 ${
                        isCurrentMonth
                          ? 'bg-emerald-500'
                          : 'bg-emerald-300 dark:bg-emerald-600'
                      }`}
                      style={{ height: `${height}%` }}
                      title={`${item.month}: $${item.revenue.toLocaleString()}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Month labels */}
          <div className="flex space-x-2">
            {data.map((item) => (
              <div key={item.month} className="flex-1 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.month}
                </span>
              </div>
            ))}
          </div>

          {/* Revenue values */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {data.slice(-4).map((item) => (
              <div key={item.month} className="text-center">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  ${item.revenue.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {item.month}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-emerald-300 dark:bg-emerald-600 rounded" />
          <span>Meses anteriores</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-emerald-500 rounded" />
          <span>Mes actual</span>
        </div>
      </div>
    </div>
  );
} 