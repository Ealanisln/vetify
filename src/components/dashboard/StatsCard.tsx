interface StatsCardProps {
  title: string;
  value: number;
  limit?: number;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, limit, icon, trend, className = "" }: StatsCardProps) {
  const percentage = limit ? (value / limit) * 100 : 0;
  const isNearLimit = percentage > 80;

  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="card-content">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-xl sm:text-2xl">{icon}</span>
          </div>
          <div className="ml-3 sm:ml-5 w-0 flex-1 min-w-0">
            <dl>
              <dt className="text-sm font-medium text-muted-foreground truncate">
                {title}
              </dt>
              <dd className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-0">
                <div className="text-xl sm:text-2xl font-semibold text-foreground">
                  {value.toLocaleString()}
                  {limit && (
                    <span className="text-xs sm:text-sm text-muted-foreground ml-1">
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
            {limit && (
              <div className="mt-3">
                <div className="bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isNearLimit
                        ? 'bg-yellow-500 dark:bg-yellow-400'
                        : 'bg-primary'
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
                  <span className="text-xs text-muted-foreground ml-auto">
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