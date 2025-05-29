interface StatsCardProps {
  title: string;
  value: number;
  limit?: number;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({ title, value, limit, icon, trend }: StatsCardProps) {
  const percentage = limit ? (value / limit) * 100 : 0;
  const isNearLimit = percentage > 80;

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-card rounded-lg border border-[#d5e3df] dark:border-gray-700">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-2xl">{icon}</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {value}
                  {limit && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                      / {limit}
                    </span>
                  )}
                </div>
                {trend && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {trend.isPositive ? '↗' : '↘'} {trend.value}%
                  </div>
                )}
              </dd>
            </dl>
            {limit && (
              <div className="mt-2">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isNearLimit ? 'bg-yellow-500' : 'bg-[#75a99c]'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                {isNearLimit && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Cerca del límite de tu plan
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 