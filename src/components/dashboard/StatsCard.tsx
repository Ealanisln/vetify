interface StatsCardProps {
  title: string;
  value: number | string;
  limit?: number;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, limit, icon, trend, className = "" }: StatsCardProps) {
  const isNumeric = typeof value === 'number';
  const percentage = limit && isNumeric ? (value / limit) * 100 : 0;
  const isNearLimit = percentage > 80;

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden ${className}`}>
      <div className="p-4 md:p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-xl sm:text-2xl">{icon}</span>
          </div>
          <div className="ml-3 sm:ml-4 w-0 flex-1 min-w-0">
            <dl>
              <dt className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-0 mt-1">
                <div className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {isNumeric ? value.toLocaleString() : value}
                  {limit && isNumeric && (
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-1">
                      / {limit.toLocaleString()}
                    </span>
                  )}
                </div>
                {trend && (
                  <div className={`flex items-baseline text-xs sm:text-sm font-semibold sm:ml-2 ${
                    trend.isPositive
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    <span className="mr-1">{trend.isPositive ? '↗' : '↘'}</span>
                    {Math.abs(trend.value)}%
                  </div>
                )}
              </dd>
            </dl>
            {limit && isNumeric && (
              <div className="mt-2 sm:mt-3">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isNearLimit
                        ? 'bg-yellow-500 dark:bg-yellow-400'
                        : 'bg-blue-600 dark:bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  {isNearLimit && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Cerca del límite
                    </p>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 